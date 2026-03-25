"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { PersonaType } from "@/lib/types";
import { SESSION_NUDGES } from "@/lib/personalization";

interface SessionNudgeProps {
  personaType: PersonaType | null;
  /** How many product views before showing the nudge */
  triggerAfterViews?: number;
  /** Current number of products the user has viewed */
  productViewCount: number;
}

const NUDGE_SHOWN_KEY = "bb_nudge_shown";

export default function SessionNudge({
  personaType,
  triggerAfterViews = 3,
  productViewCount,
}: SessionNudgeProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (dismissed) return;
    if (!personaType) return;
    if (typeof window === "undefined") return;

    const alreadyShown = sessionStorage.getItem(NUDGE_SHOWN_KEY);
    if (alreadyShown) return;

    if (productViewCount >= triggerAfterViews) {
      // Small delay so it doesn't appear instantly
      const timer = setTimeout(() => {
        setVisible(true);
        sessionStorage.setItem(NUDGE_SHOWN_KEY, "1");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [personaType, productViewCount, triggerAfterViews, dismissed]);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setDismissed(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || !personaType) return null;

  const nudge = SESSION_NUDGES[personaType];
  if (!nudge) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-md w-[90vw]
        ${nudge.bg} ${nudge.textColor} rounded-xl shadow-2xl px-5 py-3.5
        flex items-center gap-3
        animate-in slide-in-from-bottom-4 fade-in duration-500`}
    >
      <span className="text-xl shrink-0">{nudge.icon}</span>
      <p className="text-sm font-medium flex-1">{nudge.message}</p>
      <button
        onClick={() => {
          setVisible(false);
          setDismissed(true);
        }}
        className="shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
