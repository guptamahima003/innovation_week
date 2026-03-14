#!/bin/bash
# One-command project setup
set -e

echo "🔧 Setting up 360° User Persona Engine..."

cd "$(dirname "$0")/.."
ROOT=$(pwd)

# Backend setup
echo ""
echo "📦 Setting up Python backend..."
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt --quiet

# Generate synthetic data if not exists
if [ ! -f "data/generated/customers.json" ]; then
    echo "🧪 Generating synthetic customer data..."
    python data/generate_synthetic.py
else
    echo "✅ Synthetic data already exists"
fi

# Frontend setup
echo ""
echo "📦 Setting up Next.js frontend..."
cd "$ROOT/frontend"
npm install --quiet

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the project, run:"
echo "  bash scripts/dev.sh"
