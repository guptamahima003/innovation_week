from __future__ import annotations

from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────────────────────────────

class PersonaType(str, Enum):
    TECH_ENTHUSIAST = "tech_enthusiast"
    VALUE_HUNTER = "value_hunter"
    CONSIDERED_RESEARCHER = "considered_researcher"
    LOYALTY_POWER_USER = "loyalty_power_user"
    LAPSING_CUSTOMER = "lapsing_customer"
    BUSINESS_BUYER = "business_buyer"


class AbandonType(str, Enum):
    CART_ABANDON = "cart_abandon"
    CHECKOUT_ABANDON = "checkout_abandon"
    PRODUCT_PAGE_ABANDON = "product_page_abandon"
    SEARCH_ABANDON = "search_abandon"


class AbandonReason(str, Enum):
    PRICE_TOO_HIGH = "price_too_high"
    PAYMENT_FRICTION = "payment_friction"
    CONFIDENCE_GAP = "confidence_gap"
    COULDNT_FIND_IT = "couldnt_find_it"
    DISTRACTION = "distraction"


class InterventionActionType(str, Enum):
    OVERLAY = "overlay"
    PUSH_NOTIFICATION = "push_notification"
    EMAIL_TEMPLATE = "email_template"


class EventType(str, Enum):
    BROWSE = "browse"
    ADD_TO_CART = "add_to_cart"
    REMOVE_FROM_CART = "remove_from_cart"
    SEARCH = "search"
    CHECKOUT_START = "checkout_start"
    CHECKOUT_COMPLETE = "checkout_complete"
    PAGE_LEAVE = "page_leave"
    EXIT_INTENT = "exit_intent"


# ── Product ────────────────────────────────────────────────────────────────────

class Product(BaseModel):
    id: str
    name: str
    category: str
    price: float
    image_url: str
    rating: float
    review_count: int
    description: str
    tags: list[str] = []


# ── Customer Profile ───────────────────────────────────────────────────────────

class Purchase(BaseModel):
    product: str
    price: float
    date: str


class CustomerProfile(BaseModel):
    customer_id: str

    # Identity
    first_name: str
    last_name: str
    email: str
    age: int
    zip_code: str
    city: str
    state: str
    loyalty_tier: str  # none | member | silver | gold | elite
    loyalty_points: int

    # Behavioral
    total_site_visits_90d: int
    avg_session_duration_min: float
    pages_per_session: float
    mobile_pct: float
    days_since_last_visit: int
    product_views_90d: int
    search_queries_90d: int
    cart_additions_90d: int
    cart_abandonment_rate: float
    wishlist_items: int
    email_open_rate: float
    push_notification_opt_in: bool
    app_installed: bool

    # Transactional
    lifetime_order_count: int
    lifetime_spend: float
    avg_order_value: float
    days_since_last_purchase: int
    return_rate: float
    preferred_payment: str
    has_financing: bool
    top_categories: list[str]
    last_3_purchases: list[Purchase]

    # Preference
    preferred_brands: list[str]
    price_sensitivity: float
    tech_affinity: float
    deal_seeking_score: float
    research_depth: float
    brand_loyalty_score: float
    category_preferences: dict[str, float]
    communication_preference: str

    # Contextual
    estimated_household_income: str
    home_ownership: str
    household_size: int
    has_children: bool
    life_stage: str
    propensity_to_churn: float

    # Persona assignment
    persona_type: Optional[str] = None
    persona_confidence: Optional[float] = None


# ── Events ─────────────────────────────────────────────────────────────────────

class UserEvent(BaseModel):
    type: str = "event"
    event_type: str
    session_id: str
    timestamp: str
    data: dict[str, Any] = {}


# ── Abandon Signal ─────────────────────────────────────────────────────────────

class AbandonSignal(BaseModel):
    session_id: str
    abandon_type: AbandonType
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    product_price: Optional[float] = None
    cart_total: Optional[float] = None
    cart_items: Optional[int] = None
    time_on_page: Optional[float] = None
    search_query: Optional[str] = None


# ── Intervention ───────────────────────────────────────────────────────────────

class Intervention(BaseModel):
    id: str
    trigger: AbandonType
    reason: AbandonReason
    persona_type: PersonaType
    action_type: InterventionActionType
    template: str
    parameters: dict[str, Any] = {}


# ── Dashboard ──────────────────────────────────────────────────────────────────

class DashboardEvent(BaseModel):
    id: str
    session_id: str
    persona_type: str
    event_type: str
    reason: str
    product_name: Optional[str] = None
    product_price: Optional[float] = None
    intervention_triggered: bool
    intervention_type: Optional[str] = None
    intervention_template: Optional[str] = None
    timestamp: str


class DashboardStats(BaseModel):
    total_sessions: int = 0
    active_sessions: int = 0
    total_abandons: int = 0
    abandons_by_type: dict[str, int] = {}
    abandons_by_reason: dict[str, int] = {}
    interventions_triggered: int = 0
    interventions_by_type: dict[str, int] = {}
    persona_distribution: dict[str, int] = {}
    revenue_at_risk: float = 0.0
    estimated_revenue_recovered: float = 0.0


class DashboardUpdate(BaseModel):
    type: str = "dashboard_update"
    timestamp: str
    event: Optional[DashboardEvent] = None
    stats: DashboardStats


# ── API responses ──────────────────────────────────────────────────────────────

class SessionResponse(BaseModel):
    session_id: str
    customer_id: str
    persona_type: str
    persona_confidence: float
    first_name: str


class PersonaSummary(BaseModel):
    persona_type: str
    label: str
    description: str
    count: int
    percentage: float
    color: str


# ── Persona metadata ──────────────────────────────────────────────────────────

PERSONA_META = {
    PersonaType.TECH_ENTHUSIAST: {
        "label": "Tech Enthusiast",
        "description": "Early adopter with high tech affinity and above-average order values. Seeks the latest gadgets and innovations.",
        "color": "#6366f1",
    },
    PersonaType.VALUE_HUNTER: {
        "label": "Value Hunter",
        "description": "Price-sensitive shopper who actively seeks deals, compares prices, and has high cart abandonment at full price.",
        "color": "#f59e0b",
    },
    PersonaType.CONSIDERED_RESEARCHER: {
        "label": "Considered Researcher",
        "description": "Deep researcher who reads reviews, compares specs, and takes time before committing. Low impulse purchases.",
        "color": "#10b981",
    },
    PersonaType.LOYALTY_POWER_USER: {
        "label": "Loyalty Power User",
        "description": "High-LTV customer with strong brand loyalty and active rewards membership. Multi-category buyer.",
        "color": "#3b82f6",
    },
    PersonaType.LAPSING_CUSTOMER: {
        "label": "Lapsing Customer",
        "description": "Previously active customer showing declining engagement. High churn risk requiring win-back strategies.",
        "color": "#ef4444",
    },
    PersonaType.BUSINESS_BUYER: {
        "label": "Business Buyer",
        "description": "B2B purchaser buying in bulk with high AOV. Values service SLAs and managed solutions over consumer deals.",
        "color": "#8b5cf6",
    },
}
