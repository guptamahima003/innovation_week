"""Rule-based abandon signal detection."""

from __future__ import annotations

from typing import Optional

from models.schemas import AbandonSignal, AbandonType


class AbandonDetector:
    """Detects abandonment signals from user events using rule-based logic."""

    def detect(self, event: dict, session_history: list[dict], cart: list[dict]) -> Optional[AbandonSignal]:
        """
        Analyze an event + session history to detect an abandon signal.
        Returns AbandonSignal if detected, None otherwise.
        """
        event_type = event.get("event_type", "")
        data = event.get("data", {})
        session_id = event.get("session_id", "")

        if event_type == "page_leave":
            return self._check_page_leave(session_id, data, session_history, cart)
        elif event_type == "exit_intent":
            return self._check_exit_intent(session_id, data, cart)
        elif event_type == "search":
            return self._check_search_abandon(session_id, data, session_history)

        return None

    def _check_page_leave(
        self,
        session_id: str,
        data: dict,
        history: list[dict],
        cart: list[dict],
    ) -> Optional[AbandonSignal]:
        """Check for abandonment when leaving a page."""
        from_page = data.get("from_page", "")
        time_on_page = data.get("time_on_page_seconds", 0)

        # Cart abandon: leaving cart page with items
        if "/cart" in from_page and cart:
            cart_total = sum(i.get("price", 0) * i.get("quantity", 1) for i in cart)
            return AbandonSignal(
                session_id=session_id,
                abandon_type=AbandonType.CART_ABANDON,
                cart_total=cart_total,
                cart_items=len(cart),
                product_name=cart[0].get("product_name") if cart else None,
                product_price=cart[0].get("price") if cart else None,
                product_id=cart[0].get("product_id") if cart else None,
            )

        # Checkout abandon: leaving checkout without completing
        if "/checkout" in from_page:
            has_completed = any(
                e.get("event_type") == "checkout_complete" for e in history
            )
            if not has_completed and cart:
                cart_total = sum(i.get("price", 0) * i.get("quantity", 1) for i in cart)
                return AbandonSignal(
                    session_id=session_id,
                    abandon_type=AbandonType.CHECKOUT_ABANDON,
                    cart_total=cart_total,
                    cart_items=len(cart),
                    product_name=cart[0].get("product_name") if cart else None,
                    product_price=cart[0].get("price") if cart else None,
                    product_id=cart[0].get("product_id") if cart else None,
                )

        # Product page abandon: spent time on product page but didn't add to cart
        if "/product" in from_page and time_on_page > 10:
            # Check if they added this product to cart recently
            product_id = data.get("product_id", "")
            recent_add = any(
                e.get("event_type") == "add_to_cart"
                and e.get("data", {}).get("product_id") == product_id
                for e in history[-5:]  # last 5 events
            )
            if not recent_add:
                return AbandonSignal(
                    session_id=session_id,
                    abandon_type=AbandonType.PRODUCT_PAGE_ABANDON,
                    product_id=product_id,
                    product_name=data.get("product_name"),
                    product_price=data.get("product_price"),
                    time_on_page=time_on_page,
                )

        return None

    def _check_exit_intent(
        self,
        session_id: str,
        data: dict,
        cart: list[dict],
    ) -> Optional[AbandonSignal]:
        """Detect exit intent (mouse leaving viewport)."""
        if cart:
            cart_total = sum(i.get("price", 0) * i.get("quantity", 1) for i in cart)
            current_page = data.get("current_page", "")

            if "/cart" in current_page or "/checkout" in current_page:
                abandon_type = AbandonType.CHECKOUT_ABANDON if "/checkout" in current_page else AbandonType.CART_ABANDON
            else:
                abandon_type = AbandonType.CART_ABANDON

            return AbandonSignal(
                session_id=session_id,
                abandon_type=abandon_type,
                cart_total=cart_total,
                cart_items=len(cart),
                product_name=cart[0].get("product_name") if cart else None,
                product_price=cart[0].get("price") if cart else None,
                product_id=cart[0].get("product_id") if cart else None,
            )
        return None

    def _check_search_abandon(
        self,
        session_id: str,
        data: dict,
        history: list[dict],
    ) -> Optional[AbandonSignal]:
        """Detect search abandon: searched but didn't click results."""
        results_count = data.get("results_count", 0)
        clicked_result = data.get("clicked_result")

        if results_count > 0 and not clicked_result:
            return AbandonSignal(
                session_id=session_id,
                abandon_type=AbandonType.SEARCH_ABANDON,
                search_query=data.get("query"),
            )
        return None


# Global singleton
detector = AbandonDetector()
