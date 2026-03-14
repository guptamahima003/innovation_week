"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { PERSONA_COLORS, PERSONA_LABELS } from "@/lib/constants";

interface PersonaPieChartProps {
  personaDistribution: Record<string, number>;
}

interface PieEntry {
  name: string;
  value: number;
  color: string;
  key: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (!percent || percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = (innerRadius ?? 0) + ((outerRadius ?? 0) - (innerRadius ?? 0)) * 0.5;
  const x = (cx ?? 0) + radius * Math.cos(-(midAngle ?? 0) * RADIAN);
  const y = (cy ?? 0) + radius * Math.sin(-(midAngle ?? 0) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function PersonaPieChart({
  personaDistribution,
}: PersonaPieChartProps) {
  const data: PieEntry[] = Object.entries(personaDistribution)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: PERSONA_LABELS[key] || key,
      value,
      color: PERSONA_COLORS[key] || "#6b7280",
      key,
    }));

  if (data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex items-center justify-center h-full">
        <p className="text-gray-400">No persona data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Persona Distribution
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            outerRadius={90}
            innerRadius={40}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span style={{ color: "#cbd5e1", fontSize: "12px" }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
