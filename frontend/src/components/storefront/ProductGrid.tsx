"use client";

import React, { useState } from "react";
import type { Product, PersonaType } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_IMAGES } from "@/lib/constants";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  showCategoryFilter?: boolean;
  personaType?: PersonaType | null;
}

export default function ProductGrid({ products, showCategoryFilter = false, personaType }: ProductGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filtered = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  return (
    <div>
      {/* Category filter tabs */}
      {showCategoryFilter && categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === null
                ? "bg-[#0046BE] text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? "bg-[#0046BE] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {CATEGORY_IMAGES[cat] ?? "📦"}{" "}
                {CATEGORY_LABELS[cat] ?? cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} personaType={personaType} />
          ))}
        </div>
      )}
    </div>
  );
}
