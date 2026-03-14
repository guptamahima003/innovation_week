"""Dashboard metrics aggregator."""

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


class MetricsTracker:
    """Tracks aggregate metrics for the dashboard."""

    def __init__(self):
        self.total_sessions = 0
        self.active_sessions = 0
        self.total_abandons = 0
        self.abandons_by_type: dict[str, int] = {}
        self.abandons_by_reason: dict[str, int] = {}
        self.interventions_triggered = 0
        self.interventions_by_type: dict[str, int] = {}
        self.persona_distribution: dict[str, int] = {}
        self.revenue_at_risk = 0.0
        self.estimated_revenue_recovered = 0.0

    def record_session(self, persona_type: str) -> None:
        """Record a new session."""
        self.total_sessions += 1
        self.active_sessions += 1
        self.persona_distribution[persona_type] = self.persona_distribution.get(persona_type, 0) + 1

    def record_abandon(self, signal: AbandonSignal, reason: str) -> None:
        """Record an abandonment event."""
        self.total_abandons += 1
        atype = signal.abandon_type.value if hasattr(signal.abandon_type, 'value') else str(signal.abandon_type)
        self.abandons_by_type[atype] = self.abandons_by_type.get(atype, 0) + 1
        self.abandons_by_reason[reason] = self.abandons_by_reason.get(reason, 0) + 1

        # Track revenue at risk
        if signal.cart_total:
            self.revenue_at_risk += signal.cart_total
        elif signal.product_price:
            self.revenue_at_risk += signal.product_price

    def record_intervention(self, intervention: Intervention) -> None:
        """Record an intervention being triggered."""
        self.interventions_triggered += 1
        itype = intervention.action_type.value if hasattr(intervention.action_type, 'value') else str(intervention.action_type)
        self.interventions_by_type[itype] = self.interventions_by_type.get(itype, 0) + 1

        # Estimate recovered revenue
        recovery_rate = RECOVERY_RATES.get(itype, 0.05)
        cart_value = intervention.parameters.get("cart_total") or intervention.parameters.get("product_price") or 0
        if cart_value:
            self.estimated_revenue_recovered += cart_value * recovery_rate

    def get_stats(self) -> DashboardStats:
        """Return current dashboard snapshot."""
        return DashboardStats(
            total_sessions=self.total_sessions,
            active_sessions=self.active_sessions,
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
