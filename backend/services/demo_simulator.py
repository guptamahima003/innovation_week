"""Demo event simulator — populates dashboard metrics at startup for hackathon demo."""

from __future__ import annotations

import random
import uuid
from typing import Any

from models.schemas import (
    AbandonReason,
    AbandonSignal,
    AbandonType,
    PersonaType,
)
from services.intervention_engine import engine as intervention_engine
from services.metrics_tracker import MetricsTracker
from services.profile_store import ProfileStore
from services.reason_classifier import classifier

# ── Persona behaviour profiles ───────────────────────────────────────────────

# How many sessions to simulate per persona (weight distribution out of total)
PERSONA_SESSION_WEIGHTS: dict[str, float] = {
    "tech_enthusiast": 0.13,
    "value_hunter": 0.15,
    "considered_researcher": 0.10,
    "loyalty_power_user": 0.08,
    "lapsing_customer": 0.08,
    "business_buyer": 0.05,
    "impulse_buyer": 0.13,
    "home_upgrader": 0.10,
    "gift_shopper": 0.10,
    "student_budget": 0.08,
}

# Probability that a session ends in an abandon event
PERSONA_ABANDON_RATES: dict[str, float] = {
    "tech_enthusiast": 0.35,
    "value_hunter": 0.70,
    "considered_researcher": 0.55,
    "loyalty_power_user": 0.25,
    "lapsing_customer": 0.60,
    "business_buyer": 0.45,
    "impulse_buyer": 0.40,
    "home_upgrader": 0.50,
    "gift_shopper": 0.45,
    "student_budget": 0.65,
}

# Abandon type weights per persona (must sum to 1.0)
PERSONA_ABANDON_TYPE_WEIGHTS: dict[str, list[tuple[AbandonType, float]]] = {
    "tech_enthusiast": [
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.4),
        (AbandonType.CART_ABANDON, 0.3),
        (AbandonType.CHECKOUT_ABANDON, 0.2),
        (AbandonType.SEARCH_ABANDON, 0.1),
    ],
    "value_hunter": [
        (AbandonType.CART_ABANDON, 0.45),
        (AbandonType.CHECKOUT_ABANDON, 0.25),
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.20),
        (AbandonType.SEARCH_ABANDON, 0.10),
    ],
    "considered_researcher": [
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.50),
        (AbandonType.CART_ABANDON, 0.20),
        (AbandonType.SEARCH_ABANDON, 0.20),
        (AbandonType.CHECKOUT_ABANDON, 0.10),
    ],
    "loyalty_power_user": [
        (AbandonType.CART_ABANDON, 0.35),
        (AbandonType.CHECKOUT_ABANDON, 0.30),
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.25),
        (AbandonType.SEARCH_ABANDON, 0.10),
    ],
    "lapsing_customer": [
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.35),
        (AbandonType.SEARCH_ABANDON, 0.30),
        (AbandonType.CART_ABANDON, 0.25),
        (AbandonType.CHECKOUT_ABANDON, 0.10),
    ],
    "business_buyer": [
        (AbandonType.CHECKOUT_ABANDON, 0.40),
        (AbandonType.CART_ABANDON, 0.30),
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.20),
        (AbandonType.SEARCH_ABANDON, 0.10),
    ],
    "impulse_buyer": [
        (AbandonType.CART_ABANDON, 0.40),
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.30),
        (AbandonType.CHECKOUT_ABANDON, 0.15),
        (AbandonType.SEARCH_ABANDON, 0.15),
    ],
    "home_upgrader": [
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.35),
        (AbandonType.CART_ABANDON, 0.35),
        (AbandonType.CHECKOUT_ABANDON, 0.20),
        (AbandonType.SEARCH_ABANDON, 0.10),
    ],
    "gift_shopper": [
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.40),
        (AbandonType.SEARCH_ABANDON, 0.25),
        (AbandonType.CART_ABANDON, 0.25),
        (AbandonType.CHECKOUT_ABANDON, 0.10),
    ],
    "student_budget": [
        (AbandonType.CART_ABANDON, 0.40),
        (AbandonType.PRODUCT_PAGE_ABANDON, 0.25),
        (AbandonType.CHECKOUT_ABANDON, 0.20),
        (AbandonType.SEARCH_ABANDON, 0.15),
    ],
}

# Conversion rate (sessions that complete checkout) per persona
PERSONA_CONVERSION_RATES: dict[str, float] = {
    "tech_enthusiast": 0.30,
    "value_hunter": 0.12,
    "considered_researcher": 0.18,
    "loyalty_power_user": 0.45,
    "lapsing_customer": 0.08,
    "business_buyer": 0.25,
    "impulse_buyer": 0.35,
    "home_upgrader": 0.20,
    "gift_shopper": 0.22,
    "student_budget": 0.10,
}


def _pick_abandon_type(persona_type: str) -> AbandonType:
    """Weighted random pick of abandon type for a persona."""
    weights = PERSONA_ABANDON_TYPE_WEIGHTS.get(
        persona_type,
        [(AbandonType.CART_ABANDON, 0.4), (AbandonType.PRODUCT_PAGE_ABANDON, 0.3),
         (AbandonType.CHECKOUT_ABANDON, 0.2), (AbandonType.SEARCH_ABANDON, 0.1)],
    )
    types, probs = zip(*weights)
    return random.choices(types, weights=probs, k=1)[0]


class DemoSimulator:
    """Simulates realistic sessions to pre-populate dashboard metrics."""

    def __init__(
        self,
        store: ProfileStore,
        tracker: MetricsTracker,
        products: list[dict],
    ):
        self.store = store
        self.tracker = tracker
        self.products = products

    def run(self, num_sessions: int = 200) -> None:
        """Simulate *num_sessions* sessions across all personas."""
        # Compute per-persona session counts
        persona_counts: dict[str, int] = {}
        remaining = num_sessions
        personas = list(PERSONA_SESSION_WEIGHTS.keys())
        for p in personas[:-1]:
            count = max(1, round(num_sessions * PERSONA_SESSION_WEIGHTS[p]))
            persona_counts[p] = count
            remaining -= count
        persona_counts[personas[-1]] = max(1, remaining)

        for persona_type, count in persona_counts.items():
            for _ in range(count):
                self._simulate_session(persona_type)

    def _simulate_session(self, persona_type: str) -> None:
        """Simulate a single session for the given persona type."""
        # Create a real session from the store
        session_info = self.store.create_session(force_persona=persona_type)
        session_id = session_info["session_id"]
        customer_id = session_info["customer_id"]
        actual_persona = session_info.get("persona_type", persona_type)

        # Record session in metrics
        self.tracker.record_session(actual_persona, customer_id)

        # Pick a random product for this session
        product = random.choice(self.products)
        product_name = product.get("name", "Unknown Product")
        product_price = product.get("price", 99.99)

        # Decide if this session ends in conversion
        if random.random() < PERSONA_CONVERSION_RATES.get(actual_persona, 0.2):
            cart_value = product_price * random.randint(1, 3)
            self.tracker.record_conversion(actual_persona, cart_value)

        # Decide if this session ends in an abandon
        if random.random() < PERSONA_ABANDON_RATES.get(actual_persona, 0.5):
            self._simulate_abandon(session_id, actual_persona, product_name, product_price)

    def _simulate_abandon(
        self,
        session_id: str,
        persona_type: str,
        product_name: str,
        product_price: float,
    ) -> None:
        """Simulate an abandon event + classification + intervention."""
        abandon_type = _pick_abandon_type(persona_type)

        # Build an AbandonSignal
        cart_items = random.randint(1, 4)
        cart_total = round(product_price * cart_items, 2) if abandon_type in (
            AbandonType.CART_ABANDON, AbandonType.CHECKOUT_ABANDON
        ) else None

        signal = AbandonSignal(
            session_id=session_id,
            abandon_type=abandon_type,
            product_id=f"prod_{uuid.uuid4().hex[:6]}",
            product_name=product_name,
            product_price=product_price,
            cart_total=cart_total,
            cart_items=cart_items if cart_total else None,
            time_on_page=round(random.uniform(5, 120), 1),
            search_query="demo search" if abandon_type == AbandonType.SEARCH_ABANDON else None,
        )

        # Classify reason using the real classifier
        profile = self.store.get_profile(session_id) or {"persona_type": persona_type}
        reason = classifier.classify(signal, profile)
        reason_str = reason.value if hasattr(reason, "value") else str(reason)

        # Record abandon (with persona)
        self.tracker.record_abandon(signal, reason_str, persona_type=persona_type)

        # Generate intervention using the real engine
        intervention = intervention_engine.decide(reason, persona_type, signal)

        # Inject cart/product values into intervention params for revenue tracking
        if cart_total and "cart_total" not in intervention.parameters:
            intervention.parameters["cart_total"] = cart_total
        if product_price and "product_price" not in intervention.parameters:
            intervention.parameters["product_price"] = product_price

        # Record intervention
        self.tracker.record_intervention(intervention)
