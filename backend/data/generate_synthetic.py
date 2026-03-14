"""Generate 10K synthetic Best Buy customer profiles with natural persona clusters."""

import json
import os
import random
from pathlib import Path

import numpy as np
from faker import Faker

fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

NUM_CUSTOMERS = int(os.environ.get("NUM_CUSTOMERS", "10000"))

CATEGORIES = ["computing", "audio", "smart_home", "tv_video", "appliances", "gaming", "phones", "cameras", "wearables", "networking"]
BRANDS = ["Apple", "Samsung", "Sony", "Google", "LG", "Dell", "HP", "Lenovo", "Bose", "Microsoft", "Dyson", "Canon", "Razer", "JBL", "Philips"]
LOYALTY_TIERS = ["none", "member", "silver", "gold", "elite"]
PAYMENTS = ["credit_card", "debit", "paypal", "financing", "gift_card"]
LIFE_STAGES = ["student", "young_professional", "young_family", "established_family", "empty_nester", "retired"]
INCOME_BANDS = ["under_25k", "25k-50k", "50k-75k", "75k-100k", "100k-150k", "150k-200k", "200k_plus"]
COMM_PREFS = ["email", "sms", "push", "none"]
STATES = ["CA", "TX", "NY", "FL", "WA", "IL", "PA", "OH", "GA", "NC", "MI", "NJ", "VA", "AZ", "MA", "CO", "TN", "IN", "MO", "MD"]

SAMPLE_PRODUCTS = [
    ("MacBook Pro 14\"", 1999.99), ("AirPods Pro", 249.99), ("Samsung 65\" OLED", 1299.99),
    ("Sony WH-1000XM5", 349.99), ("iPad Pro 12.9\"", 1099.99), ("PS5 Console", 499.99),
    ("Dyson V15 Vacuum", 749.99), ("iPhone 15 Pro", 1199.99), ("Galaxy S24 Ultra", 1299.99),
    ("Nintendo Switch OLED", 349.99), ("Nest Thermostat", 249.99), ("Ring Doorbell Pro", 249.99),
    ("Canon EOS R6", 2499.99), ("LG C3 OLED TV", 1099.99), ("KitchenAid Mixer", 449.99),
    ("Bose QC Ultra", 299.99), ("Dell XPS 15", 1499.99), ("Apple Watch Ultra", 799.99),
    ("GoPro HERO12", 399.99), ("JBL Charge 5", 179.99),
]


def _clamp(val: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, val))


def _gen_persona_profile(persona: str) -> dict:
    """Generate a profile with biased distributions for a target persona."""

    if persona == "tech_enthusiast":
        tech_affinity = _clamp(np.random.normal(0.85, 0.08), 0.65, 1.0)
        price_sensitivity = _clamp(np.random.normal(0.2, 0.1), 0.05, 0.45)
        deal_seeking = _clamp(np.random.normal(0.2, 0.1), 0.05, 0.5)
        research_depth = _clamp(np.random.normal(0.5, 0.15), 0.2, 0.8)
        brand_loyalty = _clamp(np.random.normal(0.6, 0.15), 0.3, 0.9)
        avg_order_value = _clamp(np.random.normal(450, 120), 200, 900)
        lifetime_spend = _clamp(np.random.normal(8000, 3000), 2000, 20000)
        visits_90d = int(_clamp(np.random.normal(40, 15), 10, 80))
        session_dur = _clamp(np.random.normal(10, 4), 3, 25)
        cart_abandon_rate = _clamp(np.random.normal(0.25, 0.1), 0.05, 0.5)
        churn = _clamp(np.random.normal(0.15, 0.08), 0.02, 0.35)
        top_cats = random.sample(["computing", "audio", "phones", "gaming", "cameras", "wearables"], 3)
        preferred_brands = random.sample(["Apple", "Sony", "Samsung", "Google", "Razer"], 3)
        loyalty_tier = random.choices(["silver", "gold", "elite"], weights=[0.3, 0.4, 0.3])[0]
        life_stage = random.choice(["young_professional", "student", "young_family"])
        income = random.choices(["75k-100k", "100k-150k", "150k-200k", "200k_plus"], weights=[0.2, 0.35, 0.3, 0.15])[0]

    elif persona == "value_hunter":
        tech_affinity = _clamp(np.random.normal(0.45, 0.15), 0.15, 0.75)
        price_sensitivity = _clamp(np.random.normal(0.82, 0.08), 0.6, 1.0)
        deal_seeking = _clamp(np.random.normal(0.85, 0.08), 0.6, 1.0)
        research_depth = _clamp(np.random.normal(0.5, 0.15), 0.2, 0.8)
        brand_loyalty = _clamp(np.random.normal(0.3, 0.12), 0.1, 0.6)
        avg_order_value = _clamp(np.random.normal(180, 80), 50, 400)
        lifetime_spend = _clamp(np.random.normal(3000, 1500), 500, 8000)
        visits_90d = int(_clamp(np.random.normal(35, 15), 10, 70))
        session_dur = _clamp(np.random.normal(8, 3), 2, 18)
        cart_abandon_rate = _clamp(np.random.normal(0.55, 0.12), 0.3, 0.85)
        churn = _clamp(np.random.normal(0.3, 0.12), 0.1, 0.6)
        top_cats = random.sample(["appliances", "tv_video", "audio", "smart_home", "phones"], 3)
        preferred_brands = random.sample(["TCL", "Samsung", "LG", "JBL", "Ninja"], 3)
        loyalty_tier = random.choices(["none", "member", "silver"], weights=[0.3, 0.5, 0.2])[0]
        life_stage = random.choice(["young_family", "established_family", "young_professional"])
        income = random.choices(["25k-50k", "50k-75k", "75k-100k"], weights=[0.3, 0.45, 0.25])[0]

    elif persona == "considered_researcher":
        tech_affinity = _clamp(np.random.normal(0.6, 0.15), 0.3, 0.9)
        price_sensitivity = _clamp(np.random.normal(0.45, 0.15), 0.15, 0.75)
        deal_seeking = _clamp(np.random.normal(0.3, 0.12), 0.1, 0.6)
        research_depth = _clamp(np.random.normal(0.85, 0.07), 0.65, 1.0)
        brand_loyalty = _clamp(np.random.normal(0.5, 0.15), 0.2, 0.8)
        avg_order_value = _clamp(np.random.normal(350, 150), 100, 800)
        lifetime_spend = _clamp(np.random.normal(5000, 2000), 1000, 12000)
        visits_90d = int(_clamp(np.random.normal(25, 10), 5, 50))
        session_dur = _clamp(np.random.normal(18, 6), 8, 35)
        cart_abandon_rate = _clamp(np.random.normal(0.2, 0.1), 0.05, 0.45)
        churn = _clamp(np.random.normal(0.2, 0.1), 0.05, 0.45)
        top_cats = random.sample(["computing", "tv_video", "cameras", "audio", "appliances"], 3)
        preferred_brands = random.sample(["Sony", "Canon", "Dell", "LG", "Samsung"], 3)
        loyalty_tier = random.choices(["member", "silver", "gold"], weights=[0.3, 0.4, 0.3])[0]
        life_stage = random.choice(["established_family", "young_professional", "empty_nester"])
        income = random.choices(["50k-75k", "75k-100k", "100k-150k"], weights=[0.25, 0.4, 0.35])[0]

    elif persona == "loyalty_power_user":
        tech_affinity = _clamp(np.random.normal(0.55, 0.2), 0.2, 0.9)
        price_sensitivity = _clamp(np.random.normal(0.35, 0.15), 0.1, 0.7)
        deal_seeking = _clamp(np.random.normal(0.35, 0.15), 0.1, 0.7)
        research_depth = _clamp(np.random.normal(0.45, 0.15), 0.15, 0.75)
        brand_loyalty = _clamp(np.random.normal(0.85, 0.07), 0.65, 1.0)
        avg_order_value = _clamp(np.random.normal(320, 130), 100, 700)
        lifetime_spend = _clamp(np.random.normal(12000, 4000), 5000, 25000)
        visits_90d = int(_clamp(np.random.normal(30, 12), 8, 60))
        session_dur = _clamp(np.random.normal(9, 4), 3, 20)
        cart_abandon_rate = _clamp(np.random.normal(0.2, 0.1), 0.05, 0.45)
        churn = _clamp(np.random.normal(0.1, 0.06), 0.02, 0.25)
        top_cats = random.sample(CATEGORIES, 4)
        preferred_brands = random.sample(["Apple", "Samsung", "Sony", "Bose", "Dyson", "LG"], 3)
        loyalty_tier = random.choices(["gold", "elite"], weights=[0.4, 0.6])[0]
        life_stage = random.choice(["established_family", "empty_nester", "young_family"])
        income = random.choices(["75k-100k", "100k-150k", "150k-200k", "200k_plus"], weights=[0.15, 0.35, 0.3, 0.2])[0]

    elif persona == "lapsing_customer":
        tech_affinity = _clamp(np.random.normal(0.4, 0.2), 0.1, 0.8)
        price_sensitivity = _clamp(np.random.normal(0.5, 0.2), 0.1, 0.9)
        deal_seeking = _clamp(np.random.normal(0.4, 0.2), 0.1, 0.8)
        research_depth = _clamp(np.random.normal(0.35, 0.15), 0.1, 0.7)
        brand_loyalty = _clamp(np.random.normal(0.35, 0.15), 0.1, 0.65)
        avg_order_value = _clamp(np.random.normal(250, 120), 50, 600)
        lifetime_spend = _clamp(np.random.normal(3500, 2000), 500, 10000)
        visits_90d = int(_clamp(np.random.normal(5, 4), 0, 15))
        session_dur = _clamp(np.random.normal(4, 2), 1, 10)
        cart_abandon_rate = _clamp(np.random.normal(0.45, 0.15), 0.15, 0.8)
        churn = _clamp(np.random.normal(0.75, 0.1), 0.5, 1.0)
        top_cats = random.sample(CATEGORIES, 2)
        preferred_brands = random.sample(BRANDS, 2)
        loyalty_tier = random.choices(["none", "member", "silver"], weights=[0.4, 0.4, 0.2])[0]
        life_stage = random.choice(LIFE_STAGES)
        income = random.choice(INCOME_BANDS)

    else:  # business_buyer
        tech_affinity = _clamp(np.random.normal(0.55, 0.15), 0.25, 0.85)
        price_sensitivity = _clamp(np.random.normal(0.3, 0.12), 0.1, 0.6)
        deal_seeking = _clamp(np.random.normal(0.25, 0.1), 0.05, 0.5)
        research_depth = _clamp(np.random.normal(0.6, 0.15), 0.3, 0.9)
        brand_loyalty = _clamp(np.random.normal(0.5, 0.15), 0.2, 0.8)
        avg_order_value = _clamp(np.random.normal(800, 300), 300, 2000)
        lifetime_spend = _clamp(np.random.normal(15000, 6000), 3000, 35000)
        visits_90d = int(_clamp(np.random.normal(20, 10), 3, 45))
        session_dur = _clamp(np.random.normal(12, 5), 4, 25)
        cart_abandon_rate = _clamp(np.random.normal(0.2, 0.1), 0.05, 0.45)
        churn = _clamp(np.random.normal(0.2, 0.1), 0.05, 0.45)
        top_cats = random.sample(["computing", "networking", "phones", "audio"], 3)
        preferred_brands = random.sample(["Dell", "HP", "Lenovo", "Microsoft", "Ubiquiti"], 3)
        loyalty_tier = random.choices(["member", "silver", "gold"], weights=[0.3, 0.4, 0.3])[0]
        life_stage = random.choice(["young_professional", "established_family"])
        income = random.choices(["75k-100k", "100k-150k", "150k-200k"], weights=[0.25, 0.4, 0.35])[0]

    age = int(_clamp(np.random.normal(38, 12), 18, 72))
    orders = int(lifetime_spend / avg_order_value)
    days_since_visit = int(_clamp(np.random.exponential(10 if persona != "lapsing_customer" else 60), 0, 180))
    days_since_purchase = int(_clamp(days_since_visit + np.random.exponential(15), 0, 365))
    loyalty_points = int(lifetime_spend * random.uniform(0.8, 1.5)) if loyalty_tier != "none" else 0

    # Generate category preferences
    cat_prefs = {}
    for cat in CATEGORIES:
        if cat in top_cats:
            cat_prefs[cat] = round(_clamp(np.random.normal(0.75, 0.12), 0.4, 1.0), 2)
        else:
            cat_prefs[cat] = round(_clamp(np.random.normal(0.2, 0.12), 0.0, 0.5), 2)

    # Generate last 3 purchases
    purchase_products = random.sample(SAMPLE_PRODUCTS, 3)
    last_3 = []
    for i, (pname, pprice) in enumerate(purchase_products):
        days_ago = days_since_purchase + i * random.randint(15, 90)
        from datetime import datetime, timedelta
        pdate = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        last_3.append({"product": pname, "price": round(pprice * random.uniform(0.85, 1.0), 2), "date": pdate})

    return {
        "customer_id": None,  # filled later
        # Identity
        "first_name": fake.first_name(),
        "last_name": fake.last_name(),
        "email": fake.email(),
        "age": age,
        "zip_code": fake.zipcode(),
        "city": fake.city(),
        "state": random.choice(STATES),
        "loyalty_tier": loyalty_tier,
        "loyalty_points": loyalty_points,
        # Behavioral
        "total_site_visits_90d": visits_90d,
        "avg_session_duration_min": round(session_dur, 1),
        "pages_per_session": round(_clamp(session_dur * random.uniform(0.5, 1.2), 2, 25), 1),
        "mobile_pct": round(_clamp(np.random.normal(0.55, 0.2), 0.1, 0.95), 2),
        "days_since_last_visit": days_since_visit,
        "product_views_90d": int(visits_90d * random.uniform(2, 5)),
        "search_queries_90d": int(visits_90d * random.uniform(0.3, 1.2)),
        "cart_additions_90d": int(visits_90d * random.uniform(0.1, 0.5)),
        "cart_abandonment_rate": round(cart_abandon_rate, 2),
        "wishlist_items": int(_clamp(np.random.exponential(4), 0, 20)),
        "email_open_rate": round(_clamp(np.random.normal(0.35, 0.15), 0.05, 0.8), 2),
        "push_notification_opt_in": random.random() > 0.4,
        "app_installed": random.random() > 0.35,
        # Transactional
        "lifetime_order_count": max(1, orders),
        "lifetime_spend": round(lifetime_spend, 2),
        "avg_order_value": round(avg_order_value, 2),
        "days_since_last_purchase": days_since_purchase,
        "return_rate": round(_clamp(np.random.normal(0.1, 0.06), 0.0, 0.35), 2),
        "preferred_payment": random.choices(PAYMENTS, weights=[0.4, 0.2, 0.2, 0.15, 0.05])[0],
        "has_financing": random.random() > 0.7,
        "top_categories": top_cats,
        "last_3_purchases": last_3,
        # Preference
        "preferred_brands": preferred_brands,
        "price_sensitivity": round(price_sensitivity, 2),
        "tech_affinity": round(tech_affinity, 2),
        "deal_seeking_score": round(deal_seeking, 2),
        "research_depth": round(research_depth, 2),
        "brand_loyalty_score": round(brand_loyalty, 2),
        "category_preferences": cat_prefs,
        "communication_preference": random.choice(COMM_PREFS),
        # Contextual
        "estimated_household_income": income,
        "home_ownership": random.choices(["own", "rent"], weights=[0.55, 0.45])[0],
        "household_size": int(_clamp(np.random.normal(2.8, 1.2), 1, 7)),
        "has_children": random.random() > 0.5,
        "life_stage": life_stage,
        "propensity_to_churn": round(churn, 2),
        # Persona (ground truth for validation — engine will re-assign)
        "persona_type": persona,
        "persona_confidence": None,
    }


def generate_customers(n: int = NUM_CUSTOMERS) -> list[dict]:
    """Generate n customer profiles with pre-biased persona distributions."""
    # Target distribution
    persona_weights = {
        "tech_enthusiast": 0.18,
        "value_hunter": 0.22,
        "considered_researcher": 0.15,
        "loyalty_power_user": 0.20,
        "lapsing_customer": 0.15,
        "business_buyer": 0.10,
    }

    customers = []
    for persona, weight in persona_weights.items():
        count = int(n * weight)
        for _ in range(count):
            profile = _gen_persona_profile(persona)
            customers.append(profile)

    # Fill remainder
    while len(customers) < n:
        persona = random.choices(list(persona_weights.keys()), weights=list(persona_weights.values()))[0]
        customers.append(_gen_persona_profile(persona))

    # Shuffle and assign IDs
    random.shuffle(customers)
    for i, c in enumerate(customers):
        c["customer_id"] = f"cust_{i+1:05d}"

    return customers


def main():
    print("Generating synthetic customer profiles...")
    customers = generate_customers(NUM_CUSTOMERS)

    out_dir = Path(__file__).parent / "generated"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "customers.json"

    with open(out_path, "w") as f:
        json.dump(customers, f, indent=2)

    print(f"Generated {len(customers)} profiles -> {out_path}")

    # Print distribution summary
    from collections import Counter
    dist = Counter(c["persona_type"] for c in customers)
    print("\nPersona Distribution:")
    for persona, count in sorted(dist.items()):
        print(f"  {persona}: {count} ({count/len(customers)*100:.1f}%)")


if __name__ == "__main__":
    main()
