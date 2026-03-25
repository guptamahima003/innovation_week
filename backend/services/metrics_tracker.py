"""Dashboard metrics aggregator with per-persona tracking."""

from __future__ import annotations

from models.schemas import (
    AbandonSignal,
    DashboardStats,
    Intervention,
)

# Revenue recovery rate assumptions per intervention type
RECOVERY_RATES = {
    "overlay": 0.15,
    "push_notification": 0.08,
    "email_template": 0.06,
}


def _init_persona_bucket() -> dict:
    """Return a fresh per-persona stats bucket."""
    return {
        "sessions": 0,
        "abandons": 0,
        "abandons_by_type": {},
        "abandons_by_reason": {},
        "interventions": 0,
        "interventions_by_type": {},
        "revenue_at_risk": 0.0,
        "revenue_recovered": 0.0,
        "cart_values": [],
        "conversions": 0,
        "abandoned_products": {},
    }


class MetricsTracker:
    """Tracks aggregate and per-persona metrics for the dashboard."""

    def __init__(self):
        self.total_sessions = 0
        self.active_sessions = 0
        self.unique_customer_ids: set[str] = set()
        self.total_abandons = 0
        self.abandons_by_type: dict[str, int] = {}
        self.abandons_by_reason: dict[str, int] = {}
        self.interventions_triggered = 0
        self.interventions_by_type: dict[str, int] = {}
        self.persona_distribution: dict[str, int] = {}
        self.revenue_at_risk = 0.0
        self.estimated_revenue_recovered = 0.0
        # Per-persona stats
        self.per_persona_stats: dict[str, dict] = {}

    def _ensure_persona(self, persona_type: str) -> dict:
        """Ensure a persona bucket exists and return it."""
        if persona_type not in self.per_persona_stats:
            self.per_persona_stats[persona_type] = _init_persona_bucket()
        return self.per_persona_stats[persona_type]

    def record_session(self, persona_type: str, customer_id: str = "") -> None:
        """Record a new session."""
        self.total_sessions += 1
        self.active_sessions += 1
        if customer_id:
            self.unique_customer_ids.add(customer_id)
        self.persona_distribution[persona_type] = self.persona_distribution.get(persona_type, 0) + 1
        # Per-persona
        bucket = self._ensure_persona(persona_type)
        bucket["sessions"] += 1

    def record_abandon(self, signal: AbandonSignal, reason: str, persona_type: str = "unknown") -> None:
        """Record an abandonment event."""
        self.total_abandons += 1
        atype = signal.abandon_type.value if hasattr(signal.abandon_type, 'value') else str(signal.abandon_type)
        self.abandons_by_type[atype] = self.abandons_by_type.get(atype, 0) + 1
        self.abandons_by_reason[reason] = self.abandons_by_reason.get(reason, 0) + 1

        # Track revenue at risk
        cart_value = 0.0
        if signal.cart_total:
            cart_value = signal.cart_total
            self.revenue_at_risk += signal.cart_total
        elif signal.product_price:
            cart_value = signal.product_price
            self.revenue_at_risk += signal.product_price

        # Per-persona
        bucket = self._ensure_persona(persona_type)
        bucket["abandons"] += 1
        bucket["abandons_by_type"][atype] = bucket["abandons_by_type"].get(atype, 0) + 1
        bucket["abandons_by_reason"][reason] = bucket["abandons_by_reason"].get(reason, 0) + 1
        bucket["revenue_at_risk"] += cart_value
        if cart_value > 0:
            bucket["cart_values"].append(cart_value)

        # Track abandoned products
        product_name = signal.product_name
        if product_name:
            bucket["abandoned_products"][product_name] = bucket["abandoned_products"].get(product_name, 0) + 1

    def record_intervention(self, intervention: Intervention) -> None:
        """Record an intervention being triggered."""
        self.interventions_triggered += 1
        itype = intervention.action_type.value if hasattr(intervention.action_type, 'value') else str(intervention.action_type)
        self.interventions_by_type[itype] = self.interventions_by_type.get(itype, 0) + 1

        # Estimate recovered revenue
        recovery_rate = RECOVERY_RATES.get(itype, 0.05)
        cart_value = intervention.parameters.get("cart_total") or intervention.parameters.get("product_price") or 0
        recovered = 0.0
        if cart_value:
            recovered = cart_value * recovery_rate
            self.estimated_revenue_recovered += recovered

        # Per-persona
        persona_type = intervention.persona_type.value if hasattr(intervention.persona_type, 'value') else str(intervention.persona_type)
        bucket = self._ensure_persona(persona_type)
        bucket["interventions"] += 1
        bucket["interventions_by_type"][itype] = bucket["interventions_by_type"].get(itype, 0) + 1
        bucket["revenue_recovered"] += recovered

    def record_conversion(self, persona_type: str, cart_value: float) -> None:
        """Record a successful conversion (checkout complete)."""
        bucket = self._ensure_persona(persona_type)
        bucket["conversions"] += 1
        if cart_value > 0:
            bucket["cart_values"].append(cart_value)

    def get_persona_stats(self, persona_type: str) -> dict:
        """Return computed stats for a single persona."""
        bucket = self._ensure_persona(persona_type)
        sessions = bucket["sessions"]
        abandons = bucket["abandons"]
        revenue_at_risk = bucket["revenue_at_risk"]
        revenue_recovered = bucket["revenue_recovered"]
        cart_values = bucket["cart_values"]
        conversions = bucket["conversions"]

        return {
            "sessions": sessions,
            "abandons": abandons,
            "abandon_rate": round(abandons / max(sessions, 1) * 100, 1),
            "abandons_by_type": dict(bucket["abandons_by_type"]),
            "abandons_by_reason": dict(bucket["abandons_by_reason"]),
            "interventions": bucket["interventions"],
            "interventions_by_type": dict(bucket["interventions_by_type"]),
            "revenue_at_risk": round(revenue_at_risk, 2),
            "revenue_recovered": round(revenue_recovered, 2),
            "intervention_success_rate": round(
                revenue_recovered / max(revenue_at_risk, 0.01) * 100, 1
            ),
            "avg_cart_value": round(
                sum(cart_values) / max(len(cart_values), 1), 2
            ),
            "conversion_rate": round(
                conversions / max(sessions, 1) * 100, 1
            ),
            "top_abandoned_products": sorted(
                [{"name": k, "count": v} for k, v in bucket["abandoned_products"].items()],
                key=lambda x: x["count"],
                reverse=True,
            )[:5],
        }

    def get_stats(self) -> DashboardStats:
        """Return current dashboard snapshot."""
        return DashboardStats(
            total_sessions=self.total_sessions,
            active_sessions=self.active_sessions,
            unique_customers=len(self.unique_customer_ids),
            total_abandons=self.total_abandons,
            abandons_by_type=dict(self.abandons_by_type),
            abandons_by_reason=dict(self.abandons_by_reason),
            interventions_triggered=self.interventions_triggered,
            interventions_by_type=dict(self.interventions_by_type),
            persona_distribution=dict(self.persona_distribution),
            revenue_at_risk=round(self.revenue_at_risk, 2),
            estimated_revenue_recovered=round(self.estimated_revenue_recovered, 2),
        )


# Global singleton
tracker = MetricsTracker()
