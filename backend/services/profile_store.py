"""In-memory profile and session store."""

from __future__ import annotations

import random
import uuid
from typing import Optional

from models.schemas import CustomerProfile, UserEvent


class ProfileStore:
    """In-memory store mapping sessions to customer profiles and tracking event history."""

    def __init__(self):
        self.profiles: dict[str, dict] = {}  # customer_id -> raw profile dict
        self.session_to_customer: dict[str, str] = {}  # session_id -> customer_id
        self.session_history: dict[str, list[dict]] = {}  # session_id -> list of events
        self.session_cart: dict[str, list[dict]] = {}  # session_id -> cart items
        self._profiles_by_persona: dict[str, list[str]] = {}  # persona -> list of customer_ids

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

    def add_event(self, session_id: str, event: dict) -> None:
        """Add an event to session history."""
        if session_id not in self.session_history:
            self.session_history[session_id] = []
        self.session_history[session_id].append(event)

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
