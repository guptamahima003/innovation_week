"""Intervention decision engine: (reason × persona) → intervention action."""

from __future__ import annotations

import uuid
from typing import Any

from models.schemas import (
    AbandonReason,
    AbandonSignal,
    AbandonType,
    Intervention,
    InterventionActionType,
    PersonaType,
)


def _template(
    action_type: InterventionActionType,
    template: str,
    headline: str,
    body: str,
    cta_text: str,
    **extra: Any,
) -> dict:
    return {
        "action_type": action_type,
        "template": template,
        "headline": headline,
        "body": body,
        "cta_text": cta_text,
        **extra,
    }


# ── Intervention Matrix ────────────────────────────────────────────────────────

_INTERVENTION_MATRIX: dict[tuple[str, str], dict] = {
    # Price too high
    (AbandonReason.PRICE_TOO_HIGH, PersonaType.VALUE_HUNTER): _template(
        InterventionActionType.OVERLAY, "price_drop_alert",
        "🏷️ Price Drop Alert!",
        "We noticed you were interested in {product_name}. Here's an exclusive 10% off — but it expires in 2 hours!",
        "Claim 10% Off",
        discount_pct=10, urgency="high", display_duration_seconds=20,
    ),
    (AbandonReason.PRICE_TOO_HIGH, PersonaType.TECH_ENTHUSIAST): _template(
        InterventionActionType.OVERLAY, "member_pricing",
        "💎 Exclusive Member Price",
        "As a valued member, you get exclusive pricing on {product_name}. Members save an additional 5%.",
        "Unlock Member Price",
        discount_pct=5, urgency="medium", display_duration_seconds=15,
    ),
    (AbandonReason.PRICE_TOO_HIGH, PersonaType.CONSIDERED_RESEARCHER): _template(
        InterventionActionType.OVERLAY, "tco_comparison",
        "📊 Total Value Analysis",
        "See how {product_name} compares on total cost of ownership — including warranty, longevity, and resale value.",
        "View Full Comparison",
        urgency="low", display_duration_seconds=20,
    ),
    (AbandonReason.PRICE_TOO_HIGH, PersonaType.LOYALTY_POWER_USER): _template(
        InterventionActionType.OVERLAY, "vip_price_unlock",
        "⭐ VIP Price Unlocked",
        "Your loyalty status qualifies you for a special VIP price on {product_name}. This offer is just for you.",
        "See VIP Price",
        discount_pct=8, urgency="medium", display_duration_seconds=15,
    ),
    (AbandonReason.PRICE_TOO_HIGH, PersonaType.LAPSING_CUSTOMER): _template(
        InterventionActionType.EMAIL_TEMPLATE, "winback_discount",
        "We Miss You!",
        "It's been a while! Come back and enjoy 15% off {product_name}. Your exclusive welcome-back offer awaits.",
        "Shop Now with 15% Off",
        discount_pct=15, urgency="low",
    ),
    (AbandonReason.PRICE_TOO_HIGH, PersonaType.BUSINESS_BUYER): _template(
        InterventionActionType.OVERLAY, "bulk_pricing",
        "💼 Business Volume Pricing",
        "Buying for your business? Get volume pricing on {product_name} and save up to 20% on bulk orders.",
        "Get Business Quote",
        urgency="medium", display_duration_seconds=15,
    ),

    # Payment friction
    (AbandonReason.PAYMENT_FRICTION, PersonaType.VALUE_HUNTER): _template(
        InterventionActionType.OVERLAY, "bnpl_offer",
        "💳 Pay Over Time",
        "Split your {product_name} purchase into 4 interest-free payments with Affirm. No hidden fees.",
        "Pay in 4 Installments",
        urgency="high", display_duration_seconds=15,
    ),
    (AbandonReason.PAYMENT_FRICTION, PersonaType.TECH_ENTHUSIAST): _template(
        InterventionActionType.OVERLAY, "instant_approval",
        "⚡ Instant Credit Approval",
        "Apply for the Best Buy Visa and get instant approval with 5% back on every purchase.",
        "Apply Now — 60 Seconds",
        urgency="high", display_duration_seconds=15,
    ),
    (AbandonReason.PAYMENT_FRICTION, PersonaType.CONSIDERED_RESEARCHER): _template(
        InterventionActionType.OVERLAY, "financing_explainer",
        "📋 Financing Made Simple",
        "We offer 0% APR for 18 months on {product_name}. Here's exactly what your monthly payments would look like.",
        "See Payment Calculator",
        urgency="low", display_duration_seconds=20,
    ),
    (AbandonReason.PAYMENT_FRICTION, PersonaType.LOYALTY_POWER_USER): _template(
        InterventionActionType.OVERLAY, "express_checkout",
        "🚀 Express Checkout",
        "Skip the hassle — use your saved payment method for one-click checkout on {product_name}.",
        "One-Click Purchase",
        urgency="high", display_duration_seconds=10,
    ),
    (AbandonReason.PAYMENT_FRICTION, PersonaType.LAPSING_CUSTOMER): _template(
        InterventionActionType.PUSH_NOTIFICATION, "easy_payment",
        "Easy Payment Options Available",
        "Multiple payment options available for {product_name} — credit, debit, PayPal, or pay over time.",
        "Complete Purchase",
        urgency="medium",
    ),
    (AbandonReason.PAYMENT_FRICTION, PersonaType.BUSINESS_BUYER): _template(
        InterventionActionType.OVERLAY, "net_terms",
        "🏢 Business Payment Options",
        "Set up Net 30 terms for your business. Purchase {product_name} now, pay on invoice.",
        "Apply for Net Terms",
        urgency="medium", display_duration_seconds=15,
    ),

    # Confidence gap
    (AbandonReason.CONFIDENCE_GAP, PersonaType.VALUE_HUNTER): _template(
        InterventionActionType.OVERLAY, "top_rated_alternative",
        "🏆 #1 Best Seller in Category",
        "Not sure about {product_name}? Check out our top-rated alternative — same features, better value.",
        "See Top-Rated Pick",
        urgency="medium", display_duration_seconds=15,
    ),
    (AbandonReason.CONFIDENCE_GAP, PersonaType.TECH_ENTHUSIAST): _template(
        InterventionActionType.OVERLAY, "popular_among_enthusiasts",
        "🔥 Most Popular Among Tech Enthusiasts",
        "94% of tech enthusiasts who viewed {product_name} ended up purchasing. Here's what they're saying.",
        "Read Expert Reviews",
        urgency="medium", display_duration_seconds=15,
    ),
    (AbandonReason.CONFIDENCE_GAP, PersonaType.CONSIDERED_RESEARCHER): _template(
        InterventionActionType.OVERLAY, "expert_comparison",
        "📊 Expert Comparison Guide",
        "Still researching? Our Geek Squad experts prepared a detailed comparison of {product_name} vs top alternatives.",
        "View Expert Comparison",
        urgency="low", display_duration_seconds=25,
    ),
    (AbandonReason.CONFIDENCE_GAP, PersonaType.LOYALTY_POWER_USER): _template(
        InterventionActionType.OVERLAY, "satisfaction_guarantee",
        "✅ 100% Satisfaction Guarantee",
        "Buy {product_name} with confidence — 30-day hassle-free returns for My Best Buy members.",
        "Buy Risk-Free",
        urgency="medium", display_duration_seconds=15,
    ),
    (AbandonReason.CONFIDENCE_GAP, PersonaType.LAPSING_CUSTOMER): _template(
        InterventionActionType.EMAIL_TEMPLATE, "reengagement_review",
        "See What Others Are Saying",
        "Still thinking about {product_name}? Here are the latest reviews from verified buyers.",
        "Read Reviews",
        urgency="low",
    ),
    (AbandonReason.CONFIDENCE_GAP, PersonaType.BUSINESS_BUYER): _template(
        InterventionActionType.OVERLAY, "business_consultation",
        "💬 Free Business Consultation",
        "Need help choosing the right solution? Schedule a free call with our Business Solutions team.",
        "Book Consultation",
        urgency="medium", display_duration_seconds=15,
    ),

    # Couldn't find it
    (AbandonReason.COULDNT_FIND_IT, PersonaType.VALUE_HUNTER): _template(
        InterventionActionType.OVERLAY, "similar_alternatives",
        "🔍 We Found Similar Options",
        "Looking for something specific? Here are in-stock alternatives that match what you searched for.",
        "View Alternatives",
        urgency="medium", display_duration_seconds=15,
    ),
    (AbandonReason.COULDNT_FIND_IT, PersonaType.TECH_ENTHUSIAST): _template(
        InterventionActionType.OVERLAY, "restock_notification",
        "📬 Get Notified When Available",
        "Can't find what you need? Sign up for restock alerts and be the first to know.",
        "Set Alert",
        urgency="low", display_duration_seconds=15,
    ),
    (AbandonReason.COULDNT_FIND_IT, PersonaType.CONSIDERED_RESEARCHER): _template(
        InterventionActionType.OVERLAY, "curated_specs",
        "🎯 Curated for Your Needs",
        "Based on your search, here are products that match your specifications — with detailed comparisons.",
        "View Curated List",
        urgency="medium", display_duration_seconds=20,
    ),
    (AbandonReason.COULDNT_FIND_IT, PersonaType.LOYALTY_POWER_USER): _template(
        InterventionActionType.OVERLAY, "personal_shopper",
        "🛍️ Personal Shopping Assistant",
        "Can't find the perfect product? Let our personal shopping team find it for you — exclusive to members.",
        "Connect with Shopper",
        urgency="medium", display_duration_seconds=15,
    ),
    (AbandonReason.COULDNT_FIND_IT, PersonaType.LAPSING_CUSTOMER): _template(
        InterventionActionType.EMAIL_TEMPLATE, "new_arrivals",
        "Check Out What's New",
        "We've added new products since your last visit. Browse our latest arrivals in your favorite categories.",
        "Browse New Arrivals",
        urgency="low",
    ),
    (AbandonReason.COULDNT_FIND_IT, PersonaType.BUSINESS_BUYER): _template(
        InterventionActionType.OVERLAY, "dedicated_rep",
        "👤 Dedicated Account Rep",
        "Need specific products for your business? Connect with a dedicated Best Buy for Business representative.",
        "Request Callback",
        urgency="medium", display_duration_seconds=15,
    ),

    # Distraction
    (AbandonReason.DISTRACTION, PersonaType.VALUE_HUNTER): _template(
        InterventionActionType.PUSH_NOTIFICATION, "cart_reminder",
        "Your Cart is Waiting!",
        "You left {product_name} in your cart. Complete your purchase before prices change!",
        "Return to Cart",
        urgency="low",
    ),
    (AbandonReason.DISTRACTION, PersonaType.TECH_ENTHUSIAST): _template(
        InterventionActionType.PUSH_NOTIFICATION, "cart_reminder_tech",
        "Don't Miss Out!",
        "{product_name} is in your cart. Limited stock available for this popular item.",
        "Complete Purchase",
        urgency="medium",
    ),
    (AbandonReason.DISTRACTION, PersonaType.CONSIDERED_RESEARCHER): _template(
        InterventionActionType.EMAIL_TEMPLATE, "saved_research",
        "Your Research is Saved",
        "We saved your progress on {product_name}. When you're ready, pick up right where you left off.",
        "Continue Research",
        urgency="low",
    ),
    (AbandonReason.DISTRACTION, PersonaType.LOYALTY_POWER_USER): _template(
        InterventionActionType.PUSH_NOTIFICATION, "gentle_reminder",
        "Items Saved for You",
        "Hi! Just a friendly reminder — {product_name} is still in your cart. Ready when you are.",
        "View Cart",
        urgency="low",
    ),
    (AbandonReason.DISTRACTION, PersonaType.LAPSING_CUSTOMER): _template(
        InterventionActionType.EMAIL_TEMPLATE, "we_miss_you",
        "We Miss You! Here's a Special Offer",
        "It's been a while since your last visit. Come back and enjoy 20% off your next purchase.",
        "Shop with 20% Off",
        discount_pct=20, urgency="low",
    ),
    (AbandonReason.DISTRACTION, PersonaType.BUSINESS_BUYER): _template(
        InterventionActionType.PUSH_NOTIFICATION, "order_reminder",
        "Pending Order Reminder",
        "{product_name} is awaiting your order. Secure business pricing before it expires.",
        "Complete Order",
        urgency="medium",
    ),
}


class InterventionEngine:
    """Decides the right intervention based on abandon reason and persona."""

    def decide(
        self,
        reason: AbandonReason,
        persona_type: str,
        signal: AbandonSignal,
    ) -> Intervention:
        """Look up the intervention matrix and build a personalized intervention."""
        key = (reason, persona_type)
        template_data = _INTERVENTION_MATRIX.get(key)

        if not template_data:
            # Default fallback
            template_data = _template(
                InterventionActionType.OVERLAY, "generic_reminder",
                "Still Interested?",
                "You were looking at {product_name}. Come back and complete your purchase!",
                "Continue Shopping",
                urgency="low", display_duration_seconds=10,
            )

        # Fill in product details
        params = {**template_data}
        action_type = params.pop("action_type")
        template = params.pop("template")

        # Replace placeholders
        product_name = signal.product_name or "this item"
        for k, v in params.items():
            if isinstance(v, str):
                params[k] = v.replace("{product_name}", product_name)

        # Add signal context to parameters
        params["product_id"] = signal.product_id
        params["product_name"] = product_name
        params["product_price"] = signal.product_price
        params["cart_total"] = signal.cart_total

        return Intervention(
            id=f"int_{uuid.uuid4().hex[:8]}",
            trigger=signal.abandon_type,
            reason=reason,
            persona_type=persona_type,
            action_type=action_type,
            template=template,
            parameters=params,
        )


# Global singleton
engine = InterventionEngine()
