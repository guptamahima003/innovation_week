"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface AbandonReasonChartProps {
  abandonsByReason: Record<string, number>;
}

const REASON_COLORS: Record<string, string> = {
  price_too_high: "#ef4444",
  payment_friction: "#f59e0b",
  confidence_gap: "#8b5cf6",
  couldnt_find_it: "#3b82f6",
  distraction: "#6b7280",
};

function formatReason(reason: string): string {
  return reason
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AbandonReasonChart({
  abandonsByReason,
}: AbandonReasonChartProps) {
  const data = Object.entries(abandonsByReason)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      reason: formatReason(key),
      count: value,
      fill: REASON_COLORS[key] || "#6366f1",
    }))
    .sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex items-center justify-center h-full">
        <p className="text-gray-400">No abandon data yet</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Abandons by Reason
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#334155"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={{ stroke: "#475569" }}
            tickLine={{ stroke: "#475569" }}
          />
          <YAxis
            type="category"
            dataKey="reason"
            tick={{ fill: "#cbd5e1", fontSize: 12 }}
            axisLine={{ stroke: "#475569" }}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#fff",
            }}
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
