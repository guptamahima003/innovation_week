"use client";

import React from "react";
import type { DashboardStats } from "@/lib/types";
import PersonaPieChart from "./PersonaPieChart";
import AbandonReasonChart from "./AbandonReasonChart";
import RevenueRecoveryCard from "./RevenueRecoveryCard";

interface AggregateChartsViewProps {
  stats: DashboardStats;
}

export default function AggregateChartsView({ stats }: AggregateChartsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <PersonaPieChart personaDistribution={stats.persona_distribution} />
      <AbandonReasonChart abandonsByReason={stats.abandons_by_reason} />
      <RevenueRecoveryCard
        revenueAtRisk={stats.revenue_at_risk}
        estimatedRecovered={stats.estimated_revenue_recovered}
      />
    </div>
  );
}
