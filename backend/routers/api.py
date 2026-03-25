"""REST API endpoints."""

from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, Query
from pydantic import BaseModel

from models.persona_engine import FEATURE_KEYS
from models.schemas import PERSONA_META, PersonaDetailStats, PersonaSummary, PersonaType, SessionResponse
from services.metrics_tracker import tracker
from services.profile_store import store

router = APIRouter(prefix="/api", tags=["api"])

# Load products at module level
_products_path = Path(__file__).parent.parent / "data" / "products.json"
with open(_products_path) as f:
    PRODUCTS = json.load(f)
_products_by_id = {p["id"]: p for p in PRODUCTS}


# ── Request models ────────────────────────────────────────────────────────────

class NewCustomerRequest(BaseModel):
    """Full customer profile for registration and persona assignment."""
    first_name: str = "New"
    last_name: str = "Customer"
    email: str = "new@example.com"
    age: int = 30
    # Behavioral features used for persona prediction
    tech_affinity: float = 0.5
    price_sensitivity: float = 0.5
    deal_seeking_score: float = 0.5
    research_depth: float = 0.5
    brand_loyalty_score: float = 0.5
    avg_order_value: float = 300.0
    lifetime_spend: float = 5000.0
    total_site_visits_90d: int = 20
    avg_session_duration_min: float = 8.0
    cart_abandonment_rate: float = 0.3
    propensity_to_churn: float = 0.2
    days_since_last_visit: int = 5
    lifetime_order_count: int = 10
    return_rate: float = 0.1


class PredictPersonaRequest(BaseModel):
    """Lightweight request with just the 14 behavioral features for persona prediction."""
    tech_affinity: float = 0.5
    price_sensitivity: float = 0.5
    deal_seeking_score: float = 0.5
    research_depth: float = 0.5
    brand_loyalty_score: float = 0.5
    avg_order_value: float = 300.0
    lifetime_spend: float = 5000.0
    total_site_visits_90d: int = 20
    avg_session_duration_min: float = 8.0
    cart_abandonment_rate: float = 0.3
    propensity_to_churn: float = 0.2
    days_since_last_visit: int = 5
    lifetime_order_count: int = 10
    return_rate: float = 0.1


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/health")
def health():
    return {
        "status": "ok",
        "sessions_active": store.active_session_count,
        "total_profiles": store.total_profiles,
    }


@router.get("/products")
def list_products(category: Optional[str] = Query(None)):
    if category:
        return [p for p in PRODUCTS if p["category"] == category]
    return PRODUCTS


@router.get("/products/{product_id}")
def get_product(product_id: str):
    product = _products_by_id.get(product_id)
    if not product:
        return {"error": "Product not found"}
    return product


@router.post("/session")
def create_session(force_persona: Optional[str] = Query(None)):
    session_info = store.create_session(force_persona=force_persona)
    tracker.record_session(session_info["persona_type"], customer_id=session_info["customer_id"])
    return SessionResponse(
        session_id=session_info["session_id"],
        customer_id=session_info["customer_id"],
        persona_type=session_info["persona_type"],
        persona_confidence=session_info["persona_confidence"] or 0.0,
        first_name=session_info["first_name"],
    )


@router.get("/session/{session_id}")
def get_session(session_id: str):
    profile = store.get_profile(session_id)
    if not profile:
        return {"error": "Session not found"}
    return {
        "session_id": session_id,
        "customer_id": profile["customer_id"],
        "persona_type": profile.get("persona_type"),
        "persona_confidence": profile.get("persona_confidence"),
        "first_name": profile.get("first_name"),
        "profile": profile,
    }


@router.get("/personas")
def list_personas():
    dist = tracker.persona_distribution
    total = max(sum(dist.values()), 1)

    personas = []
    for pt in PersonaType:
        meta = PERSONA_META.get(pt, {})
        count = dist.get(pt.value, 0)
        personas.append(PersonaSummary(
            persona_type=pt.value,
            label=meta.get("label", pt.value),
            description=meta.get("description", ""),
            count=count,
            percentage=round(count / total * 100, 1),
            color=meta.get("color", "#888888"),
        ))
    return {"personas": personas, "distribution": dist}


@router.get("/personas/{persona_type}")
def get_persona(persona_type: str):
    try:
        pt = PersonaType(persona_type)
    except ValueError:
        return {"error": f"Unknown persona type: {persona_type}"}

    meta = PERSONA_META.get(pt, {})
    count = tracker.persona_distribution.get(persona_type, 0)
    total = max(sum(tracker.persona_distribution.values()), 1)

    return {
        "persona_type": persona_type,
        "label": meta.get("label", persona_type),
        "description": meta.get("description", ""),
        "color": meta.get("color", "#888888"),
        "count": count,
        "percentage": round(count / total * 100, 1),
    }


@router.get("/personas/all/stats")
def all_persona_stats():
    """Return detailed stats for all 10 personas in one call."""
    results = []
    for pt in PersonaType:
        meta = PERSONA_META.get(pt, {})
        raw = tracker.get_persona_stats(pt.value)
        results.append(PersonaDetailStats(
            persona_type=pt.value,
            label=meta.get("label", pt.value),
            color=meta.get("color", "#888888"),
            description=meta.get("description", ""),
            **raw,
        ))
    return {"personas": [p.model_dump() for p in results]}


@router.get("/personas/{persona_type}/stats")
def persona_detail_stats(persona_type: str):
    """Return detailed stats for a single persona."""
    try:
        pt = PersonaType(persona_type)
    except ValueError:
        return {"error": f"Unknown persona type: {persona_type}"}

    meta = PERSONA_META.get(pt, {})
    raw = tracker.get_persona_stats(persona_type)
    return PersonaDetailStats(
        persona_type=persona_type,
        label=meta.get("label", persona_type),
        color=meta.get("color", "#888888"),
        description=meta.get("description", ""),
        **raw,
    ).model_dump()


@router.get("/stats")
def get_stats():
    return tracker.get_stats()


# ── New User Assignment Endpoints ─────────────────────────────────────────────

@router.post("/customer")
def create_customer(req: NewCustomerRequest):
    """Register a new customer, assign them a persona via the ML engine, and persist their profile."""
    if store.persona_engine is None:
        return {"error": "Persona engine not yet initialized"}

    customer_id = f"cust_{uuid.uuid4().hex[:8]}"

    # Build a profile dict with all required fields
    profile = {
        "customer_id": customer_id,
        "first_name": req.first_name,
        "last_name": req.last_name,
        "email": req.email,
        "age": req.age,
        "zip_code": "00000",
        "city": "Unknown",
        "state": "NA",
        "loyalty_tier": "none",
        "loyalty_points": 0,
        "total_site_visits_90d": req.total_site_visits_90d,
        "avg_session_duration_min": req.avg_session_duration_min,
        "pages_per_session": round(req.avg_session_duration_min * 0.8, 1),
        "mobile_pct": 0.5,
        "days_since_last_visit": req.days_since_last_visit,
        "product_views_90d": req.total_site_visits_90d * 3,
        "search_queries_90d": req.total_site_visits_90d,
        "cart_additions_90d": int(req.total_site_visits_90d * 0.3),
        "cart_abandonment_rate": req.cart_abandonment_rate,
        "wishlist_items": 0,
        "email_open_rate": 0.35,
        "push_notification_opt_in": True,
        "app_installed": False,
        "lifetime_order_count": req.lifetime_order_count,
        "lifetime_spend": req.lifetime_spend,
        "avg_order_value": req.avg_order_value,
        "days_since_last_purchase": req.days_since_last_visit + 5,
        "return_rate": req.return_rate,
        "preferred_payment": "credit_card",
        "has_financing": False,
        "top_categories": [],
        "last_3_purchases": [],
        "preferred_brands": [],
        "price_sensitivity": req.price_sensitivity,
        "tech_affinity": req.tech_affinity,
        "deal_seeking_score": req.deal_seeking_score,
        "research_depth": req.research_depth,
        "brand_loyalty_score": req.brand_loyalty_score,
        "category_preferences": {},
        "communication_preference": "email",
        "estimated_household_income": "50k-75k",
        "home_ownership": "rent",
        "household_size": 2,
        "has_children": False,
        "life_stage": "young_professional",
        "propensity_to_churn": req.propensity_to_churn,
        "persona_type": None,
        "persona_confidence": None,
    }

    # Predict persona
    persona_type, confidence = store.persona_engine.predict(profile)
    profile["persona_type"] = persona_type
    profile["persona_confidence"] = confidence

    # Persist in store
    store.add_profile(profile)

    return {
        "customer_id": customer_id,
        "persona_type": persona_type,
        "persona_confidence": confidence,
    }


@router.post("/customer/predict-persona")
def predict_persona(req: PredictPersonaRequest):
    """Predict a persona from behavioral features without persisting. Lightweight prediction endpoint."""
    if store.persona_engine is None:
        return {"error": "Persona engine not yet initialized"}

    # Build a minimal profile dict with just the features needed for prediction
    profile = req.model_dump()

    persona_type, confidence = store.persona_engine.predict(profile)

    return {
        "persona_type": persona_type,
        "persona_confidence": confidence,
    }
