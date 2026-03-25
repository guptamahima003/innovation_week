"use client";

import React from "react";
import {
  Activity,
  Users,
  ShoppingCart,
  DollarSign,
  Zap,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import type { DashboardStats } from "@/lib/types";

interface OverallsSectionProps {
  stats: DashboardStats;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subText?: string;
  borderColor: string;
  iconBg: string;
}

function StatCard({ icon, label, value, subText, borderColor, iconBg }: StatCardProps) {
  return (
    <div
      className="bg-slate-800 rounded-xl shadow-lg p-5 flex items-center gap-4 border-l-4 border border-slate-700/50 hover:bg-slate-750 transition-colors"
      style={{ borderLeftColor: borderColor }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${iconBg}20` }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-white leading-tight">{value}</p>
        {subText && (
          <p className="text-xs text-gray-500 mt-0.5">{subText}</p>
        )}
      </div>
    </div>
  );
}

export default function OverallsSection({ stats }: OverallsSectionProps) {
  const abandonRate =
    stats.total_sessions > 0
      ? ((stats.total_abandons / stats.total_sessions) * 100).toFixed(1)
      : "0.0";

  const recoveryRate =
    stats.revenue_at_risk > 0
      ? ((stats.estimated_revenue_recovered / stats.revenue_at_risk) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Overalls</h2>
      </div>

      {/* Primary metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-6 h-6 text-blue-400" />}
          label="Total Sessions"
          value={stats.total_sessions.toLocaleString()}
          subText={`${stats.active_sessions.toLocaleString()} active`}
          borderColor="#3b82f6"
          iconBg="#3b82f6"
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-purple-400" />}
          label="Unique Customers"
          value={(stats.unique_customers ?? 0).toLocaleString()}
          borderColor="#a855f7"
          iconBg="#a855f7"
        />
        <StatCard
          icon={<ShoppingCart className="w-6 h-6 text-red-400" />}
          label="Total Abandons"
          value={stats.total_abandons.toLocaleString()}
          subText={`${abandonRate}% abandon rate`}
          borderColor="#ef4444"
          iconBg="#ef4444"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-green-400" />}
          label="Revenue Recovered"
          value={`$${stats.estimated_revenue_recovered.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
          subText={`${recoveryRate}% recovery rate`}
          borderColor="#10b981"
          iconBg="#10b981"
        />
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-gray-400">Interventions</span>
          </div>
          <p className="text-lg font-bold text-white">
            {stats.interventions_triggered.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-gray-400">Revenue at Risk</span>
          </div>
          <p className="text-lg font-bold text-white">
            ${stats.revenue_at_risk.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs text-gray-400">Avg Recovery Rate</span>
          </div>
          <p className="text-lg font-bold text-white">{recoveryRate}%</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs text-gray-400">Active Sessions</span>
          </div>
          <p className="text-lg font-bold text-white">
            {stats.active_sessions.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
