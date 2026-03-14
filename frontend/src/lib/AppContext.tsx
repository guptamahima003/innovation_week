"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { CartItem, Intervention, InterventionMessage, SessionInfo } from "@/lib/types";
import { createSession } from "@/lib/api";
import { API_URL, WS_URL } from "@/lib/constants";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEventTracker } from "@/hooks/useEventTracker";

interface AppContextValue {
  session: SessionInfo | null;
  cart: CartItem[];
  cartTotal: number;
  cartItemCount: number;
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  intervention: Intervention | null;
  showIntervention: (i: Intervention) => void;
  hideIntervention: () => void;
  tracker: ReturnType<typeof useEventTracker>;
  wsConnected: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionInitRef = useRef(false);

  // Derive cart totals
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // ---- Session creation on mount ----
  useEffect(() => {
    if (sessionInitRef.current) return;
    sessionInitRef.current = true;

    const forcePersona = searchParams.get("force_persona") ?? undefined;

    // If force_persona is set, always create a new session
    if (forcePersona) {
      sessionStorage.removeItem("bb_session");
      sessionStorage.removeItem("bb_cart");
    }

    // Check for existing session in sessionStorage
    const stored = sessionStorage.getItem("bb_session");
    if (stored && !forcePersona) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.session_id) {
          setSession(parsed);
          const storedCart = sessionStorage.getItem("bb_cart");
          if (storedCart) setCart(JSON.parse(storedCart));
          // Validate session still exists on backend
          fetch(`${API_URL}/api/session/${parsed.session_id}`)
            .then((res) => {
              if (!res.ok) throw new Error("Session expired");
            })
            .catch(() => {
              // Session no longer exists — create a new one
              console.log("[AppContext] Stale session, creating new...");
              sessionStorage.removeItem("bb_session");
              sessionStorage.removeItem("bb_cart");
              setCart([]);
              createSession(forcePersona)
                .then((s) => {
                  setSession(s);
                  sessionStorage.setItem("bb_session", JSON.stringify(s));
                })
                .catch((err) => console.error("[AppContext] Retry failed:", err));
            });
          return;
        }
      } catch {
        // fall through and create new
      }
    }

    // Create new session with retry
    const attemptCreate = (retries = 3, delay = 1000) => {
      createSession(forcePersona)
        .then((s) => {
          setSession(s);
          sessionStorage.setItem("bb_session", JSON.stringify(s));
        })
        .catch((err) => {
          console.error(`[AppContext] Session creation failed (${retries} retries left):`, err);
          if (retries > 0) {
            setTimeout(() => attemptCreate(retries - 1, delay * 2), delay);
          }
        });
    };
    attemptCreate();
  }, [searchParams]);

  // Persist cart
  useEffect(() => {
    sessionStorage.setItem("bb_cart", JSON.stringify(cart));
  }, [cart]);

  // ---- WebSocket ----
  const handleWsMessage = useCallback((data: unknown) => {
    const msg = data as InterventionMessage;
    if (msg?.type === "intervention" && msg.intervention) {
      setIntervention(msg.intervention);

      // Auto-dismiss
      const duration = msg.intervention.parameters.display_duration_seconds ?? 15;
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setIntervention(null);
      }, duration * 1000);
    }
  }, []);

  const wsUrl = session ? `${WS_URL}/ws/storefront/${session.session_id}` : "";
  const { isConnected: wsConnected, send } = useWebSocket({
    url: wsUrl,
    onMessage: handleWsMessage,
    enabled: !!session,
  });

  // ---- Event Tracker ----
  const tracker = useEventTracker({
    send,
    sessionId: session?.session_id ?? "",
  });

  // ---- Cart methods ----
  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product_id === item.product_id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((c) => c.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // ---- Intervention ----
  const showIntervention = useCallback((i: Intervention) => {
    setIntervention(i);
  }, []);

  const hideIntervention = useCallback(() => {
    setIntervention(null);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      session,
      cart,
      cartTotal,
      cartItemCount,
      addToCart,
      removeFromCart,
      clearCart,
      intervention,
      showIntervention,
      hideIntervention,
      tracker,
      wsConnected,
    }),
    [
      session,
      cart,
      cartTotal,
      cartItemCount,
      addToCart,
      removeFromCart,
      clearCart,
      intervention,
      showIntervention,
      hideIntervention,
      tracker,
      wsConnected,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
