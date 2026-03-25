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
  PieChart,
  Pie,
} from "recharts";
import {
  Activity,
  ShoppingCart,
  Zap,
  DollarSign,
  TrendingUp,
  Target,
  Package,
} from "lucide-react";
import { PERSONA_ICONS } from "@/lib/constants";
import type { PersonaDetailStats } from "@/lib/types";

interface PersonaDetailViewProps {
  persona: PersonaDetailStats;
}

const REASON_COLORS: Record<string, string> = {
  price_too_high: "#ef4444",
  payment_friction: "#f59e0b",
  confidence_gap: "#8b5cf6",
  couldnt_find_it: "#3b82f6",
  distraction: "#6b7280",
};

const INTERVENTION_COLORS: Record<string, string> = {
  overlay: "#3b82f6",
  push_notification: "#f59e0b",
  email_template: "#10b981",
};

function formatLabel(text: string): string {
  return text
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDollar(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function MiniStat({
  icon,
  label,
  value,
  subText,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subText?: string;
  color: string;
}) {
  return (
    <div className="bg-slate-700/40 rounded-lg p-4 border border-slate-600/30">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      {subText && <p className="text-xs mt-1" style={{ color }}>{subText}</p>}
    </div>
  );
}

export default function PersonaDetailView({ persona }: PersonaDetailViewProps) {
  const icon = PERSONA_ICONS[persona.persona_type] || "";

  // Prepare abandon reasons chart data
  const reasonData = Object.entries(persona.abandons_by_reason)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      reason: formatLabel(key),
      count: value,
      fill: REASON_COLORS[key] || "#6366f1",
    }))
    .sort((a, b) => b.count - a.count);

  // Prepare intervention types pie data
  const interventionData = Object.entries(persona.interventions_by_type)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({
      name: formatLabel(key),
      value,
      color: INTERVENTION_COLORS[key] || "#6b7280",
    }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div
        className="bg-slate-800 rounded-xl p-5 border border-slate-700/50"
        style={{ borderLeftWidth: "4px", borderLeftColor: persona.color }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h2 className="text-xl font-bold text-white">{persona.label}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{persona.description}</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat
          icon={<Activity className="w-4 h-4 text-blue-400" />}
          label="Sessions"
          value={persona.sessions.toLocaleString()}
          subText={`${persona.conversion_rate}% conversion`}
          color="#3b82f6"
        />
        <MiniStat
          icon={<ShoppingCart className="w-4 h-4 text-red-400" />}
          label="Abandons"
          value={persona.abandons.toLocaleString()}
          subText={`${persona.abandon_rate}% rate`}
          color="#ef4444"
        />
        <MiniStat
          icon={<Zap className="w-4 h-4 text-amber-400" />}
          label="Interventions"
          value={persona.interventions.toLocaleString()}
          subText={`${persona.intervention_success_rate}% success`}
          color="#f59e0b"
        />
        <MiniStat
          icon={<DollarSign className="w-4 h-4 text-green-400" />}
          label="Revenue Recovered"
          value={formatDollar(persona.revenue_recovered)}
          subText={`of ${formatDollar(persona.revenue_at_risk)} at risk`}
          color="#10b981"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Abandon reasons bar chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-red-400" />
            Abandon Reasons
          </h3>
          {reasonData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No abandon data</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={reasonData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#475569" }}
                  tickLine={{ stroke: "#475569" }}
                />
                <YAxis
                  type="category"
                  dataKey="reason"
                  tick={{ fill: "#cbd5e1", fontSize: 11 }}
                  axisLine={{ stroke: "#475569" }}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {reasonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Intervention types pie chart */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Intervention Types
          </h3>
          {interventionData.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No intervention data</p>
          ) : (
            <div className="flex items-center">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={interventionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={35}
                    dataKey="value"
                    stroke="none"
                  >
                    {interventionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {interventionData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-gray-300 truncate">{item.name}</span>
                    <span className="text-xs text-gray-500 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: additional data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top abandoned products */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-400" />
            Top Abandoned Products
          </h3>
          {persona.top_abandoned_products.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2">
              {persona.top_abandoned_products.map((product, i) => (
                <div
                  key={product.name}
                  className="flex items-center gap-3 text-sm"
                >
                  <span className="text-gray-500 w-5 text-right font-mono text-xs">
                    #{i + 1}
                  </span>
                  <span className="text-gray-300 flex-1 truncate">{product.name}</span>
                  <span className="text-gray-400 font-mono text-xs">
                    {product.count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional metrics */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700/50">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Key Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Avg Cart Value</span>
              <span className="text-sm font-semibold text-white">
                {formatDollar(persona.avg_cart_value)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Conversion Rate</span>
              <span className="text-sm font-semibold text-white">
                {persona.conversion_rate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Intervention Success</span>
              <span className="text-sm font-semibold text-white">
                {persona.intervention_success_rate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Revenue at Risk</span>
              <span className="text-sm font-semibold text-red-400">
                {formatDollar(persona.revenue_at_risk)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Revenue Recovered</span>
              <span className="text-sm font-semibold text-green-400">
                {formatDollar(persona.revenue_recovered)}
              </span>
            </div>
            {/* Recovery progress bar */}
            <div className="pt-1">
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(persona.intervention_success_rate, 100)}%`,
                    background:
                      persona.intervention_success_rate > 50
                        ? "linear-gradient(90deg, #10b981, #34d399)"
                        : persona.intervention_success_rate > 25
                        ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                        : "linear-gradient(90deg, #ef4444, #f87171)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
