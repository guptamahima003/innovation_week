"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { AppProvider, useApp } from "@/lib/AppContext";
import { getProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import NavBar from "@/components/storefront/NavBar";
import ProductGrid from "@/components/storefront/ProductGrid";
import InterventionOverlay from "@/components/storefront/InterventionOverlay";
import SessionNudge from "@/components/storefront/SessionNudge";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { PERSONA_ICONS, PERSONA_LABELS, PERSONA_COLORS } from "@/lib/constants";

function HomeContent() {
  const { session } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const personaType = session?.persona_type ?? null;

  useEffect(() => {
    getProducts()
      .then((data) => setProducts(data))
      .catch((err) => console.error("Failed to fetch products:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filtered = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : products;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar onSearch={handleSearch} />

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#0046BE] to-[#003399] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Welcome to{" "}
              <span className="text-[#FFE000]">Best Buy</span>
            </h1>
            <p className="text-lg text-blue-100 mb-6">
              Discover the latest in tech, home appliances, and more. Personalized deals just for you.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="#products"
                className="inline-flex items-center gap-2 bg-[#FFE000] text-[#0046BE] font-bold px-6 py-3 rounded-full hover:bg-yellow-300 transition-colors shadow-lg"
              >
                Shop Now
                <ChevronRight className="w-5 h-5" />
              </Link>
              {/* Persona-aware experience badge */}
              {personaType && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold shadow-lg border border-white/20 backdrop-blur-sm"
                  style={{ backgroundColor: PERSONA_COLORS[personaType] + "cc" }}
                >
                  <span className="text-base">{PERSONA_ICONS[personaType]}</span>
                  <span className="text-white">
                    {PERSONA_LABELS[personaType]} Experience
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {searchQuery ? `Search results for "${searchQuery}"` : "Featured Products"}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-6 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProductGrid products={filtered} showCategoryFilter personaType={personaType} />
        )}
      </section>

      {/* Session nudge — subtle toast shown once after browsing */}
      <SessionNudge
        personaType={personaType}
        triggerAfterViews={1}
        productViewCount={products.length > 0 ? 3 : 0}
      />

      <InterventionOverlay />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</div>}>
      <AppProvider>
        <HomeContent />
      </AppProvider>
    </Suspense>
  );
}
