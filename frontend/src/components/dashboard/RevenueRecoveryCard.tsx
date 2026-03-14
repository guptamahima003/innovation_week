"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

interface RevenueRecoveryCardProps {
  revenueAtRisk: number;
  estimatedRecovered: number;
}

function formatDollar(amount: number): string {
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function RevenueRecoveryCard({
  revenueAtRisk,
  estimatedRecovered,
}: RevenueRecoveryCardProps) {
  const recoveryPercentage =
    revenueAtRisk > 0
      ? Math.min((estimatedRecovered / revenueAtRisk) * 100, 100)
      : 0;

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">
            Revenue Recovery
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Revenue at Risk</p>
            <p className="text-3xl font-bold text-red-400">
              {formatDollar(revenueAtRisk)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-1">Estimated Recovered</p>
            <p className="text-3xl font-bold text-green-400">
              {formatDollar(estimatedRecovered)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Recovery Rate</span>
          <span className="text-sm font-bold text-white">
            {recoveryPercentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${recoveryPercentage}%`,
              background:
                recoveryPercentage > 50
                  ? "linear-gradient(90deg, #10b981, #34d399)"
                  : recoveryPercentage > 25
                  ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                  : "linear-gradient(90deg, #ef4444, #f87171)",
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {formatDollar(estimatedRecovered)} of {formatDollar(revenueAtRisk)} recovered
        </p>
      </div>
    </div>
  );
}
