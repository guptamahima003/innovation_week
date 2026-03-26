"use client";

import React, { useState } from "react";
import Link from "next/link";

/* ─── Section definitions ────────────────────────────────────────────────── */

const SECTIONS = [
  {
    id: "overview",
    title: "System Overview",
    icon: "🏗️",
    content: `The 360° User Persona Engine is a real-time, ML-powered personalization and abandonment intelligence system built for Best Buy's e-commerce storefront.

It ingests customer behavioral data, clusters users into 10 distinct personas using K-Means (k=10, 14-feature vectors), then personalizes the shopping experience — from product listing badges to checkout CTAs — based on who the customer is.

When a user is about to abandon, the system detects it in real-time, classifies the reason using a persona×abandon-type matrix, and triggers one of 50 unique intervention templates.`,
  },
  {
    id: "architecture",
    title: "Architecture",
    icon: "📐",
    content: `┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│  1st-Party Transactional  │  Behavioral Events  │  Context  │
└────────────────┬──────────┴──────────┬──────────┴───────────┘
                 │                     │
                 ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   ML PERSONA ENGINE                         │
│  StandardScaler → K-Means (k=10) → Cluster-Persona Map     │
│  Output: persona_type + confidence (softmax distance)       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              REAL-TIME EVENT PIPELINE                        │
│  Browser → WebSocket → Abandon Detector → Reason Classifier │
│                                        → Intervention Engine │
│                         ┌──────────────┴──────────────┐     │
│                 Storefront Overlay          Dashboard Update │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND: Storefront (PLP/PDP/Cart) │ Dashboard (Analytics)│
│            Sparse Personalization     │ Per-Persona Metrics  │
│            Session Nudges             │ Live Event Feed      │
│            Intervention Overlays      │ Intervention Log     │
└─────────────────────────────────────────────────────────────┘`,
  },
  {
    id: "ml-pipeline",
    title: "ML Pipeline",
    icon: "🤖",
    content: `STAGE 1 — Training (server startup):
• 10,000 synthetic customer profiles loaded
• StandardScaler normalizes 14 features to zero mean, unit variance
• K-Means clusters into 10 groups in 14-dimensional space
• Cluster centroids mapped to named personas via scoring rules
• Silhouette score computed for quality assessment

STAGE 2 — Prediction (per API call):
• Extract 14 features → scale → K-Means nearest centroid
• Confidence = softmax(1/distance) across all clusters
• Profile stored with persona_type + persona_confidence

THE 14 FEATURES:
┌───────────────────────────┬──────────┬──────────────────────────────────┐
│ Feature                   │ Range    │ Description                      │
├───────────────────────────┼──────────┼──────────────────────────────────┤
│ tech_affinity             │ 0.0–1.0  │ Affinity for tech products       │
│ price_sensitivity         │ 0.0–1.0  │ Sensitivity to price changes     │
│ deal_seeking_score        │ 0.0–1.0  │ Active deal/coupon seeking       │
│ research_depth            │ 0.0–1.0  │ Research before buying           │
│ brand_loyalty_score       │ 0.0–1.0  │ Brand stickiness                 │
│ avg_order_value           │ $30–2000 │ Average dollar value per order   │
│ lifetime_spend            │ $200–35K │ Total historical spend           │
│ total_site_visits_90d     │ 0–80     │ Site visits in last 90 days      │
│ avg_session_duration_min  │ 1–35 min │ Average time per visit           │
│ cart_abandonment_rate     │ 0.0–1.0  │ Fraction of carts not completed  │
│ propensity_to_churn       │ 0.0–1.0  │ Likelihood of becoming inactive  │
│ days_since_last_visit     │ 0–180    │ Recency of last visit            │
│ lifetime_order_count      │ 1–100+   │ Total orders placed              │
│ return_rate               │ 0.0–0.35 │ Fraction of orders returned      │
└───────────────────────────┴──────────┴──────────────────────────────────┘`,
  },
  {
    id: "personas",
    title: "10 Personas",
    icon: "👥",
    content: `Each persona has a distinct behavioral fingerprint:

🚀 Tech Enthusiast (#6366f1)
   Early adopter, high tech affinity, premium buyer.
   Rule: max(tech_affinity − price_sensitivity)

💰 Value Hunter (#f59e0b)
   Price-sensitive, deal seeker, high cart abandonment at full price.
   Rule: max(price_sensitivity + deal_seeking + cart_abandon)

📊 Considered Researcher (#10b981)
   Deep researcher, long sessions, reads reviews, low impulse.
   Rule: max(research_depth + session_duration/30)

⭐ Loyalty Power User (#3b82f6)
   High LTV, strong brand loyalty, active rewards member.
   Rule: max(brand_loyalty + lifetime_spend/20K − churn)

📉 Lapsing Customer (#ef4444)
   Declining engagement, high churn risk, needs win-back.
   Rule: max(churn + days_since_visit/100 − visits/50)

🏢 Business Buyer (#8b5cf6)
   B2B bulk purchaser, high AOV, values SLAs over deals.
   Rule: max(AOV/1K + lifetime_spend/20K − deal_seeking)

⚡ Impulse Buyer (#ec4899)
   Fast decisions, low research, responds to urgency/scarcity.
   Rule: max(−research_depth − session_duration/30 + cart_abandon)

🏠 Home Upgrader (#14b8a6)
   Appliances & smart home, family-oriented, seasonal buyer.
   Rule: max(AOV/1K + 0.5×tech_affinity − deal_seeking)

🎁 Gift Shopper (#f97316)
   Seasonal buyer, browses outside usual categories, values gift-ready.
   Rule: max(research×0.5 + price_sens×0.3 + brand_loyalty×0.2)

🎓 Student Budget (#06b6d4)
   Price-sensitive, education & entertainment focused, financing-inclined.
   Rule: max(price_sensitivity − lifetime_spend/20K − AOV/1K)`,
  },
  {
    id: "abandon-detection",
    title: "Abandon Detection",
    icon: "🚨",
    content: `DETECTION RULES (AbandonDetector):
• page_leave from /cart with items → CART_ABANDON
• page_leave from /checkout without completion → CHECKOUT_ABANDON
• page_leave from /product with >10s dwell + no add_to_cart → PRODUCT_PAGE_ABANDON
• exit_intent (mouse leaves viewport) with cart items → CART/CHECKOUT_ABANDON
• search with results > 0 but no click → SEARCH_ABANDON

CLASSIFICATION MATRIX (10 personas × 4 abandon types → reason):

                    Cart Abandon    Checkout     Product Page   Search
Tech Enthusiast     Confidence      Payment      Confidence     Can't Find
Value Hunter        Price           Payment      Price          Can't Find
Researcher          Confidence      Payment      Confidence     Can't Find
Loyalty Power       Distraction     Payment      Distraction    Can't Find
Lapsing             Distraction     Price         Distraction    Can't Find
Business            Price           Payment      Confidence     Can't Find
Impulse             Distraction     Payment      Distraction    Can't Find
Home Upgrader       Price           Payment      Confidence     Can't Find
Gift Shopper        Confidence      Payment      Confidence     Can't Find
Student             Price           Payment      Price          Can't Find

CONTEXTUAL OVERRIDES (applied before matrix lookup):
• price_sensitivity > 0.7 AND cart_total > 1.5× AOV → PRICE_TOO_HIGH
• research_depth > 0.7 AND dwell > 20s → CONFIDENCE_GAP
• deal_seeking > 0.7 AND cart abandon → PRICE_TOO_HIGH`,
  },
  {
    id: "interventions",
    title: "Intervention Engine",
    icon: "💬",
    content: `50 UNIQUE INTERVENTION TEMPLATES (5 reasons × 10 personas)

INTERVENTION TYPES:
• Overlay — in-page slide-up card (15% recovery rate)
• Push Notification — background alert (8% recovery rate)
• Email Template — follow-up email (6% recovery rate)

PRICE_TOO_HIGH interventions:
  Tech Enthusiast → Member pricing 5%
  Value Hunter → Price drop 10%
  Loyalty Power → VIP price 8%
  Lapsing → Winback 15% (email)
  Business → Bulk pricing 20%
  Impulse → Flash sale 12%
  Home Upgrader → Bundle savings 15%
  Student → Student discount 15%

PAYMENT_FRICTION interventions:
  Tech Enthusiast → Instant CC approval
  Value Hunter → BNPL 4 payments
  Researcher → Financing explainer
  Loyalty → Express checkout
  Business → Net 30 terms
  Impulse → One-tap checkout
  Student → Student BNPL

CONFIDENCE_GAP interventions:
  Tech Enthusiast → Popular among tech enthusiasts
  Researcher → Expert comparison guide
  Loyalty → Satisfaction guarantee
  Business → Free consultation
  Impulse → Trending now (47 bought last hour)

Each template includes: headline, body (with {product_name} placeholder),
CTA text, urgency level, and auto-dismiss duration (10-25 seconds).`,
  },
  {
    id: "personalization",
    title: "Storefront Personalization",
    icon: "🎨",
    content: `SPARSE APPROACH — not every product gets the same treatment:

A. PLP (Product Listing) — Sparse Badges:
   • seededRandom(productId) for deterministic per-product consistency
   • ~30% of cards get a social proof badge
   • ~40% of cards get a price hint sub-text
   • 2-4 badge VARIANTS per persona (not just one)
   Examples:
     tech_enthusiast: "Editor's Choice", "Top Rated in Tech", "Staff Pick"
     value_hunter: "Best Value", "Price Drop", "Deal of the Day"
     impulse_buyer: "Selling Fast", "Almost Gone", "Hot Right Now"

B. PDP (Product Detail) — Full Personalization:
   • Social proof badge on product image
   • Dynamic price tag + sub-text per persona
   • Persona-specific CTA button (label, color, micro-copy):
     tech_enthusiast → "Pre-Order Now" (indigo)
     value_hunter → "Grab This Deal" (BB yellow)
     researcher → "Add to Cart" (emerald)
     impulse → "Buy Now — Arrives Tomorrow" (gradient)
     student → "Buy · Pay Monthly" (cyan)

C. Session Nudges — Toast-style, shown ONCE per session:
   • tech_enthusiast: "New arrivals just dropped"
   • value_hunter: "Flash deals ending soon — up to 30% off"
   • loyalty: "You have 2X points on all purchases today"
   • lapsing: "Welcome back! Here's 5% off"

D. Intervention Overlays:
   • Triggered by backend via WebSocket on abandon detection
   • Slide-up card with persona-specific messaging
   • Auto-dismiss after configurable duration`,
  },
  {
    id: "dashboard",
    title: "Analytics Dashboard",
    icon: "📊",
    content: `REAL-TIME DASHBOARD (/dashboard)

DATA SOURCES:
  • Primary: WebSocket /ws/dashboard (real-time push)
  • Fallback: REST GET /api/stats (polled every 5s)
  • Per-persona: REST GET /api/personas/all/stats (polled every 10s)

LAYOUT:
  ┌──────────────────────────────────────────────────────────┐
  │ 8 KPI CARDS                                              │
  │ Sessions │ Customers │ Abandons │ Revenue Recovered       │
  │ Interventions │ Revenue Risk │ Recovery Rate │ Active     │
  ├──────────────┬───────────────────────────────────────────┤
  │ PERSONA      │ DETAIL VIEW (per-persona) or              │
  │ SELECTOR     │ AGGREGATE VIEW (all personas)             │
  │ (10 personas)│ • Mini-stat cards                         │
  │              │ • Abandon reasons bar chart                │
  │              │ • Intervention types pie chart             │
  │              │ • Top 5 abandoned products                 │
  │              │ • Key metrics with progress bars           │
  ├──────────────┴─────────────────┬─────────────────────────┤
  │ ABANDON EVENT FEED             │ INTERVENTION LOG         │
  │ (real-time, filtered)          │ (recent, filtered)       │
  └────────────────────────────────┴─────────────────────────┘

PER-PERSONA METRICS:
  • sessions, abandons, abandon_rate
  • abandons_by_type, abandons_by_reason
  • interventions, interventions_by_type
  • revenue_at_risk, revenue_recovered
  • intervention_success_rate, avg_cart_value, conversion_rate
  • top_abandoned_products (top 5)`,
  },
  {
    id: "demo-simulator",
    title: "Demo Simulator",
    icon: "🎮",
    content: `The DemoSimulator runs at server startup to pre-populate the dashboard.

CONFIG:
  • DEMO_SIMULATOR_ENABLED: true
  • DEMO_SIMULATOR_SESSIONS: 200

SESSION DISTRIBUTION (weights):
  value_hunter: 15% │ tech_enthusiast: 13% │ impulse_buyer: 13%
  considered_researcher: 10% │ home_upgrader: 10% │ gift_shopper: 10%
  loyalty_power_user: 8% │ lapsing_customer: 8% │ student_budget: 8%
  business_buyer: 5%

ABANDON RATES PER PERSONA:
  value_hunter: 70%  │ student_budget: 65% │ lapsing: 60%
  researcher: 55%    │ home_upgrader: 50%  │ business: 45%
  gift_shopper: 45%  │ impulse: 40%        │ tech: 35%
  loyalty: 25%

CONVERSION RATES PER PERSONA:
  loyalty: 45% │ impulse: 35% │ tech: 30% │ business: 25%
  gift: 22%    │ home: 20%    │ researcher: 18%
  value: 12%   │ student: 10% │ lapsing: 8%

Each simulated session uses the REAL classifier and intervention engine,
producing realistic metrics.

TYPICAL OUTPUT: ~200 sessions, ~95 abandons, ~$143K at risk, ~$19.7K recovered`,
  },
  {
    id: "api",
    title: "API Reference",
    icon: "🔌",
    content: `BASE URL: /api

─── Health & Products ─────────────────────────────────────
GET  /api/health                       Health check
GET  /api/products?category={cat}      Product list (filterable)
GET  /api/products/{product_id}        Single product

─── Sessions ──────────────────────────────────────────────
POST /api/session?force_persona={type} Create session
GET  /api/session/{session_id}         Get session + profile

─── Customer & ML Prediction ──────────────────────────────
POST /api/customer                     Register + assign persona
POST /api/customer/predict-persona     Lightweight predict (no persist)

─── Persona Analytics ─────────────────────────────────────
GET  /api/personas                     All 10 with counts
GET  /api/personas/{type}              Single persona metadata
GET  /api/personas/all/stats           Detailed stats for all 10
GET  /api/personas/{type}/stats        Detailed stats for one

─── Dashboard ─────────────────────────────────────────────
GET  /api/stats                        Dashboard snapshot

─── WebSocket ─────────────────────────────────────────────
WS   /ws/storefront/{session_id}       Events + interventions
WS   /ws/dashboard                     Real-time dashboard updates

─── Swagger UI ────────────────────────────────────────────
The backend auto-generates interactive API docs at /docs (FastAPI Swagger UI).`,
  },
  {
    id: "tech-stack",
    title: "Tech Stack",
    icon: "🛠️",
    content: `BACKEND (Python 3.11):
  • FastAPI 0.115 — async REST + WebSocket framework
  • Uvicorn — ASGI server
  • scikit-learn 1.6 — K-Means clustering + StandardScaler
  • NumPy + Pandas — data processing
  • Pydantic v2 — data validation + settings management
  • Faker — synthetic data generation

FRONTEND (Node 20):
  • Next.js 14 — React framework (App Router)
  • TypeScript — type-safe frontend
  • Tailwind CSS 3.4 — utility-first styling
  • Recharts 3.8 — dashboard charts (pie, bar)
  • Framer Motion — animations
  • Lucide React — icon library

COMMUNICATION:
  • REST API (HTTPS) — CRUD + analytics endpoints
  • WebSocket (WSS) — real-time events + interventions + dashboard

DEPLOYMENT:
  • Render.com — Blueprint deploys both services (render.yaml)
  • Vercel — alternative for frontend
  • Standalone Next.js output for Docker/serverless`,
  },
  {
    id: "file-structure",
    title: "File Structure",
    icon: "📁",
    content: `backend/
  main.py                       FastAPI app, lifespan, CORS
  config.py                     Settings (Pydantic BaseSettings)
  requirements.txt              Python dependencies
  models/
    persona_engine.py           K-Means clustering & prediction
    schemas.py                  Pydantic models, enums, metadata
  routers/
    api.py                      REST endpoints (/api/*)
    ws.py                       WebSocket endpoints (/ws/*)
  services/
    abandon_detector.py         Rule-based abandon detection
    reason_classifier.py        (abandon_type × persona) → reason
    intervention_engine.py      (reason × persona) → intervention
    metrics_tracker.py          Global + per-persona metrics
    profile_store.py            In-memory customer profiles
    demo_simulator.py           Startup session simulator
  data/
    products.json               Product catalog
    generate_synthetic.py       Profile generator
    generated/customers.json    10K generated profiles

frontend/
  next.config.mjs               Next.js config (standalone)
  tailwind.config.ts            Tailwind CSS config
  src/
    app/
      page.tsx                  Product Listing (PLP)
      product/[id]/page.tsx     Product Detail (PDP)
      cart/page.tsx             Cart
      checkout/page.tsx         Checkout
      dashboard/page.tsx        Analytics Dashboard
      docs/page.tsx             Documentation (this page)
    components/
      storefront/               NavBar, ProductGrid, ProductCard,
                                SearchBar, InterventionOverlay,
                                SessionNudge
      dashboard/                OverallsSection, PersonaSelector,
                                PersonaDetailView, AggregateChartsView,
                                Charts, EventFeed, InterventionLog
    hooks/                      useDashboardData, usePersonaStats,
                                useWebSocket, useEventTracker
    lib/
      AppContext.tsx             Global state (session, cart, WS)
      personalization.ts        Sparse badge/price/CTA configs
      types.ts                  TypeScript interfaces
      api.ts, constants.ts      API client + URLs`,
  },
];

/* ─── Component ──────────────────────────────────────────────────────── */

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const active = SECTIONS.find((s) => s.id === activeSection) ?? SECTIONS[0];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="w-10 h-10 bg-[#0046BE] rounded-lg flex items-center justify-center font-bold text-[#FFE000] text-lg cursor-pointer hover:scale-105 transition-transform">
                BB
              </div>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">
                360° Persona Engine
                <span className="text-blue-400 ml-2 font-normal text-base">
                  Documentation
                </span>
              </h1>
              <p className="text-xs text-gray-400">
                Architecture, ML pipeline, personas, APIs, and more
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Storefront
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto flex">
        {/* Sidebar */}
        <nav className="w-64 min-h-[calc(100vh-73px)] border-r border-slate-700 p-4 sticky top-[73px] self-start overflow-y-auto">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Sections
          </p>
          <ul className="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2.5 transition-colors ${
                    activeSection === section.id
                      ? "bg-blue-600/20 text-blue-400 font-medium"
                      : "text-gray-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span className="text-base">{section.icon}</span>
                  {section.title}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-4 border-t border-slate-700">
            <p className="text-xs text-gray-500 mb-2">Quick Links</p>
            <div className="space-y-1">
              <Link
                href="/"
                className="block px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded transition-colors"
              >
                🛒 Storefront
              </Link>
              <Link
                href="/dashboard"
                className="block px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded transition-colors"
              >
                📊 Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-8 max-w-4xl">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{active.icon}</span>
              <h2 className="text-2xl font-bold text-white">{active.title}</h2>
            </div>
            <div className="h-0.5 bg-gradient-to-r from-blue-500 to-transparent rounded-full" />
          </div>

          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-300 leading-relaxed bg-slate-800/50 rounded-xl p-6 border border-slate-700">
            {active.content}
          </pre>

          {/* Prev / Next navigation */}
          <div className="flex justify-between mt-8">
            {SECTIONS.indexOf(active) > 0 ? (
              <button
                onClick={() =>
                  setActiveSection(
                    SECTIONS[SECTIONS.indexOf(active) - 1].id
                  )
                }
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>←</span>
                {SECTIONS[SECTIONS.indexOf(active) - 1].title}
              </button>
            ) : (
              <div />
            )}
            {SECTIONS.indexOf(active) < SECTIONS.length - 1 ? (
              <button
                onClick={() =>
                  setActiveSection(
                    SECTIONS[SECTIONS.indexOf(active) + 1].id
                  )
                }
                className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
              >
                {SECTIONS[SECTIONS.indexOf(active) + 1].title}
                <span>→</span>
              </button>
            ) : (
              <div />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
