"use client";

import React, { useEffect } from "react";
import { X, Tag, Percent, CreditCard, TrendingUp, Users, Zap, Award, Info } from "lucide-react";
import { useApp } from "@/lib/AppContext";
import { PERSONA_ICONS, PERSONA_LABELS, PERSONA_COLORS } from "@/lib/constants";

function getTemplateStyle(template: string) {
  // Return { bg, border, accent, icon, label }
  if (template === "price_drop_alert") {
    return {
      bg: "bg-gradient-to-r from-yellow-50 to-orange-50",
      border: "border-yellow-400",
      accent: "bg-yellow-500 hover:bg-yellow-600",
      icon: <Percent className="w-5 h-5" />,
      label: "Price Drop",
    };
  }
  if (template === "member_pricing" || template === "vip_price_unlock") {
    return {
      bg: "bg-gradient-to-r from-blue-50 to-indigo-50",
      border: "border-blue-400",
      accent: "bg-blue-600 hover:bg-blue-700",
      icon: <Award className="w-5 h-5" />,
      label: "Member Exclusive",
    };
  }
  if (template === "tco_comparison" || template === "expert_comparison") {
    return {
      bg: "bg-gradient-to-r from-emerald-50 to-teal-50",
      border: "border-emerald-400",
      accent: "bg-emerald-600 hover:bg-emerald-700",
      icon: <Info className="w-5 h-5" />,
      label: "Expert Insight",
    };
  }
  if (template === "bnpl_offer" || template === "financing_explainer") {
    return {
      bg: "bg-gradient-to-r from-purple-50 to-pink-50",
      border: "border-purple-400",
      accent: "bg-purple-600 hover:bg-purple-700",
      icon: <CreditCard className="w-5 h-5" />,
      label: "Financing Available",
    };
  }
  if (template === "popular_among_enthusiasts") {
    return {
      bg: "bg-gradient-to-r from-rose-50 to-orange-50",
      border: "border-rose-400",
      accent: "bg-rose-600 hover:bg-rose-700",
      icon: <Users className="w-5 h-5" />,
      label: "Social Proof",
    };
  }
  if (template === "loyalty_bonus" || template === "points_multiplier") {
    return {
      bg: "bg-gradient-to-r from-amber-50 to-yellow-50",
      border: "border-amber-400",
      accent: "bg-amber-600 hover:bg-amber-700",
      icon: <TrendingUp className="w-5 h-5" />,
      label: "Loyalty Bonus",
    };
  }
  if (template === "flash_deal" || template === "bundle_builder") {
    return {
      bg: "bg-gradient-to-r from-red-50 to-pink-50",
      border: "border-red-400",
      accent: "bg-red-600 hover:bg-red-700",
      icon: <Zap className="w-5 h-5" />,
      label: "Flash Deal",
    };
  }
  // Default / generic
  return {
    bg: "bg-gradient-to-r from-gray-50 to-slate-50",
    border: "border-gray-300",
    accent: "bg-[#0046BE] hover:bg-blue-700",
    icon: <Tag className="w-5 h-5" />,
    label: "Special Offer",
  };
}

export default function InterventionOverlay() {
  const { intervention, hideIntervention } = useApp();

  // Handle escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideIntervention();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hideIntervention]);

  if (!intervention) return null;

  const { parameters, template, persona_type, reason } = intervention;
  const style = getTemplateStyle(template);
  const personaIcon = PERSONA_ICONS[persona_type] ?? "🤖";
  const personaLabel = PERSONA_LABELS[persona_type] ?? persona_type;
  const personaColor = PERSONA_COLORS[persona_type] ?? "#6366f1";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 animate-slide-up">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 -z-10"
        onClick={hideIntervention}
      />

      {/* Card */}
      <div
        className={`max-w-2xl mx-auto rounded-2xl border-2 ${style.border} ${style.bg} shadow-2xl overflow-hidden`}
      >
        {/* Top strip with badges */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/60 border-b border-black/5">
          <div className="flex items-center gap-2">
            {/* Template badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-xs font-semibold text-gray-700 shadow-sm border border-gray-200">
              {style.icon}
              {style.label}
            </span>
            {/* Persona badge */}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: personaColor }}
            >
              {personaIcon} {personaLabel}
            </span>
          </div>
          <button
            onClick={hideIntervention}
            className="p-1 rounded-full hover:bg-black/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Discount badge for price_drop_alert */}
          {template === "price_drop_alert" && parameters.discount_pct && (
            <div className="inline-flex items-center gap-1 px-3 py-1 mb-3 rounded-full bg-red-500 text-white text-sm font-bold animate-pulse">
              <Percent className="w-4 h-4" />
              {parameters.discount_pct}% OFF
            </div>
          )}

          {/* Urgency tag */}
          {parameters.urgency && (
            <div className="inline-flex items-center gap-1 px-3 py-1 mb-3 ml-2 rounded-full bg-orange-500 text-white text-xs font-semibold">
              <Zap className="w-3 h-3" />
              {parameters.urgency}
            </div>
          )}

          {/* Headline */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {parameters.headline}
          </h3>

          {/* Body text */}
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {parameters.body}
          </p>

          {/* Reason badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-gray-400">
              Triggered by: <span className="font-medium text-gray-500">{reason}</span>
            </span>
          </div>

          {/* Product info if available */}
          {parameters.product_name && (
            <div className="flex items-center gap-3 p-3 mb-4 rounded-lg bg-white/70 border border-black/5">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {parameters.product_name}
                </p>
                {parameters.product_price !== undefined && (
                  <p className="text-[#0046BE] font-bold">
                    ${parameters.product_price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={hideIntervention}
            className={`w-full py-3 px-6 rounded-xl text-white font-bold text-sm ${style.accent} transition-colors shadow-lg`}
          >
            {parameters.cta_text || "Continue Shopping"}
          </button>
        </div>
      </div>
    </div>
  );
}
