"use client";

import React from "react";
import type { DashboardEvent } from "@/lib/types";
import { PERSONA_COLORS, PERSONA_LABELS } from "@/lib/constants";

interface InterventionLogProps {
  events: DashboardEvent[];
}

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return timestamp;
  }
}

function formatLabel(text: string): string {
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function InterventionLog({ events }: InterventionLogProps) {
  const interventionEvents = events
    .filter((e) => e.intervention_triggered)
    .slice(0, 50);

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Intervention Log
        </h3>
        <span className="text-xs text-gray-400">
          {interventionEvents.length} interventions
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto custom-scrollbar min-h-0"
        style={{ maxHeight: "400px" }}
      >
        {interventionEvents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            No interventions yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-slate-600">
                <th className="pb-2 text-left font-medium">Time</th>
                <th className="pb-2 text-left font-medium">Persona</th>
                <th className="pb-2 text-left font-medium">Reason</th>
                <th className="pb-2 text-left font-medium">Type</th>
                <th className="pb-2 text-left font-medium">Template</th>
              </tr>
            </thead>
            <tbody>
              {interventionEvents.map((event) => {
                const personaColor =
                  PERSONA_COLORS[event.persona_type] || "#6b7280";
                const personaLabel =
                  PERSONA_LABELS[event.persona_type] || event.persona_type;

                return (
                  <tr
                    key={event.id}
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="py-2 pr-2 text-gray-400 font-mono text-xs whitespace-nowrap">
                      {formatTime(event.timestamp)}
                    </td>
                    <td className="py-2 pr-2">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          backgroundColor: `${personaColor}25`,
                          color: personaColor,
                          border: `1px solid ${personaColor}50`,
                        }}
                      >
                        {personaLabel}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-gray-300 text-xs">
                      {formatLabel(event.reason)}
                    </td>
                    <td className="py-2 pr-2 text-gray-300 text-xs whitespace-nowrap">
                      {event.intervention_type
                        ? formatLabel(event.intervention_type)
                        : "—"}
                    </td>
                    <td className="py-2 text-gray-400 text-xs truncate max-w-[120px]">
                      {event.intervention_template
                        ? formatLabel(event.intervention_template)
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
