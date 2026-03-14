"""WebSocket endpoints for real-time event streaming."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from models.schemas import AbandonSignal, DashboardEvent, DashboardUpdate
from services.abandon_detector import detector
from services.intervention_engine import engine as intervention_engine
from services.metrics_tracker import tracker
from services.profile_store import store
from services.reason_classifier import classifier

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections for storefront and dashboard clients."""

    def __init__(self):
        self.storefront_connections: dict[str, WebSocket] = {}  # session_id -> ws
        self.dashboard_connections: list[WebSocket] = []

    async def connect_storefront(self, session_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self.storefront_connections[session_id] = ws

    async def connect_dashboard(self, ws: WebSocket) -> None:
        await ws.accept()
        self.dashboard_connections.append(ws)

    def disconnect_storefront(self, session_id: str) -> None:
        self.storefront_connections.pop(session_id, None)

    def disconnect_dashboard(self, ws: WebSocket) -> None:
        if ws in self.dashboard_connections:
            self.dashboard_connections.remove(ws)

    async def send_to_storefront(self, session_id: str, data: dict) -> None:
        ws = self.storefront_connections.get(session_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect_storefront(session_id)

    async def broadcast_to_dashboard(self, data: dict) -> None:
        disconnected = []
        for ws in self.dashboard_connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            self.disconnect_dashboard(ws)


manager = ConnectionManager()


async def _process_event(session_id: str, event: dict) -> None:
    """Process an incoming event through the full pipeline."""
    event_type = event.get("event_type", "")
    data = event.get("data", {})

    # Record event in session history
    store.add_event(session_id, event)

    # Handle cart updates
    if event_type == "add_to_cart":
        store.update_cart(session_id, "add", {
            "product_id": data.get("product_id"),
            "product_name": data.get("product_name"),
            "price": data.get("product_price"),
            "quantity": data.get("quantity", 1),
        })
    elif event_type == "remove_from_cart":
        store.update_cart(session_id, "remove", {
            "product_id": data.get("product_id"),
        })

    # Get profile and cart
    profile = store.get_profile(session_id)
    if not profile:
        return

    cart = store.get_cart(session_id)
    history = store.get_history(session_id)

    # Run abandon detection
    signal: AbandonSignal | None = detector.detect(event, history, cart)

    if signal:
        # Classify the abandon reason
        reason = classifier.classify(signal, profile)

        # Track metrics
        reason_str = reason.value if hasattr(reason, 'value') else str(reason)
        tracker.record_abandon(signal, reason_str)

        # Determine intervention
        persona_type = profile.get("persona_type", "tech_enthusiast")
        intervention = intervention_engine.decide(reason, persona_type, signal)

        # Track intervention
        tracker.record_intervention(intervention)

        # Send intervention to storefront
        intervention_msg = {
            "type": "intervention",
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "intervention": intervention.model_dump(),
        }
        await manager.send_to_storefront(session_id, intervention_msg)

        # Broadcast to dashboard
        dashboard_event = DashboardEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            session_id=session_id,
            persona_type=persona_type,
            event_type=signal.abandon_type.value if hasattr(signal.abandon_type, 'value') else str(signal.abandon_type),
            reason=reason_str,
            product_name=signal.product_name,
            product_price=signal.product_price,
            intervention_triggered=True,
            intervention_type=intervention.action_type.value if hasattr(intervention.action_type, 'value') else str(intervention.action_type),
            intervention_template=intervention.template,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

        dashboard_update = DashboardUpdate(
            type="dashboard_update",
            timestamp=datetime.now(timezone.utc).isoformat(),
            event=dashboard_event,
            stats=tracker.get_stats(),
        )
        await manager.broadcast_to_dashboard(dashboard_update.model_dump())

    else:
        # No abandon detected — still broadcast stats update for live dashboard
        # Only broadcast on significant events to avoid spamming
        if event_type in ("browse", "add_to_cart", "search", "checkout_start"):
            dashboard_update = DashboardUpdate(
                type="dashboard_update",
                timestamp=datetime.now(timezone.utc).isoformat(),
                event=None,
                stats=tracker.get_stats(),
            )
            await manager.broadcast_to_dashboard(dashboard_update.model_dump())


@router.websocket("/ws/storefront/{session_id}")
async def storefront_ws(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for storefront event streaming."""
    await manager.connect_storefront(session_id, websocket)

    # Ensure session exists
    if not store.get_profile(session_id):
        session_info = store.create_session(session_id=session_id)
        tracker.record_session(session_info["persona_type"])

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                event = json.loads(raw)
                event["session_id"] = session_id
                await _process_event(session_id, event)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
    except WebSocketDisconnect:
        manager.disconnect_storefront(session_id)


@router.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket):
    """WebSocket endpoint for dashboard real-time updates."""
    await manager.connect_dashboard(websocket)

    # Send initial stats snapshot
    initial_update = DashboardUpdate(
        type="dashboard_update",
        timestamp=datetime.now(timezone.utc).isoformat(),
        event=None,
        stats=tracker.get_stats(),
    )
    await websocket.send_json(initial_update.model_dump())

    try:
        while True:
            # Dashboard is mostly receive-only, but keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_dashboard(websocket)
