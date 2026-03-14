"use client";

import React from "react";
import Link from "next/link";
import { Star, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { CATEGORY_IMAGES } from "@/lib/constants";

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
}

export default function ProductCard({ product }: ProductCardProps) {
  const emoji = CATEGORY_IMAGES[product.category] ?? "📦";
  const gradient = CATEGORY_GRADIENTS[product.category] ?? "from-gray-50 to-white";

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
        {/* Emoji hero area */}
        <div
          className={`bg-gradient-to-br ${gradient} flex items-center justify-center h-44 text-7xl select-none`}
        >
          {emoji}
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

          {/* Price + Arrow */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-lg font-bold text-[#0046BE]">
              ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0046BE] transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
