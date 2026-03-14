export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const PERSONA_COLORS: Record<string, string> = {
  tech_enthusiast: "#6366f1",
  value_hunter: "#f59e0b",
  considered_researcher: "#10b981",
  loyalty_power_user: "#3b82f6",
  lapsing_customer: "#ef4444",
  business_buyer: "#8b5cf6",
};

export const PERSONA_LABELS: Record<string, string> = {
  tech_enthusiast: "Tech Enthusiast",
  value_hunter: "Value Hunter",
  considered_researcher: "Considered Researcher",
  loyalty_power_user: "Loyalty Power User",
  lapsing_customer: "Lapsing Customer",
  business_buyer: "Business Buyer",
};

export const PERSONA_ICONS: Record<string, string> = {
  tech_enthusiast: "🚀",
  value_hunter: "🏷️",
  considered_researcher: "🔬",
  loyalty_power_user: "⭐",
  lapsing_customer: "💤",
  business_buyer: "💼",
};

export const ABANDON_TYPE_LABELS: Record<string, string> = {
  cart_abandon: "Cart Abandon",
  checkout_abandon: "Checkout Abandon",
  product_page_abandon: "Product Page Abandon",
  search_abandon: "Search Abandon",
};

export const REASON_LABELS: Record<string, string> = {
  price_too_high: "Price Too High",
  payment_friction: "Payment Friction",
  confidence_gap: "Confidence Gap",
  couldnt_find_it: "Couldn't Find It",
  distraction: "Distraction",
};

export const CATEGORY_LABELS: Record<string, string> = {
  tv_video: "TV & Video",
  computing: "Computers & Tablets",
  audio: "Audio",
  phones: "Phones",
  smart_home: "Smart Home",
  appliances: "Appliances",
  gaming: "Gaming",
  cameras: "Cameras",
  wearables: "Wearables",
  networking: "Networking",
  accessories: "Accessories",
  wellness: "Wellness",
};

export const CATEGORY_IMAGES: Record<string, string> = {
  tv_video: "📺",
  computing: "💻",
  audio: "🎧",
  phones: "📱",
  smart_home: "🏠",
  appliances: "🏪",
  gaming: "🎮",
  cameras: "📷",
  wearables: "⌚",
  networking: "📡",
  accessories: "🔌",
  wellness: "💆",
};
