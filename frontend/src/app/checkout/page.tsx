"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Lock,
  CheckCircle,
} from "lucide-react";
import { AppProvider, useApp } from "@/lib/AppContext";
import { CATEGORY_IMAGES } from "@/lib/constants";
import NavBar from "@/components/storefront/NavBar";
import InterventionOverlay from "@/components/storefront/InterventionOverlay";

function CheckoutContent() {
  const router = useRouter();
  const { cart, cartTotal, cartItemCount, clearCart, tracker } = useApp();
  const enterTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    paymentMethod: "credit_card",
  });
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Track checkout_start on mount
  useEffect(() => {
    enterTimeRef.current = Date.now();
    if (cartItemCount > 0) {
      tracker.trackCheckoutStart(cartTotal, cartItemCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track page_leave on unmount without completing
  useEffect(() => {
    return () => {
      if (!completedRef.current) {
        const timeOnPage = Math.round((Date.now() - enterTimeRef.current) / 1000);
        tracker.trackPageLeave(
          "/checkout",
          "unknown",
          timeOnPage,
          true
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    completedRef.current = true;
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-500 mb-8">
            Thank you for your purchase. This is a demo -- no real order was placed.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#0046BE] text-white font-bold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-5xl mb-4">🛒</p>
          <p className="text-xl text-gray-500 mb-6">
            Your cart is empty. Add items before checking out.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#0046BE] text-white font-bold px-8 py-3 rounded-full hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back */}
        <button
          onClick={() => router.push("/cart")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0046BE] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Lock className="w-6 h-6 text-[#0046BE]" />
          Secure Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <form
            onSubmit={handlePlaceOrder}
            className="lg:col-span-2 space-y-6"
          >
            {/* Contact Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Contact Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0046BE] focus:border-transparent"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0046BE] focus:border-transparent"
                    placeholder="Doe"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0046BE] focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Shipping Address
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0046BE] focus:border-transparent"
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0046BE] focus:border-transparent"
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0046BE] focus:border-transparent bg-white"
                    >
                      <option value="">Select</option>
                      <option value="CA">California</option>
                      <option value="NY">New York</option>
                      <option value="TX">Texas</option>
                      <option value="FL">Florida</option>
                      <option value="IL">Illinois</option>
                      <option value="WA">Washington</option>
                      <option value="MN">Minnesota</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0046BE] focus:border-transparent"
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0046BE]" />
                Payment Method
              </h2>
              <div className="space-y-3">
                {[
                  { value: "credit_card", label: "Credit / Debit Card" },
                  { value: "paypal", label: "PayPal" },
                  { value: "bestbuy_card", label: "Best Buy Credit Card" },
                  { value: "affirm", label: "Affirm (Pay Later)" },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      formData.paymentMethod === method.value
                        ? "border-[#0046BE] bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleInputChange}
                      className="accent-[#0046BE]"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              className="w-full bg-[#FFE000] text-[#0046BE] font-extrabold py-4 rounded-xl text-lg hover:bg-yellow-300 transition-colors shadow-lg"
            >
              Place Order
            </button>
            <p className="text-center text-xs text-gray-400">
              This is a demo storefront. No real transactions will be processed.
            </p>
          </form>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 border-b border-gray-100 pb-4 mb-4 max-h-64 overflow-y-auto custom-scrollbar">
                {cart.map((item) => {
                  const emoji = CATEGORY_IMAGES[item.category] ?? "📦";
                  return (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-3"
                    >
                      <span className="text-2xl">{emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 shrink-0">
                        ${(item.price * item.quantity).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 text-sm border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
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

              <div className="flex justify-between text-lg font-bold text-gray-900">
                <span>Total</span>
                <span>
                  ${(cartTotal * 1.08).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InterventionOverlay />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <AppProvider>
        <CheckoutContent />
      </AppProvider>
    </Suspense>
  );
}
