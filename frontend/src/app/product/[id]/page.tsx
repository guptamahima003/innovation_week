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
import type { Product, PersonaType } from "@/lib/types";
import { CATEGORY_IMAGES } from "@/lib/constants";
import NavBar from "@/components/storefront/NavBar";
import InterventionOverlay from "@/components/storefront/InterventionOverlay";
import {
  CTA_CONFIGS,
  PRICE_PRESENTATIONS,
  SOCIAL_PROOF_BADGES,
} from "@/lib/personalization";

/* ── Persona-specific "Why Buy" module (collapsible, subtle) ──────────── */
function WhyBuyModule({ product, persona }: { product: Product; persona: PersonaType }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const modules: Record<string, { title: string; icon: string; bullets: string[]; accent: string }> = {
    tech_enthusiast: {
      title: "Innovation Spotlight",
      icon: "🚀",
      accent: "border-indigo-400 bg-indigo-50",
      bullets: [
        "Latest generation technology",
        `Top rated: ${product.rating.toFixed(1)}★ from ${product.review_count.toLocaleString()} tech reviewers`,
        "Free expedited shipping for early adopters",
        "Best Buy Exclusive — limited availability",
      ],
    },
    value_hunter: {
      title: "Your Deal Breakdown",
      icon: "💰",
      accent: "border-amber-400 bg-amber-50",
      bullets: [
        `List Price: $${(product.price * 1.43).toFixed(2)}`,
        `Sale Discount: -$${(product.price * 0.3).toFixed(0)}`,
        `Your Price: $${product.price.toFixed(2)} — lowest this quarter`,
        "Price match guarantee · Open box option available",
      ],
    },
    considered_researcher: {
      title: "Research Summary",
      icon: "📊",
      accent: "border-emerald-400 bg-emerald-50",
      bullets: [
        `${product.review_count.toLocaleString()} verified reviews · ${product.rating.toFixed(1)}★ avg`,
        "Expert comparison available vs top 3 alternatives",
        "Price match guarantee included",
        "30-day cart save — take your time",
      ],
    },
    loyalty_power_user: {
      title: "Your Member Benefits",
      icon: "⭐",
      accent: "border-blue-400 bg-blue-50",
      bullets: [
        `Earn ${Math.round(product.price * 0.04).toLocaleString()} reward points ($${(product.price * 0.04).toFixed(0)} value)`,
        "2X points during this promotion",
        "Free shipping + free returns for members",
        "Early access to new releases",
      ],
    },
    lapsing_customer: {
      title: "New Since You've Been Away",
      icon: "👋",
      accent: "border-rose-400 bg-rose-50",
      bullets: [
        `This product is trending — ${product.review_count.toLocaleString()} new reviews`,
        "Exclusive 10% welcome-back discount",
        "Simplified 1-click checkout available",
        "Free shipping on your return order",
      ],
    },
    business_buyer: {
      title: "Total Cost of Ownership",
      icon: "🏢",
      accent: "border-violet-400 bg-violet-50",
      bullets: [
        `Unit cost: $${product.price.toFixed(2)} · Bulk (10+): $${(product.price * 0.9).toFixed(2)}/ea`,
        "Extended warranty: +$" + Math.round(product.price * 0.1) + "/unit/yr",
        "Geek Squad setup available · Net 30 terms",
        "Dedicated account rep included for 5+ units",
      ],
    },
    impulse_buyer: {
      title: "Why Wait?",
      icon: "⚡",
      accent: "border-pink-400 bg-pink-50",
      bullets: [
        "Arrives tomorrow with free shipping",
        "23 bought in the last hour",
        "One-tap checkout enabled",
        "Hassle-free 15-day returns",
      ],
    },
    home_upgrader: {
      title: "Complete Your Setup",
      icon: "🏠",
      accent: "border-teal-400 bg-teal-50",
      bullets: [
        "Smart Home compatible — works with Alexa, Google, HomeKit",
        "Professional installation from $79",
        "Bundle with Smart Hub and save $80",
        "Energy Star certified · Available this weekend",
      ],
    },
    gift_shopper: {
      title: "Gift Confidence Score: 94%",
      icon: "🎁",
      accent: "border-orange-400 bg-orange-50",
      bullets: [
        `Only 3% return rate — recipients love it`,
        `Avg recipient rating: ${product.rating.toFixed(1)}★`,
        "Free gift wrapping + personalized message card",
        "Guaranteed delivery within 2 business days",
      ],
    },
    student_budget: {
      title: "Student Smart Buy",
      icon: "🎓",
      accent: "border-cyan-400 bg-cyan-50",
      bullets: [
        `Only $${(product.price / 24).toFixed(0)}/mo for 24 months · 0% APR`,
        "No credit check required with .edu email",
        "Student discount applied automatically",
        "Trade-in your old device for extra savings",
      ],
    },
  };

  const mod = modules[persona];
  if (!mod) return null;

  return (
    <div className={`rounded-xl border ${mod.accent} mt-6 overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-5 py-3 text-left hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{mod.icon}</span>
          <h3 className="font-semibold text-gray-800 text-sm">{mod.title}</h3>
        </div>
        <span className={`text-gray-400 text-xs transition-transform ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <ul className="space-y-2 px-5 pb-4">
          {mod.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="text-gray-400 mt-0.5">›</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { addToCart, cart, cartTotal, cartItemCount, tracker, session } = useApp();
  const personaType = session?.persona_type ?? null;

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

  // Persona-driven configs
  const ctaConfig = personaType ? CTA_CONFIGS[personaType] : null;
  const pricing = personaType ? PRICE_PRESENTATIONS[personaType] : null;
  const badge = personaType ? SOCIAL_PROOF_BADGES[personaType] : null;

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
          <div className="relative">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl flex items-center justify-center h-80 md:h-96 text-9xl select-none border border-gray-200">
              {emoji}
            </div>
            {/* Social proof badge on image */}
            {badge && (
              <div
                className={`absolute top-4 left-4 right-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${badge.gradient} shadow-md backdrop-blur-sm`}
              >
                <span className="text-base">{badge.icon}</span>
                <span className={`text-xs font-bold ${badge.textColor}`}>{badge.text}</span>
              </div>
            )}
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

            {/* ── Dynamic Price (Idea 2) ── */}
            <div className="mb-4">
              {pricing && (
                <div className="mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${pricing.tagBg} ${pricing.tagText}`}
                  >
                    {pricing.tagIcon} {pricing.tag}
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-[#0046BE]">
                  ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                {pricing?.showStrikethrough && (
                  <span className="text-lg text-gray-400 line-through">
                    ${(product.price * pricing.originalPriceMultiplier).toFixed(2)}
                  </span>
                )}
              </div>
              {pricing && (
                <p className="text-sm text-gray-500 mt-1">
                  {pricing.subText(product.price)}
                </p>
              )}
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

            {/* ── Smart CTA (Idea 10) ── */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                  addedToCart
                    ? "bg-green-500 text-white"
                    : ctaConfig
                    ? `${ctaConfig.buttonBg} ${ctaConfig.buttonText} ${ctaConfig.buttonHover}`
                    : "bg-[#FFE000] text-[#0046BE] hover:bg-yellow-300"
                } ${ctaConfig?.pulse && !addedToCart ? "animate-pulse" : ""}`}
              >
                {addedToCart ? (
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Added to Cart!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {ctaConfig ? (
                      <>
                        <span className="text-base">{ctaConfig.icon}</span>
                        {isInCart ? "Add Another" : ctaConfig.label}
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        {isInCart ? "Add Another" : "Add to Cart"}
                      </>
                    )}
                  </span>
                )}
              </button>

              {/* Secondary CTA */}
              {ctaConfig?.secondaryLabel && (
                <button
                  className="w-full md:w-auto px-8 py-3 rounded-xl font-bold text-sm border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="text-base">{ctaConfig.secondaryIcon}</span>
                    {ctaConfig.secondaryLabel}
                  </span>
                </button>
              )}

              {/* CTA micro-copy */}
              {ctaConfig && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <span>✓</span> {ctaConfig.microCopy}
                </p>
              )}
            </div>

            {/* ── Why Buy Module (Idea 7 lite) ── */}
            {personaType && (
              <WhyBuyModule product={product} persona={personaType} />
            )}
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
