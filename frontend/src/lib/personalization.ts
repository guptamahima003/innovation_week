import type { PersonaType } from "./types";

/* ────────────────────────────────────────────────
 *  Persona-driven PLP + PDP personalization config
 *  MINIMAL approach — sparse badges, varied text,
 *  session-based nudges instead of carpet-bombing
 * ──────────────────────────────────────────────── */

// ── Deterministic seeded random for per-product consistency ───────────────────

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

/** Only ~30% of PLP cards get a social proof badge */
export function shouldShowBadge(productId: string): boolean {
  return seededRandom(`badge-${productId}`) < 0.3;
}

/** Only ~40% of PLP cards show the price hint sub-text */
export function shouldShowPriceHint(productId: string): boolean {
  return seededRandom(`price-${productId}`) < 0.4;
}

/** Pick a variant index deterministically per product */
function variantIndex(productId: string, numVariants: number): number {
  return Math.floor(seededRandom(`var-${productId}`) * numVariants);
}

// ── Idea 3: Social Proof Badges (PLP Product Cards) ──────────────────────────

export interface SocialProofBadge {
  text: string;
  icon: string;
  /** Tailwind gradient classes for the badge pill */
  gradient: string;
  textColor: string;
}

/** Multiple badge variants per persona — getBadge picks one (or null) */
const SOCIAL_PROOF_VARIANTS: Record<PersonaType, SocialProofBadge[]> = {
  tech_enthusiast: [
    { text: "Editor's Choice", icon: "🏆", gradient: "from-indigo-100 to-violet-100", textColor: "text-indigo-700" },
    { text: "Top Rated in Tech", icon: "⭐", gradient: "from-indigo-100 to-blue-100", textColor: "text-indigo-700" },
    { text: "Staff Pick", icon: "👍", gradient: "from-violet-100 to-purple-100", textColor: "text-violet-700" },
  ],
  value_hunter: [
    { text: "Best Value", icon: "🔥", gradient: "from-amber-100 to-orange-100", textColor: "text-amber-700" },
    { text: "Price Drop", icon: "📉", gradient: "from-red-100 to-orange-100", textColor: "text-red-700" },
    { text: "Deal of the Day", icon: "💰", gradient: "from-amber-100 to-yellow-100", textColor: "text-amber-700" },
  ],
  considered_researcher: [
    { text: "Expert Verified", icon: "📊", gradient: "from-emerald-100 to-green-100", textColor: "text-emerald-700" },
    { text: "Top Reviewed", icon: "✅", gradient: "from-green-100 to-teal-100", textColor: "text-green-700" },
    { text: "Highest Rated", icon: "🏅", gradient: "from-emerald-100 to-cyan-100", textColor: "text-emerald-700" },
  ],
  loyalty_power_user: [
    { text: "Member Favorite", icon: "❤️", gradient: "from-blue-100 to-sky-100", textColor: "text-blue-700" },
    { text: "2X Points Item", icon: "⭐", gradient: "from-blue-100 to-indigo-100", textColor: "text-blue-700" },
  ],
  lapsing_customer: [
    { text: "Trending Now", icon: "📈", gradient: "from-red-100 to-rose-100", textColor: "text-red-700" },
    { text: "Popular Pick", icon: "🔥", gradient: "from-rose-100 to-pink-100", textColor: "text-rose-700" },
  ],
  business_buyer: [
    { text: "Business Choice", icon: "🏢", gradient: "from-violet-100 to-purple-100", textColor: "text-violet-700" },
    { text: "Bulk Available", icon: "📦", gradient: "from-purple-100 to-indigo-100", textColor: "text-purple-700" },
  ],
  impulse_buyer: [
    { text: "Selling Fast", icon: "⚡", gradient: "from-pink-100 to-rose-100", textColor: "text-pink-700" },
    { text: "Almost Gone", icon: "🔥", gradient: "from-orange-100 to-red-100", textColor: "text-orange-700" },
    { text: "Hot Right Now", icon: "🌟", gradient: "from-pink-100 to-fuchsia-100", textColor: "text-pink-700" },
  ],
  home_upgrader: [
    { text: "Smart Home Ready", icon: "🏠", gradient: "from-teal-100 to-cyan-100", textColor: "text-teal-700" },
    { text: "Easy Install", icon: "🔧", gradient: "from-green-100 to-teal-100", textColor: "text-green-700" },
  ],
  gift_shopper: [
    { text: "#1 Gift Pick", icon: "🎁", gradient: "from-orange-100 to-amber-100", textColor: "text-orange-700" },
    { text: "97% Loved It", icon: "❤️", gradient: "from-rose-100 to-pink-100", textColor: "text-rose-700" },
    { text: "Gift-Worthy", icon: "✨", gradient: "from-amber-100 to-yellow-100", textColor: "text-amber-700" },
  ],
  student_budget: [
    { text: "Student Deal", icon: "🎓", gradient: "from-cyan-100 to-sky-100", textColor: "text-cyan-700" },
    { text: "Budget Friendly", icon: "💡", gradient: "from-sky-100 to-blue-100", textColor: "text-sky-700" },
  ],
};

/**
 * Returns a badge for the given persona & product, or null if this
 * product shouldn't show one (~70% of cards get null).
 */
export function getBadge(
  personaType: PersonaType,
  productId: string
): SocialProofBadge | null {
  if (!shouldShowBadge(productId)) return null;
  const variants = SOCIAL_PROOF_VARIANTS[personaType];
  if (!variants || variants.length === 0) return null;
  return variants[variantIndex(productId, variants.length)];
}

// Keep the flat map for PDP (always shown on detail page)
export const SOCIAL_PROOF_BADGES: Record<PersonaType, SocialProofBadge> = {
  tech_enthusiast: { text: "Editor's Choice", icon: "🏆", gradient: "from-indigo-100 to-violet-100", textColor: "text-indigo-700" },
  value_hunter: { text: "Best Value in Category", icon: "🔥", gradient: "from-amber-100 to-orange-100", textColor: "text-amber-700" },
  considered_researcher: { text: "Top Reviewed · Expert Verified", icon: "📊", gradient: "from-emerald-100 to-green-100", textColor: "text-emerald-700" },
  loyalty_power_user: { text: "Member Favorite", icon: "❤️", gradient: "from-blue-100 to-sky-100", textColor: "text-blue-700" },
  lapsing_customer: { text: "Trending — Popular Right Now", icon: "📈", gradient: "from-red-100 to-rose-100", textColor: "text-red-700" },
  business_buyer: { text: "Chosen by 500+ Businesses", icon: "🏢", gradient: "from-violet-100 to-purple-100", textColor: "text-violet-700" },
  impulse_buyer: { text: "Selling Fast · Limited Stock", icon: "⚡", gradient: "from-pink-100 to-rose-100", textColor: "text-pink-700" },
  home_upgrader: { text: "Smart Home Compatible", icon: "🏠", gradient: "from-teal-100 to-cyan-100", textColor: "text-teal-700" },
  gift_shopper: { text: "#1 Gift Pick · 97% Loved It", icon: "🎁", gradient: "from-orange-100 to-amber-100", textColor: "text-orange-700" },
  student_budget: { text: "Student Favorite · 0% APR", icon: "🎓", gradient: "from-cyan-100 to-sky-100", textColor: "text-cyan-700" },
};

// ── Idea 2: Dynamic Price Presentation (PLP + PDP) ──────────────────────────

export interface PricePresentation {
  /** Extra tag shown next to price */
  tag: string;
  tagIcon: string;
  /** Tailwind classes for the tag pill */
  tagBg: string;
  tagText: string;
  /** Sub-text shown below the price */
  subText: (price: number) => string;
  /** Whether to show a fake "original" strikethrough price */
  showStrikethrough: boolean;
  /** Multiplier to compute the fake original price (e.g. 1.3 = 30% off) */
  originalPriceMultiplier: number;
}

export const PRICE_PRESENTATIONS: Record<PersonaType, PricePresentation> = {
  tech_enthusiast: {
    tag: "Premium Pick",
    tagIcon: "🚀",
    tagBg: "bg-indigo-100",
    tagText: "text-indigo-700",
    subText: () => "Free expedited shipping for early adopters",
    showStrikethrough: false,
    originalPriceMultiplier: 1,
  },
  value_hunter: {
    tag: "30% OFF",
    tagIcon: "💰",
    tagBg: "bg-red-100",
    tagText: "text-red-700",
    subText: (price) =>
      `You save $${(price * 0.3).toFixed(0)} · Price match guaranteed`,
    showStrikethrough: true,
    originalPriceMultiplier: 1.43,
  },
  considered_researcher: {
    tag: "Price Match ✓",
    tagIcon: "📊",
    tagBg: "bg-emerald-100",
    tagText: "text-emerald-700",
    subText: () => "Lowest verified price · Compare confidently",
    showStrikethrough: false,
    originalPriceMultiplier: 1,
  },
  loyalty_power_user: {
    tag: "Member Price",
    tagIcon: "⭐",
    tagBg: "bg-blue-100",
    tagText: "text-blue-700",
    subText: (price) =>
      `Earn ${Math.round(price * 0.04).toLocaleString()} pts ($${(price * 0.04).toFixed(0)} value)`,
    showStrikethrough: true,
    originalPriceMultiplier: 1.1,
  },
  lapsing_customer: {
    tag: "Welcome Back!",
    tagIcon: "👋",
    tagBg: "bg-rose-100",
    tagText: "text-rose-700",
    subText: () => "Extra 5% off today · We missed you!",
    showStrikethrough: false,
    originalPriceMultiplier: 1,
  },
  business_buyer: {
    tag: "Volume Pricing",
    tagIcon: "📦",
    tagBg: "bg-violet-100",
    tagText: "text-violet-700",
    subText: (price) =>
      `$${(price * 0.9).toFixed(2)}/unit for 10+ · Net 30 terms`,
    showStrikethrough: false,
    originalPriceMultiplier: 1,
  },
  impulse_buyer: {
    tag: "Flash Price",
    tagIcon: "⚡",
    tagBg: "bg-pink-100",
    tagText: "text-pink-700",
    subText: () => "Ends in 3 hrs · 23 bought in the last hour",
    showStrikethrough: false,
    originalPriceMultiplier: 1,
  },
  home_upgrader: {
    tag: "Bundle & Save",
    tagIcon: "🏠",
    tagBg: "bg-teal-100",
    tagText: "text-teal-700",
    subText: () => "Bundle with Smart Hub & save $80",
    showStrikethrough: false,
    originalPriceMultiplier: 1,
  },
  gift_shopper: {
    tag: "Gift Ready 🎁",
    tagIcon: "🎁",
    tagBg: "bg-orange-100",
    tagText: "text-orange-700",
    subText: () => "Free gift wrap + message card included",
    showStrikethrough: false,
    originalPriceMultiplier: 1,
  },
  student_budget: {
    tag: "Student Deal",
    tagIcon: "🎓",
    tagBg: "bg-cyan-100",
    tagText: "text-cyan-700",
    subText: (price) =>
      `Or $${(price / 24).toFixed(0)}/mo × 24 · 0% APR · No credit check`,
    showStrikethrough: true,
    originalPriceMultiplier: 1.15,
  },
};

// ── Idea 10: Smart CTA Buttons (PDP) ────────────────────────────────────────

export interface CTAConfig {
  /** Primary button label */
  label: string;
  /** Icon name (emoji for simplicity) */
  icon: string;
  /** Supporting micro-copy under the CTA */
  microCopy: string;
  /** Tailwind classes for the button */
  buttonBg: string;
  buttonText: string;
  buttonHover: string;
  /** Optional secondary CTA */
  secondaryLabel?: string;
  secondaryIcon?: string;
  /** Whether CTA should have pulse animation */
  pulse?: boolean;
}

export const CTA_CONFIGS: Record<PersonaType, CTAConfig> = {
  tech_enthusiast: {
    label: "Pre-Order Now",
    icon: "🚀",
    microCopy: "Free expedited shipping for early adopters",
    buttonBg: "bg-indigo-600",
    buttonText: "text-white",
    buttonHover: "hover:bg-indigo-700",
    secondaryLabel: "Compare Specs",
    secondaryIcon: "📊",
  },
  value_hunter: {
    label: "Grab This Deal",
    icon: "💰",
    microCopy: "Price locked for 2 hours · Price match guarantee",
    buttonBg: "bg-[#FFE000]",
    buttonText: "text-[#0046BE]",
    buttonHover: "hover:bg-yellow-300",
  },
  considered_researcher: {
    label: "Add to Cart",
    icon: "🛒",
    microCopy: "No rush — your cart is saved for 30 days",
    buttonBg: "bg-emerald-600",
    buttonText: "text-white",
    buttonHover: "hover:bg-emerald-700",
    secondaryLabel: "Add to Compare",
    secondaryIcon: "📋",
  },
  loyalty_power_user: {
    label: "Buy with Points",
    icon: "⭐",
    microCopy: "Earn 2X points · Free shipping as always",
    buttonBg: "bg-blue-600",
    buttonText: "text-white",
    buttonHover: "hover:bg-blue-700",
  },
  lapsing_customer: {
    label: "Welcome Back — Buy Now",
    icon: "👋",
    microCopy: "Exclusive 10% off · Offer expires tonight",
    buttonBg: "bg-rose-600",
    buttonText: "text-white",
    buttonHover: "hover:bg-rose-700",
  },
  business_buyer: {
    label: "Add to Quote",
    icon: "📋",
    microCopy: "Volume pricing available · Net 30 terms · Talk to rep",
    buttonBg: "bg-violet-600",
    buttonText: "text-white",
    buttonHover: "hover:bg-violet-700",
    secondaryLabel: "Buy Now",
    secondaryIcon: "🛒",
  },
  impulse_buyer: {
    label: "Buy Now — Arrives Tomorrow",
    icon: "⚡",
    microCopy: "One-tap checkout · 23 bought in last hour",
    buttonBg: "bg-gradient-to-r from-orange-500 to-pink-500",
    buttonText: "text-white",
    buttonHover: "hover:from-orange-600 hover:to-pink-600",
    pulse: false, // toned down — no more pulsing button
  },
  home_upgrader: {
    label: "Add to Cart",
    icon: "🛒",
    microCopy: "Professional install from $79 · Available this weekend",
    buttonBg: "bg-teal-600",
    buttonText: "text-white",
    buttonHover: "hover:bg-teal-700",
    secondaryLabel: "Book Installation",
    secondaryIcon: "🔧",
  },
  gift_shopper: {
    label: "Add to Gift Cart",
    icon: "🎁",
    microCopy: "Free gift wrap + message card · Arrives in 2 days",
    buttonBg: "bg-orange-500",
    buttonText: "text-white",
    buttonHover: "hover:bg-orange-600",
  },
  student_budget: {
    label: "Buy · Pay Monthly",
    icon: "🎓",
    microCopy: "0% APR · No credit check · Student verified",
    buttonBg: "bg-cyan-600",
    buttonText: "text-white",
    buttonHover: "hover:bg-cyan-700",
  },
};

// ── Session Nudges (shown once per session as toast) ─────────────────────────

export interface SessionNudge {
  message: string;
  icon: string;
  /** Tailwind bg color */
  bg: string;
  textColor: string;
}

export const SESSION_NUDGES: Record<PersonaType, SessionNudge> = {
  tech_enthusiast: {
    message: "New arrivals just dropped — check out the latest tech",
    icon: "🚀",
    bg: "bg-indigo-600",
    textColor: "text-white",
  },
  value_hunter: {
    message: "Flash deals ending soon — up to 30% off select items",
    icon: "💰",
    bg: "bg-amber-500",
    textColor: "text-white",
  },
  considered_researcher: {
    message: "Compare up to 4 products side-by-side in your cart",
    icon: "📊",
    bg: "bg-emerald-600",
    textColor: "text-white",
  },
  loyalty_power_user: {
    message: "You have 2X points on all purchases today",
    icon: "⭐",
    bg: "bg-blue-600",
    textColor: "text-white",
  },
  lapsing_customer: {
    message: "Welcome back! Here's 5% off your next order",
    icon: "👋",
    bg: "bg-rose-500",
    textColor: "text-white",
  },
  business_buyer: {
    message: "Volume discounts available — save up to 15% on bulk orders",
    icon: "📦",
    bg: "bg-violet-600",
    textColor: "text-white",
  },
  impulse_buyer: {
    message: "Free next-day delivery on orders over $50",
    icon: "⚡",
    bg: "bg-pink-500",
    textColor: "text-white",
  },
  home_upgrader: {
    message: "Free smart home setup guide with any connected device",
    icon: "🏠",
    bg: "bg-teal-600",
    textColor: "text-white",
  },
  gift_shopper: {
    message: "Free gift wrapping on all orders this week",
    icon: "🎁",
    bg: "bg-orange-500",
    textColor: "text-white",
  },
  student_budget: {
    message: "Student? Get 0% APR financing — no credit check",
    icon: "🎓",
    bg: "bg-cyan-600",
    textColor: "text-white",
  },
};
