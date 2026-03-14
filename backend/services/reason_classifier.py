"""Abandon reason classifier: (abandon_signal × persona) → reason."""

from __future__ import annotations

from models.schemas import AbandonReason, AbandonSignal, AbandonType, PersonaType

# Classification matrix: (abandon_type, persona_type) -> reason
_REASON_MATRIX: dict[tuple[str, str], AbandonReason] = {
    # Cart abandon
    (AbandonType.CART_ABANDON, PersonaType.VALUE_HUNTER): AbandonReason.PRICE_TOO_HIGH,
    (AbandonType.CART_ABANDON, PersonaType.TECH_ENTHUSIAST): AbandonReason.CONFIDENCE_GAP,
    (AbandonType.CART_ABANDON, PersonaType.CONSIDERED_RESEARCHER): AbandonReason.CONFIDENCE_GAP,
    (AbandonType.CART_ABANDON, PersonaType.LOYALTY_POWER_USER): AbandonReason.DISTRACTION,
    (AbandonType.CART_ABANDON, PersonaType.LAPSING_CUSTOMER): AbandonReason.DISTRACTION,
    (AbandonType.CART_ABANDON, PersonaType.BUSINESS_BUYER): AbandonReason.PRICE_TOO_HIGH,
    # Checkout abandon
    (AbandonType.CHECKOUT_ABANDON, PersonaType.VALUE_HUNTER): AbandonReason.PAYMENT_FRICTION,
    (AbandonType.CHECKOUT_ABANDON, PersonaType.TECH_ENTHUSIAST): AbandonReason.PAYMENT_FRICTION,
    (AbandonType.CHECKOUT_ABANDON, PersonaType.CONSIDERED_RESEARCHER): AbandonReason.PAYMENT_FRICTION,
    (AbandonType.CHECKOUT_ABANDON, PersonaType.LOYALTY_POWER_USER): AbandonReason.PAYMENT_FRICTION,
    (AbandonType.CHECKOUT_ABANDON, PersonaType.LAPSING_CUSTOMER): AbandonReason.PRICE_TOO_HIGH,
    (AbandonType.CHECKOUT_ABANDON, PersonaType.BUSINESS_BUYER): AbandonReason.PAYMENT_FRICTION,
    # Product page abandon
    (AbandonType.PRODUCT_PAGE_ABANDON, PersonaType.VALUE_HUNTER): AbandonReason.PRICE_TOO_HIGH,
    (AbandonType.PRODUCT_PAGE_ABANDON, PersonaType.TECH_ENTHUSIAST): AbandonReason.CONFIDENCE_GAP,
    (AbandonType.PRODUCT_PAGE_ABANDON, PersonaType.CONSIDERED_RESEARCHER): AbandonReason.CONFIDENCE_GAP,
    (AbandonType.PRODUCT_PAGE_ABANDON, PersonaType.LOYALTY_POWER_USER): AbandonReason.DISTRACTION,
    (AbandonType.PRODUCT_PAGE_ABANDON, PersonaType.LAPSING_CUSTOMER): AbandonReason.DISTRACTION,
    (AbandonType.PRODUCT_PAGE_ABANDON, PersonaType.BUSINESS_BUYER): AbandonReason.CONFIDENCE_GAP,
    # Search abandon
    (AbandonType.SEARCH_ABANDON, PersonaType.VALUE_HUNTER): AbandonReason.COULDNT_FIND_IT,
    (AbandonType.SEARCH_ABANDON, PersonaType.TECH_ENTHUSIAST): AbandonReason.COULDNT_FIND_IT,
    (AbandonType.SEARCH_ABANDON, PersonaType.CONSIDERED_RESEARCHER): AbandonReason.COULDNT_FIND_IT,
    (AbandonType.SEARCH_ABANDON, PersonaType.LOYALTY_POWER_USER): AbandonReason.COULDNT_FIND_IT,
    (AbandonType.SEARCH_ABANDON, PersonaType.LAPSING_CUSTOMER): AbandonReason.COULDNT_FIND_IT,
    (AbandonType.SEARCH_ABANDON, PersonaType.BUSINESS_BUYER): AbandonReason.COULDNT_FIND_IT,
}


class ReasonClassifier:
    """Classifies the most probable abandon reason using persona + signal context."""

    def classify(self, signal: AbandonSignal, profile: dict) -> AbandonReason:
        """
        Determine why the customer abandoned based on signal type and persona.
        Uses lookup table with contextual overrides.
        """
        persona_type = profile.get("persona_type", "tech_enthusiast")
        abandon_type = signal.abandon_type

        # Check for contextual overrides based on profile signals
        reason = self._contextual_override(signal, profile, abandon_type)
        if reason:
            return reason

        # Fall back to matrix lookup
        key = (abandon_type, persona_type)
        return _REASON_MATRIX.get(key, AbandonReason.DISTRACTION)

    def _contextual_override(
        self,
        signal: AbandonSignal,
        profile: dict,
        abandon_type: str,
    ) -> AbandonReason | None:
        """Check if contextual signals override the default classification."""
        price_sensitivity = profile.get("price_sensitivity", 0.5)
        deal_seeking = profile.get("deal_seeking_score", 0.5)
        research_depth = profile.get("research_depth", 0.5)

        # High price sensitivity + cart/checkout abandon = likely price issue
        if (
            abandon_type in (AbandonType.CART_ABANDON, AbandonType.CHECKOUT_ABANDON)
            and price_sensitivity > 0.7
            and signal.cart_total
            and signal.cart_total > profile.get("avg_order_value", 300) * 1.5
        ):
            return AbandonReason.PRICE_TOO_HIGH

        # Deep researcher with long dwell = confidence gap
        if (
            abandon_type == AbandonType.PRODUCT_PAGE_ABANDON
            and research_depth > 0.7
            and signal.time_on_page
            and signal.time_on_page > 20
        ):
            return AbandonReason.CONFIDENCE_GAP

        # High deal seeker + full price product = price issue
        if (
            abandon_type == AbandonType.CART_ABANDON
            and deal_seeking > 0.7
        ):
            return AbandonReason.PRICE_TOO_HIGH

        return None


# Global singleton
classifier = ReasonClassifier()
