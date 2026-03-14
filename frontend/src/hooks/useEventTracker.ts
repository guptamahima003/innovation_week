"use client";

import { useCallback } from "react";

interface EventTrackerOptions {
  send: (data: unknown) => void;
  sessionId: string;
}

export function useEventTracker({ send, sessionId }: EventTrackerOptions) {
  const sendEvent = useCallback(
    (eventType: string, data: Record<string, unknown>) => {
      send({
        type: "event",
        event_type: eventType,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        data,
      });
    },
    [send, sessionId]
  );

  const trackBrowse = useCallback(
    (product: { id: string; name: string; price: number; category: string }, timeOnPage: number) => {
      sendEvent("browse", {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        category: product.category,
        page: `/product/${product.id}`,
        time_on_page_seconds: timeOnPage,
      });
    },
    [sendEvent]
  );

  const trackAddToCart = useCallback(
    (product: { id: string; name: string; price: number }, quantity: number, cartTotal: number, cartItemCount: number) => {
      sendEvent("add_to_cart", {
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        quantity,
        cart_total: cartTotal,
        cart_item_count: cartItemCount,
      });
    },
    [sendEvent]
  );

  const trackRemoveFromCart = useCallback(
    (productId: string, productName: string, cartTotal: number, cartItemCount: number) => {
      sendEvent("remove_from_cart", {
        product_id: productId,
        product_name: productName,
        cart_total: cartTotal,
        cart_item_count: cartItemCount,
      });
    },
    [sendEvent]
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number, clickedResult: string | null = null) => {
      sendEvent("search", { query, results_count: resultsCount, clicked_result: clickedResult });
    },
    [sendEvent]
  );

  const trackCheckoutStart = useCallback(
    (cartTotal: number, cartItemCount: number) => {
      sendEvent("checkout_start", { cart_total: cartTotal, cart_item_count: cartItemCount });
    },
    [sendEvent]
  );

  const trackPageLeave = useCallback(
    (fromPage: string, toPage: string, timeOnPage: number, hadItemsInCart: boolean, productId?: string, productName?: string, productPrice?: number) => {
      sendEvent("page_leave", {
        from_page: fromPage,
        to_page: toPage,
        time_on_page_seconds: timeOnPage,
        had_items_in_cart: hadItemsInCart,
        product_id: productId,
        product_name: productName,
        product_price: productPrice,
      });
    },
    [sendEvent]
  );

  const trackExitIntent = useCallback(
    (currentPage: string, cartTotal: number, cartItemCount: number) => {
      sendEvent("exit_intent", {
        current_page: currentPage,
        cart_total: cartTotal,
        cart_item_count: cartItemCount,
      });
    },
    [sendEvent]
  );

  return {
    trackBrowse,
    trackAddToCart,
    trackRemoveFromCart,
    trackSearch,
    trackCheckoutStart,
    trackPageLeave,
    trackExitIntent,
    sendEvent,
  };
}
