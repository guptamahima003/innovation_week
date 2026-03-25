"use client";

import React from "react";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import type { Product, PersonaType } from "@/lib/types";
import { CATEGORY_IMAGES } from "@/lib/constants";
import { getBadge, shouldShowPriceHint, PRICE_PRESENTATIONS } from "@/lib/personalization";

const CATEGORY_GRADIENTS: Record<string, string> = {
  tv_video: "from-blue-50 to-indigo-50",
  computing: "from-gray-50 to-slate-100",
  audio: "from-purple-50 to-fuchsia-50",
  phones: "from-sky-50 to-cyan-50",
  smart_home: "from-green-50 to-emerald-50",
  appliances: "from-orange-50 to-amber-50",
  gaming: "from-red-50 to-rose-50",
  cameras: "from-yellow-50 to-amber-50",
  wearables: "from-teal-50 to-cyan-50",
  networking: "from-indigo-50 to-blue-50",
  accessories: "from-zinc-50 to-stone-100",
  wellness: "from-pink-50 to-rose-50",
};

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  personaType?: PersonaType | null;
}

export default function ProductCard({ product, personaType }: ProductCardProps) {
  const emoji = CATEGORY_IMAGES[product.category] ?? "📦";
  const gradient = CATEGORY_GRADIENTS[product.category] ?? "from-gray-50 to-white";

  // Sparse: only ~30% of cards get a badge, with varied text
  const badge = personaType ? getBadge(personaType, product.id) : null;

  // Pricing tag always shown, but sub-text only on ~40% of cards
  const pricing = personaType ? PRICE_PRESENTATIONS[personaType] : null;
  const showHint = shouldShowPriceHint(product.id);

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
        {/* Emoji hero area */}
        <div
          className={`bg-gradient-to-br ${gradient} flex items-center justify-center h-44 text-7xl select-none relative`}
        >
          {emoji}

          {/* ── Social Proof Badge — sparse & varied ── */}
          {badge && (
            <div
              className={`absolute top-2 left-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${badge.gradient} backdrop-blur-sm shadow-sm`}
            >
              <span className="text-xs">{badge.icon}</span>
              <span className={`text-[10px] font-bold ${badge.textColor} truncate`}>
                {badge.text}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] group-hover:text-[#0046BE] transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <RatingStars rating={product.rating} />
            <span className="text-xs text-gray-500">
              ({product.review_count.toLocaleString()})
            </span>
          </div>

          {/* ── Dynamic Price ── */}
          <div className="mt-3">
            {/* Price tag pill — only show on cards with hints */}
            {pricing && showHint && (
              <div className="mb-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${pricing.tagBg} ${pricing.tagText}`}
                >
                  {pricing.tagIcon} {pricing.tag}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#0046BE]">
                  ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                {pricing?.showStrikethrough && showHint && (
                  <span className="text-xs text-gray-400 line-through">
                    ${(product.price * pricing.originalPriceMultiplier).toFixed(2)}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0046BE] transition-colors" />
            </div>

            {/* Sub-text — only on ~40% of cards */}
            {pricing && showHint && (
              <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                {pricing.subText(product.price)}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
