"""REST API endpoints."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Query

from models.schemas import PERSONA_META, PersonaSummary, PersonaType, SessionResponse
from services.metrics_tracker import tracker
from services.profile_store import store

router = APIRouter(prefix="/api", tags=["api"])

# Load products at module level
_products_path = Path(__file__).parent.parent / "data" / "products.json"
with open(_products_path) as f:
    PRODUCTS = json.load(f)
_products_by_id = {p["id"]: p for p in PRODUCTS}


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
    tracker.record_session(session_info["persona_type"])
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


@router.get("/stats")
def get_stats():
    return tracker.get_stats()
