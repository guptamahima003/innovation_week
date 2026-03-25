"use client";

import React from "react";
import { PERSONA_ICONS, PERSONA_LABELS, PERSONA_COLORS } from "@/lib/constants";
import type { PersonaDetailStats } from "@/lib/types";
import { LayoutGrid } from "lucide-react";

interface PersonaSelectorProps {
  personas: PersonaDetailStats[];
  selectedPersona: string | null;
  onSelect: (personaType: string | null) => void;
}

export default function PersonaSelector({
  personas,
  selectedPersona,
  onSelect,
}: PersonaSelectorProps) {
  // Sort by sessions descending
  const sorted = [...personas].sort((a, b) => b.sessions - a.sessions);

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
          Personas
        </h3>
      </div>

      {/* All Personas option */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
          selectedPersona === null
            ? "bg-blue-500/15 border-l-4 border-blue-400"
            : "hover:bg-slate-700/50 border-l-4 border-transparent"
        }`}
      >
        <LayoutGrid
          className={`w-4 h-4 ${
            selectedPersona === null ? "text-blue-400" : "text-gray-400"
          }`}
        />
        <span
          className={`text-sm font-medium ${
            selectedPersona === null ? "text-blue-400" : "text-gray-300"
          }`}
        >
          All Personas
        </span>
      </button>

      {/* Persona list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {sorted.map((persona) => {
          const isSelected = selectedPersona === persona.persona_type;
          const color = PERSONA_COLORS[persona.persona_type] || persona.color || "#6b7280";
          const icon = PERSONA_ICONS[persona.persona_type] || "";
          const label = PERSONA_LABELS[persona.persona_type] || persona.label;

          return (
            <button
              key={persona.persona_type}
              onClick={() =>
                onSelect(isSelected ? null : persona.persona_type)
              }
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                isSelected
                  ? "bg-slate-700/60 border-l-4"
                  : "hover:bg-slate-700/30 border-l-4 border-transparent"
              }`}
              style={isSelected ? { borderLeftColor: color } : undefined}
            >
              {/* Icon */}
              <span className="text-base shrink-0">{icon}</span>

              {/* Label and stats */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isSelected ? "text-white" : "text-gray-300"
                  }`}
                >
                  {label}
                </p>
                <p className="text-xs text-gray-500">
                  {persona.sessions} sessions
                  {persona.abandons > 0 && (
                    <span className="text-gray-600"> · {persona.abandon_rate}% abandon</span>
                  )}
                </p>
              </div>

              {/* Color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
