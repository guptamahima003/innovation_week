#!/bin/bash
# Demo traffic simulator — generates fake sessions that browse, cart, and abandon
# Usage: bash scripts/demo.sh [num_sessions] [backend_url]

NUM_SESSIONS=${1:-10}
BACKEND_URL=${2:-"http://localhost:8000"}

echo "🚀 Starting demo traffic simulator..."
echo "   Sessions: $NUM_SESSIONS"
echo "   Backend: $BACKEND_URL"

cd "$(dirname "$0")/.."
source backend/.venv/bin/activate

python3 -c "
import asyncio
import json
import random
import sys
import time

import websockets
import requests

BACKEND = '${BACKEND_URL}'
WS_URL = BACKEND.replace('http', 'ws')
NUM_SESSIONS = ${NUM_SESSIONS}

PERSONAS = [
    'tech_enthusiast', 'value_hunter', 'considered_researcher',
    'loyalty_power_user', 'lapsing_customer', 'business_buyer'
]

# Get products
products = requests.get(f'{BACKEND}/api/products').json()

async def simulate_session(session_num):
    \"\"\"Simulate a single user session with browsing, carting, and abandonment.\"\"\"
    persona = random.choice(PERSONAS)

    # Create session
    resp = requests.post(f'{BACKEND}/api/session?force_persona={persona}')
    session = resp.json()
    session_id = session['session_id']
    print(f'  [{session_num}] Session {session_id[:12]}... as {persona}')

    try:
        async with websockets.connect(f'{WS_URL}/ws/storefront/{session_id}') as ws:
            # Browse 2-5 products
            viewed_products = random.sample(products, min(random.randint(2, 5), len(products)))
            cart = []

            for product in viewed_products:
                # Browse event
                await ws.send(json.dumps({
                    'type': 'event',
                    'event_type': 'browse',
                    'session_id': session_id,
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                    'data': {
                        'product_id': product['id'],
                        'product_name': product['name'],
                        'product_price': product['price'],
                        'category': product['category'],
                        'page': f'/product/{product[\"id\"]}',
                        'time_on_page_seconds': random.randint(5, 60),
                    }
                }))
                await asyncio.sleep(random.uniform(0.3, 1.0))

                # Maybe add to cart (40% chance)
                if random.random() < 0.4:
                    cart.append(product)
                    cart_total = sum(p['price'] for p in cart)
                    await ws.send(json.dumps({
                        'type': 'event',
                        'event_type': 'add_to_cart',
                        'session_id': session_id,
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                        'data': {
                            'product_id': product['id'],
                            'product_name': product['name'],
                            'product_price': product['price'],
                            'quantity': 1,
                            'cart_total': cart_total,
                            'cart_item_count': len(cart),
                        }
                    }))
                    await asyncio.sleep(random.uniform(0.2, 0.5))

            # Decide on abandon type (80% abandon, 20% complete)
            if random.random() < 0.8 and cart:
                abandon_type = random.choice(['cart', 'checkout', 'product_page'])

                if abandon_type == 'cart':
                    # Cart abandon
                    await ws.send(json.dumps({
                        'type': 'event',
                        'event_type': 'page_leave',
                        'session_id': session_id,
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                        'data': {
                            'from_page': '/cart',
                            'to_page': '/',
                            'time_on_page_seconds': random.randint(10, 120),
                            'had_items_in_cart': True,
                        }
                    }))
                elif abandon_type == 'checkout':
                    # Checkout start then abandon
                    cart_total = sum(p['price'] for p in cart)
                    await ws.send(json.dumps({
                        'type': 'event',
                        'event_type': 'checkout_start',
                        'session_id': session_id,
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                        'data': {
                            'cart_total': cart_total,
                            'cart_item_count': len(cart),
                        }
                    }))
                    await asyncio.sleep(0.5)
                    await ws.send(json.dumps({
                        'type': 'event',
                        'event_type': 'page_leave',
                        'session_id': session_id,
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                        'data': {
                            'from_page': '/checkout',
                            'to_page': '/',
                            'time_on_page_seconds': random.randint(15, 90),
                            'had_items_in_cart': True,
                        }
                    }))
                else:
                    # Product page abandon
                    product = random.choice(viewed_products)
                    await ws.send(json.dumps({
                        'type': 'event',
                        'event_type': 'page_leave',
                        'session_id': session_id,
                        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                        'data': {
                            'from_page': f'/product/{product[\"id\"]}',
                            'to_page': '/',
                            'time_on_page_seconds': random.randint(15, 60),
                            'had_items_in_cart': len(cart) > 0,
                            'product_id': product['id'],
                            'product_name': product['name'],
                            'product_price': product['price'],
                        }
                    }))

                # Wait for intervention response
                try:
                    response = await asyncio.wait_for(ws.recv(), timeout=3.0)
                    data = json.loads(response)
                    if data.get('type') == 'intervention':
                        int_data = data['intervention']
                        print(f'    [{session_num}] ✨ Intervention: {int_data[\"template\"]} (reason: {int_data[\"reason\"]})')
                except asyncio.TimeoutError:
                    pass

            # Search abandon (20% chance, separate from cart flow)
            if random.random() < 0.2:
                await ws.send(json.dumps({
                    'type': 'event',
                    'event_type': 'search',
                    'session_id': session_id,
                    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                    'data': {
                        'query': random.choice(['gaming laptop', '4k tv deals', 'wireless headphones', 'smart thermostat']),
                        'results_count': random.randint(3, 20),
                        'clicked_result': None,
                    }
                }))
                try:
                    response = await asyncio.wait_for(ws.recv(), timeout=2.0)
                except asyncio.TimeoutError:
                    pass

            await asyncio.sleep(0.5)

    except Exception as e:
        print(f'    [{session_num}] Error: {e}')

async def main():
    print(f'\\n📊 Simulating {NUM_SESSIONS} customer sessions...\\n')
    tasks = []
    for i in range(NUM_SESSIONS):
        tasks.append(simulate_session(i + 1))
        await asyncio.sleep(random.uniform(0.5, 1.5))  # Stagger session starts

    await asyncio.gather(*tasks, return_exceptions=True)

    # Print final stats
    print('\\n📈 Final stats:')
    stats = requests.get(f'{BACKEND}/api/stats').json()
    print(f'   Total sessions: {stats[\"total_sessions\"]}')
    print(f'   Total abandons: {stats[\"total_abandons\"]}')
    print(f'   Interventions triggered: {stats[\"interventions_triggered\"]}')
    print(f'   Revenue at risk: \${stats[\"revenue_at_risk\"]:,.2f}')
    print(f'   Revenue recovered (est): \${stats[\"estimated_revenue_recovered\"]:,.2f}')
    print('\\n✅ Demo simulation complete!')

asyncio.run(main())
" 2>&1
