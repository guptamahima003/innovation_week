"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePersonaStats } from "@/hooks/usePersonaStats";
import { WS_URL, API_URL } from "@/lib/constants";
import type { DashboardStats } from "@/lib/types";
import OverallsSection from "@/components/dashboard/OverallsSection";
import PersonaSelector from "@/components/dashboard/PersonaSelector";
import PersonaDetailView from "@/components/dashboard/PersonaDetailView";
import AggregateChartsView from "@/components/dashboard/AggregateChartsView";
import AbandonEventFeed from "@/components/dashboard/AbandonEventFeed";
import InterventionLog from "@/components/dashboard/InterventionLog";

export default function DashboardPage() {
  const { stats, events, handleMessage } = useDashboardData();
  const { personaStats } = usePersonaStats();
  const [restStats, setRestStats] = useState<DashboardStats | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  const onMessage = useCallback(
    (data: unknown) => {
      handleMessage(data);
    },
    [handleMessage]
  );

  const { isConnected } = useWebSocket({
    url: `${WS_URL}/ws/dashboard`,
    onMessage,
  });

  // Fallback: poll REST API every 5 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/stats`);
        if (res.ok) {
          const data: DashboardStats = await res.json();
          setRestStats(data);
        }
      } catch {
        // Silently fail — WebSocket is primary
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Merge: prefer WebSocket stats, fall back to REST
  const activeStats: DashboardStats =
    stats.total_sessions > 0 || stats.total_abandons > 0
      ? stats
      : restStats ?? stats;

  // Filter events by persona when one is selected
  const filteredEvents = useMemo(
    () =>
      selectedPersona
        ? events.filter((e) => e.persona_type === selectedPersona)
        : events,
    [events, selectedPersona]
  );

  // Find selected persona detail stats
  const selectedPersonaDetail = useMemo(
    () =>
      selectedPersona
        ? personaStats.find((p) => p.persona_type === selectedPersona) ?? null
        : null,
    [personaStats, selectedPersona]
  );

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Best Buy logo mark */}
            <div className="w-10 h-10 bg-[#0046BE] rounded-lg flex items-center justify-center font-bold text-[#FFE000] text-lg">
              BB
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                360° Persona Engine
                <span className="text-blue-400 ml-2 font-normal text-base">
                  Live Dashboard
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                Real-time abandon detection and intervention monitoring
              </p>
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isConnected
                  ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                  : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isConnected ? "text-green-400" : "text-red-400"
              }`}
            >
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Row 1: Overalls Section */}
        <OverallsSection stats={activeStats} />

        {/* Row 2: Persona Selector + Detail / Aggregate View */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Persona Selector */}
          <div className="col-span-12 lg:col-span-3">
            <PersonaSelector
              personas={personaStats}
              selectedPersona={selectedPersona}
              onSelect={setSelectedPersona}
            />
          </div>

          {/* Right: Persona Detail OR Aggregate Charts */}
          <div className="col-span-12 lg:col-span-9">
            {selectedPersonaDetail ? (
              <PersonaDetailView persona={selectedPersonaDetail} />
            ) : (
              <AggregateChartsView stats={activeStats} />
            )}
          </div>
        </div>

        {/* Row 3: Event Feed + Intervention Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AbandonEventFeed events={filteredEvents} />
          </div>
          <div className="lg:col-span-1">
            <InterventionLog events={filteredEvents} />
          </div>
        </div>
      </main>
    </div>
  );
}
