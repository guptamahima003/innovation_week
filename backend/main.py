"""FastAPI application entry point for the 360° Persona Engine."""

from __future__ import annotations

import json
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models.persona_engine import PersonaEngine
from routers import api, ws
from services.profile_store import store

# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load data and train persona engine on startup."""
    data_path = Path(__file__).parent / "data" / "generated" / "customers.json"

    if not data_path.exists():
        print("Customer data not found — generating synthetic profiles...")
        data_path.parent.mkdir(parents=True, exist_ok=True)
        # Import and run generator inline
        import subprocess
        result = subprocess.run(
            [sys.executable, str(Path(__file__).parent / "data" / "generate_synthetic.py")],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print("ERROR generating data:", result.stderr)
            sys.exit(1)
        print("Synthetic data generated.")

    # Load profiles
    with open(data_path) as f:
        profiles = json.load(f)
    print(f"Loaded {len(profiles)} customer profiles")

    # Train persona engine and assign personas
    engine = PersonaEngine(n_clusters=settings.NUM_PERSONAS)
    engine.fit(profiles)
    print(f"Persona engine trained — silhouette: {engine.silhouette:.3f}")
    print(f"Distribution: {engine.get_distribution()}")

    # Assign ML-predicted personas to profiles
    predictions = engine.predict_batch(profiles)
    for profile, (persona, confidence) in zip(profiles, predictions):
        profile["persona_type"] = persona
        profile["persona_confidence"] = confidence

    # Load into profile store
    store.load_profiles(profiles)
    store.persona_engine = engine  # Make engine available for new user assignment & reassignment
    print(f"Profile store loaded — {store.total_profiles} profiles ready")

    # Run demo simulator to pre-populate dashboard metrics
    if settings.DEMO_SIMULATOR_ENABLED:
        products_path = Path(__file__).parent / "data" / "products.json"
        with open(products_path) as pf:
            products = json.load(pf)

        from services.demo_simulator import DemoSimulator
        from services.metrics_tracker import tracker

        simulator = DemoSimulator(store, tracker, products)
        simulator.run(num_sessions=settings.DEMO_SIMULATOR_SESSIONS)
        stats = tracker.get_stats()
        print(
            f"Demo simulator complete — {stats.total_sessions} sessions, "
            f"{stats.total_abandons} abandons, "
            f"${stats.revenue_at_risk:.0f} at risk, "
            f"${stats.estimated_revenue_recovered:.0f} recovered"
        )

    yield  # App runs

    print("Shutting down...")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="360° User Persona Engine",
    description="Best Buy Hackathon — Real-time persona-driven personalization & abandonment intelligence",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permissive for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(api.router)
app.include_router(ws.router)


@app.get("/")
def root():
    return {
        "name": "360° User Persona Engine",
        "status": "running",
        "docs": "/docs",
    }
