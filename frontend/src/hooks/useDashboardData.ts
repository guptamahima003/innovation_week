"use client";

import { useCallback, useState } from "react";
import type { DashboardEvent, DashboardStats, DashboardUpdate } from "@/lib/types";

const DEFAULT_STATS: DashboardStats = {
  total_sessions: 0,
  active_sessions: 0,
  unique_customers: 0,
  total_abandons: 0,
  abandons_by_type: {},
  abandons_by_reason: {},
  interventions_triggered: 0,
  interventions_by_type: {},
  persona_distribution: {},
  revenue_at_risk: 0,
  estimated_revenue_recovered: 0,
};

export function useDashboardData() {
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [events, setEvents] = useState<DashboardEvent[]>([]);

  const handleMessage = useCallback((data: unknown) => {
    const update = data as DashboardUpdate;
    if (update.type !== "dashboard_update") return;

    if (update.stats) {
      setStats(update.stats);
    }

    if (update.event) {
      setEvents((prev) => [update.event!, ...prev].slice(0, 100));
    }
  }, []);

  return { stats, events, handleMessage };
}
