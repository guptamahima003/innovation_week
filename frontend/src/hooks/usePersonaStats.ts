"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/constants";
import type { PersonaDetailStats } from "@/lib/types";

export function usePersonaStats() {
  const [personaStats, setPersonaStats] = useState<PersonaDetailStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/personas/all/stats`);
      if (res.ok) {
        const data = await res.json();
        setPersonaStats(data.personas ?? []);
      }
    } catch {
      // Silently fail — will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { personaStats, loading, refetch: fetchStats };
}
