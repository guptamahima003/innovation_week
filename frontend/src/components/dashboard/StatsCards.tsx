"use client";

import React from "react";
import { Activity, Users, ShoppingCart, Zap, DollarSign } from "lucide-react";
import type { DashboardStats } from "@/lib/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  borderColor: string;
  iconBg: string;
}

function StatCard({ icon, label, value, borderColor, iconBg }: StatCardProps) {
  return (
    <div
      className={`bg-slate-800 rounded-lg shadow-lg p-6 flex items-center gap-4 border-l-4`}
      style={{ borderLeftColor: borderColor }}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${iconBg}20` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        icon={<Activity className="w-6 h-6 text-blue-400" />}
        label="Total Sessions"
        value={stats.total_sessions.toLocaleString()}
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
        borderColor="#ef4444"
        iconBg="#ef4444"
      />
      <StatCard
        icon={<Zap className="w-6 h-6 text-green-400" />}
        label="Interventions Triggered"
        value={stats.interventions_triggered.toLocaleString()}
        borderColor="#10b981"
        iconBg="#10b981"
      />
      <StatCard
        icon={<DollarSign className="w-6 h-6 text-yellow-400" />}
        label="Revenue Recovered"
        value={`$${stats.estimated_revenue_recovered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        borderColor="#f59e0b"
        iconBg="#f59e0b"
      />
    </div>
  );
}
