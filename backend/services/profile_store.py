"""In-memory profile and session store."""

from __future__ import annotations

import random
import uuid
from typing import Optional

from config import settings
from models.schemas import CustomerProfile, UserEvent


class ProfileStore:
    """In-memory store mapping sessions to customer profiles and tracking event history."""

    def __init__(self):
        self.profiles: dict[str, dict] = {}  # customer_id -> raw profile dict
        self.session_to_customer: dict[str, str] = {}  # session_id -> customer_id
        self.session_history: dict[str, list[dict]] = {}  # session_id -> list of events
        self.session_cart: dict[str, list[dict]] = {}  # session_id -> cart items
        self._profiles_by_persona: dict[str, list[str]] = {}  # persona -> list of customer_ids
        self.persona_engine = None  # Set during lifespan startup
        self.customer_event_counts: dict[str, int] = {}  # customer_id -> event count since last reassignment

    def load_profiles(self, profiles: list[dict]) -> None:
        """Load customer profiles into the store."""
        self.profiles = {p["customer_id"]: p for p in profiles}
        # Index by persona
        self._profiles_by_persona = {}
        for p in profiles:
            persona = p.get("persona_type", "unknown")
            if persona not in self._profiles_by_persona:
                self._profiles_by_persona[persona] = []
            self._profiles_by_persona[persona].append(p["customer_id"])

    def add_profile(self, profile: dict) -> None:
        """Add a single profile to the store and index by persona."""
        customer_id = profile["customer_id"]
        self.profiles[customer_id] = profile
        persona = profile.get("persona_type", "unknown")
        if persona not in self._profiles_by_persona:
            self._profiles_by_persona[persona] = []
        self._profiles_by_persona[persona].append(customer_id)

    def create_session(self, session_id: Optional[str] = None, force_persona: Optional[str] = None) -> dict:
        """Create a new session and assign a random customer profile."""
        if session_id is None:
            session_id = f"sess_{uuid.uuid4().hex[:12]}"

        # Pick a customer profile (optionally filtered by persona)
        if force_persona and force_persona in self._profiles_by_persona:
            customer_ids = self._profiles_by_persona[force_persona]
            customer_id = random.choice(customer_ids)
        else:
            customer_id = random.choice(list(self.profiles.keys()))

        self.session_to_customer[session_id] = customer_id
        self.session_history[session_id] = []
        self.session_cart[session_id] = []

        profile = self.profiles[customer_id]
        return {
            "session_id": session_id,
            "customer_id": customer_id,
            "persona_type": profile.get("persona_type", "unknown"),
            "persona_confidence": profile.get("persona_confidence", 0.0),
            "first_name": profile.get("first_name", ""),
            "profile": profile,
        }

    def get_profile(self, session_id: str) -> Optional[dict]:
        """Get the customer profile for a session."""
        customer_id = self.session_to_customer.get(session_id)
        if customer_id is None:
            return None
        return self.profiles.get(customer_id)

    def add_event(self, session_id: str, event: dict) -> Optional[tuple[str, str]]:
        """Add an event to session history. Returns (old_persona, new_persona) if reassignment triggered, else None."""
        if session_id not in self.session_history:
            self.session_history[session_id] = []
        self.session_history[session_id].append(event)

        # Track event count per customer for reassignment
        customer_id = self.session_to_customer.get(session_id)
        if customer_id:
            self.customer_event_counts[customer_id] = self.customer_event_counts.get(customer_id, 0) + 1
            if self.customer_event_counts[customer_id] >= settings.REASSIGNMENT_EVENT_THRESHOLD:
                result = self.reassign_persona(customer_id)
                self.customer_event_counts[customer_id] = 0
                return result

        return None

    def reassign_persona(self, customer_id: str) -> Optional[tuple[str, str]]:
        """Re-evaluate a customer's persona based on updated behavioral data.
        Returns (old_persona, new_persona) if changed, else None.
        """
        if self.persona_engine is None:
            return None

        profile = self.profiles.get(customer_id)
        if not profile:
            return None

        old_persona = profile.get("persona_type", "unknown")

        # Update behavioral fields from session history
        self._update_profile_from_history(customer_id)

        # Predict new persona
        new_persona, new_confidence = self.persona_engine.predict(profile)

        if new_persona != old_persona:
            # Update profile
            profile["persona_type"] = new_persona
            profile["persona_confidence"] = new_confidence

            # Re-index persona mapping
            if old_persona in self._profiles_by_persona:
                try:
                    self._profiles_by_persona[old_persona].remove(customer_id)
                except ValueError:
                    pass
            if new_persona not in self._profiles_by_persona:
                self._profiles_by_persona[new_persona] = []
            self._profiles_by_persona[new_persona].append(customer_id)

            return (old_persona, new_persona)

        # Update confidence even if persona didn't change
        profile["persona_confidence"] = new_confidence
        return None

    def _update_profile_from_history(self, customer_id: str) -> None:
        """Update a customer profile's behavioral fields based on their session history."""
        # Collect all events across all sessions for this customer
        all_events = []
        for sid, cid in self.session_to_customer.items():
            if cid == customer_id:
                all_events.extend(self.session_history.get(sid, []))

        if not all_events:
            return

        profile = self.profiles[customer_id]

        # Count event types
        event_types = [e.get("event_type", "") for e in all_events]
        browse_count = event_types.count("browse")
        add_to_cart_count = event_types.count("add_to_cart")
        search_count = event_types.count("search")
        checkout_starts = event_types.count("checkout_start")
        checkout_completes = event_types.count("checkout_complete")
        page_leaves = event_types.count("page_leave")

        total_events = len(all_events)

        # Update behavioral fields based on observed activity
        profile["total_site_visits_90d"] = max(profile.get("total_site_visits_90d", 0), total_events)
        profile["search_queries_90d"] = max(profile.get("search_queries_90d", 0), search_count)
        profile["cart_additions_90d"] = max(profile.get("cart_additions_90d", 0), add_to_cart_count)
        profile["days_since_last_visit"] = 0  # They are currently active

        # Adjust cart abandonment rate
        if add_to_cart_count > 0:
            abandon_rate = 1.0 - (checkout_completes / add_to_cart_count) if add_to_cart_count > 0 else 0.5
            # Blend with existing rate (weighted average)
            old_rate = profile.get("cart_abandonment_rate", 0.5)
            profile["cart_abandonment_rate"] = round(0.6 * abandon_rate + 0.4 * old_rate, 2)

        # Active users are less likely to churn
        if total_events > 10:
            old_churn = profile.get("propensity_to_churn", 0.5)
            profile["propensity_to_churn"] = round(max(0.05, old_churn * 0.7), 2)

    def get_history(self, session_id: str) -> list[dict]:
        """Get event history for a session."""
        return self.session_history.get(session_id, [])

    def update_cart(self, session_id: str, action: str, item: dict) -> None:
        """Update cart state for a session."""
        if session_id not in self.session_cart:
            self.session_cart[session_id] = []
        if action == "add":
            self.session_cart[session_id].append(item)
        elif action == "remove":
            self.session_cart[session_id] = [
                i for i in self.session_cart[session_id]
                if i.get("product_id") != item.get("product_id")
            ]

    def get_cart(self, session_id: str) -> list[dict]:
        """Get cart items for a session."""
        return self.session_cart.get(session_id, [])

    def get_cart_total(self, session_id: str) -> float:
        """Get total cart value for a session."""
        return sum(item.get("price", 0) * item.get("quantity", 1) for item in self.get_cart(session_id))

    @property
    def active_session_count(self) -> int:
        return len(self.session_to_customer)

    @property
    def total_profiles(self) -> int:
        return len(self.profiles)


# Global singleton
store = ProfileStore()
