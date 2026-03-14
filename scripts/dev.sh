#!/bin/bash
# Start both backend and frontend servers
set -e

cd "$(dirname "$0")/.."
ROOT=$(pwd)

echo "🚀 Starting 360° User Persona Engine..."
echo ""

# Kill existing processes on ports 8000 and 3000
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true

# Start backend
echo "🐍 Starting FastAPI backend on port 8000..."
cd "$ROOT/backend"
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 4

# Start frontend
echo "⚛️  Starting Next.js frontend on port 3000..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "════════════════════════════════════════════════════"
echo "  360° User Persona Engine is running!"
echo ""
echo "  🛍️  Storefront:  http://localhost:3000"
echo "  📊 Dashboard:   http://localhost:3000/dashboard"
echo "  📡 API Docs:    http://localhost:8000/docs"
echo ""
echo "  Demo personas:"
echo "    http://localhost:3000?force_persona=value_hunter"
echo "    http://localhost:3000?force_persona=tech_enthusiast"
echo "    http://localhost:3000?force_persona=considered_researcher"
echo ""
echo "  Run traffic simulator:"
echo "    bash scripts/demo.sh"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "════════════════════════════════════════════════════"

# Trap Ctrl+C and kill both processes
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for any process to exit
wait
