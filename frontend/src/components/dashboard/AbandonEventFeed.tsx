"use client";

import React, { useEffect, useRef } from "react";
import type { DashboardEvent } from "@/lib/types";
import { PERSONA_COLORS, PERSONA_LABELS } from "@/lib/constants";

interface AbandonEventFeedProps {
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

function formatAbandonType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatReason(reason: string): string {
  return reason
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AbandonEventFeed({ events }: AbandonEventFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events.length]);

  const displayEvents = events.slice(0, 50);

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Live Abandon Events
        </h3>
        <span className="text-xs text-gray-400">
          {displayEvents.length} events
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-2 min-h-0"
        style={{ maxHeight: "400px" }}
      >
        {displayEvents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            Waiting for events...
          </div>
        ) : (
          displayEvents.map((event) => {
            const personaColor =
              PERSONA_COLORS[event.persona_type] || "#6b7280";
            const personaLabel =
              PERSONA_LABELS[event.persona_type] || event.persona_type;

            return (
              <div
                key={event.id}
                className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 animate-fade-in"
              >
                <div className="flex items-start gap-3">
                  {/* Timestamp */}
                  <span className="text-xs text-gray-400 font-mono whitespace-nowrap pt-0.5">
                    {formatTime(event.timestamp)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Persona badge */}
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

                      {/* Abandon type */}
                      <span className="text-xs font-medium text-gray-300">
                        {formatAbandonType(event.event_type)}
                      </span>

                      {/* Reason */}
                      <span className="text-xs text-gray-400">
                        — {formatReason(event.reason)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {event.product_name && (
                        <span className="text-xs text-gray-300 truncate">
                          {event.product_name}
                        </span>
                      )}
                      {event.product_price != null && event.product_price > 0 && (
                        <span className="text-xs font-semibold text-green-400">
                          ${event.product_price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                      {event.intervention_triggered && event.intervention_type && (
                        <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full" />
                          {formatAbandonType(event.intervention_type)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
