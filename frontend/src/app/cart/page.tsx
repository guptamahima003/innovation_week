"use client";

import React, { Suspense, useEffect, useRef } from "react";
import Link from "next/link";
import { Trash2, ShoppingCart, ArrowLeft, ChevronRight } from "lucide-react";
import { AppProvider, useApp } from "@/lib/AppContext";
import { CATEGORY_IMAGES } from "@/lib/constants";
import NavBar from "@/components/storefront/NavBar";
import InterventionOverlay from "@/components/storefront/InterventionOverlay";

function CartContent() {
  const { cart, cartTotal, cartItemCount, removeFromCart, tracker } = useApp();
  const enterTimeRef = useRef(Date.now());
  const cartRef = useRef(cart);

  // Keep cartRef up to date
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Track page_leave on unmount
  useEffect(() => {
    enterTimeRef.current = Date.now();
    return () => {
      const timeOnPage = Math.round((Date.now() - enterTimeRef.current) / 1000);
      tracker.trackPageLeave(
        "/cart",
        "unknown",
        timeOnPage,
        cartRef.current.length > 0
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = (productId: string, productName: string) => {
    removeFromCart(productId);
    const newTotal = cartTotal - (cart.find((c) => c.product_id === productId)?.price ?? 0);
    tracker.trackRemoveFromCart(productId, productName, newTotal, cartItemCount - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0046BE] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <ShoppingCart className="w-7 h-7 text-[#0046BE]" />
          Your Cart
          {cartItemCount > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({cartItemCount} {cartItemCount === 1 ? "item" : "items"})
            </span>
          )}
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-6xl mb-4">🛒</p>
            <p className="text-xl text-gray-500 mb-6">Your cart is empty</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#0046BE] text-white font-semibold px-6 py-3 rounded-full hover:bg-blue-700 transition-colors"
            >
              Browse Products
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                const emoji = CATEGORY_IMAGES[item.category] ?? "📦";
                return (
                  <div
                    key={item.product_id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm"
                  >
                    {/* Emoji */}
                    <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-3xl shrink-0">
                      {emoji}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {item.product_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-[#0046BE] font-bold mt-1">
                        ${(item.price * item.quantity).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(item.product_id, item.product_name)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-24">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-2 text-sm border-b border-gray-100 pb-4 mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cartItemCount} items)</span>
                    <span>
                      ${cartTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated Tax</span>
                    <span>
                      ${(cartTotal * 0.08).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-lg font-bold text-gray-900 mb-6">
                  <span>Total</span>
                  <span>
                    ${(cartTotal * 1.08).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="block w-full text-center bg-[#FFE000] text-[#0046BE] font-bold py-3 rounded-xl hover:bg-yellow-300 transition-colors shadow-lg"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <InterventionOverlay />
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <AppProvider>
        <CartContent />
      </AppProvider>
    </Suspense>
  );
}
