export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
  rating: number;
  review_count: number;
  description: string;
  tags: string[];
}

export type PersonaType =
  | "tech_enthusiast"
  | "value_hunter"
  | "considered_researcher"
  | "loyalty_power_user"
  | "lapsing_customer"
  | "business_buyer"
  | "impulse_buyer"
  | "home_upgrader"
  | "gift_shopper"
  | "student_budget";

export interface SessionInfo {
  session_id: string;
  customer_id: string;
  persona_type: PersonaType;
  persona_confidence: number;
  first_name: string;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string;
  category: string;
}

export interface Intervention {
  id: string;
  trigger: string;
  reason: string;
  persona_type: string;
  action_type: string;
  template: string;
  parameters: {
    headline: string;
    body: string;
    cta_text: string;
    discount_pct?: number;
    urgency?: string;
    display_duration_seconds?: number;
    product_id?: string;
    product_name?: string;
    product_price?: number;
    cart_total?: number;
    [key: string]: unknown;
  };
}

export interface InterventionMessage {
  type: "intervention";
  session_id: string;
  timestamp: string;
  intervention: Intervention;
}

export interface DashboardEvent {
  id: string;
  session_id: string;
  persona_type: string;
  event_type: string;
  reason: string;
  product_name?: string;
  product_price?: number;
  intervention_triggered: boolean;
  intervention_type?: string;
  intervention_template?: string;
  timestamp: string;
}

export interface DashboardStats {
  total_sessions: number;
  active_sessions: number;
  unique_customers: number;
  total_abandons: number;
  abandons_by_type: Record<string, number>;
  abandons_by_reason: Record<string, number>;
  interventions_triggered: number;
  interventions_by_type: Record<string, number>;
  persona_distribution: Record<string, number>;
  revenue_at_risk: number;
  estimated_revenue_recovered: number;
}

export interface DashboardUpdate {
  type: "dashboard_update";
  timestamp: string;
  event?: DashboardEvent | null;
  stats: DashboardStats;
}

export interface PersonaSummary {
  persona_type: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PersonaDetailStats {
  persona_type: string;
  label: string;
  color: string;
  description: string;
  sessions: number;
  abandons: number;
  abandon_rate: number;
  abandons_by_type: Record<string, number>;
  abandons_by_reason: Record<string, number>;
  interventions: number;
  interventions_by_type: Record<string, number>;
  revenue_at_risk: number;
  revenue_recovered: number;
  intervention_success_rate: number;
  avg_cart_value: number;
  conversion_rate: number;
  top_abandoned_products: { name: string; count: number }[];
}
