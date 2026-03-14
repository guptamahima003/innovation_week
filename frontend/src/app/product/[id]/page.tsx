"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingCart,
  Star,
  Tag,
  Check,
} from "lucide-react";
import { AppProvider, useApp } from "@/lib/AppContext";
import { getProduct } from "@/lib/api";
import type { Product } from "@/lib/types";
import { CATEGORY_IMAGES } from "@/lib/constants";
import NavBar from "@/components/storefront/NavBar";
import InterventionOverlay from "@/components/storefront/InterventionOverlay";

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { addToCart, cart, cartTotal, cartItemCount, tracker } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);
  const enterTimeRef = useRef(Date.now());
  const productRef = useRef<Product | null>(null);

  // Fetch product
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    getProduct(productId)
      .then((p) => {
        setProduct(p);
        productRef.current = p;
      })
      .catch((err) => console.error("Failed to fetch product:", err))
      .finally(() => setLoading(false));
  }, [productId]);

  // Track browse time and fire page_leave on unmount / navigate away
  useEffect(() => {
    enterTimeRef.current = Date.now();

    return () => {
      const timeOnPage = Math.round((Date.now() - enterTimeRef.current) / 1000);
      const p = productRef.current;
      if (p) {
        tracker.trackBrowse(
          { id: p.id, name: p.name, price: p.price, category: p.category },
          timeOnPage
        );
        tracker.trackPageLeave(
          `/product/${p.id}`,
          "unknown",
          timeOnPage,
          false,
          p.id,
          p.name,
          p.price
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
    });

    const newTotal = cartTotal + product.price;
    const newCount = cartItemCount + 1;
    tracker.trackAddToCart(
      { id: product.id, name: product.name, price: product.price },
      1,
      newTotal,
      newCount
    );

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-gray-200 rounded mb-8" />
            <div className="grid md:grid-cols-2 gap-10">
              <div className="h-80 bg-gray-100 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-10 bg-gray-200 rounded w-1/4" />
                <div className="h-20 bg-gray-100 rounded" />
                <div className="h-12 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <p className="text-5xl mb-4">😢</p>
          <p className="text-xl text-gray-500">Product not found.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-2 bg-[#0046BE] text-white rounded-full font-medium hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const emoji = CATEGORY_IMAGES[product.category] ?? "📦";
  const isInCart = cart.some((c) => c.product_id === product.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#0046BE] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </button>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Product Image Area */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl flex items-center justify-center h-80 md:h-96 text-9xl select-none border border-gray-200">
            {emoji}
          </div>

          {/* Product Info */}
          <div>
            <p className="text-xs font-semibold text-[#0046BE] uppercase tracking-wider mb-1">
              {product.category.replace(/_/g, " ")}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= Math.round(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.rating.toFixed(1)} ({product.review_count.toLocaleString()} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-extrabold text-[#0046BE] mb-4">
              ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                addedToCart
                  ? "bg-green-500 text-white"
                  : "bg-[#FFE000] text-[#0046BE] hover:bg-yellow-300"
              }`}
            >
              {addedToCart ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Added to Cart!
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  {isInCart ? "Add Another" : "Add to Cart"}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <InterventionOverlay />
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <AppProvider>
        <ProductDetailContent />
      </AppProvider>
    </Suspense>
  );
}
