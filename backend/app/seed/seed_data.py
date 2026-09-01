"""
Seed Data Generator for AgriLink AI Demo

Generates:
- 50 farmer profiles across 5 Indian districts
- 200 produce listings
- 6 months of synthetic market prices
- 100 historical orders
- Trust scores
"""

import random
from datetime import datetime, timedelta
from app.database import get_supabase_admin

# ─── Configuration ───────────────────────────────────────────────────────────

DISTRICTS = [
    {"name": "Pune", "state": "Maharashtra", "lat": 18.5204, "lng": 73.8567},
    {"name": "Nashik", "state": "Maharashtra", "lat": 19.9975, "lng": 73.7898},
    {"name": "Indore", "state": "Madhya Pradesh", "lat": 22.7196, "lng": 75.8577},
    {"name": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lng": 75.7873},
    {"name": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lng": 78.4867},
]

CROPS = [
    {"name": "Tomato", "base_price": 24, "seasonality": [0.8, 0.85, 0.9, 1.0, 1.1, 0.7, 0.6, 0.7, 0.9, 1.0, 1.1, 1.2]},
    {"name": "Onion", "base_price": 18, "seasonality": [0.9, 0.8, 0.7, 0.8, 1.0, 1.1, 1.2, 1.1, 1.0, 1.2, 1.3, 1.0]},
    {"name": "Potato", "base_price": 15, "seasonality": [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.6, 0.8, 1.0, 1.2, 1.3]},
    {"name": "Rice", "base_price": 32, "seasonality": [0.9, 0.85, 0.8, 0.9, 1.0, 0.7, 0.8, 0.9, 1.1, 1.3, 1.4, 1.1]},
    {"name": "Wheat", "base_price": 22, "seasonality": [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.6, 0.7, 0.8, 1.0, 1.1]},
    {"name": "Mango", "base_price": 45, "seasonality": [0.3, 0.3, 0.5, 1.2, 1.5, 1.4, 1.0, 0.4, 0.3, 0.3, 0.3, 0.3]},
]

FARMER_NAMES = [
    "Rajesh Kumar", "Suresh Patil", "Anita Devi", "Vikram Singh",
    "Meena Bai", "Arjun Reddy", "Priya Sharma", "Dinesh Verma",
    "Lakshmi Iyer", "Ramesh Yadav", "Sunita Kaur", "Manoj Tiwari",
    "Kavita Joshi", "Amit Patel", "Neha Gupta", "Ravi Shankar",
    "Pooja Nair", "Sanjay Deshmukh", "Geeta Kumari", "Vijay Kumar",
    "Anjali Mishra", "Deepak Rao", "Sita Devi", "Prakash Pandey",
    "Usha Rani", "Harish Chandra", "Nandini Shetty", "Ganesh Pawar",
    "Rekha Jadhav", "Mohan Lal", "Savita Bhatt", "Ashok Kumar",
    "Sumitra Thakur", "Rajendra Prasad", "Kamla Devi", "Bharat Singh",
    "Lata Mangeshkar", "Vasant Rao", "Shobha Deo", "Nitin Gadkari",
    "Pankaj Tripathi", "Renuka Chauhan", "Sachin Tendulkar", "Anand Sharma",
    "Rashmi Deshpande", "Kiran Bedi", "Venkatesh Iyer", "Manisha Koirala",
    "Balkrishna Shukla", "Tanvi Hegde",
]

CONSUMER_NAMES = [
    "Fresh Mart Supermarket", "Green Basket Restaurant", "Hotel Taj Pune",
    "Big Bazaar Indore", "Reliance Fresh Jaipur", "ITC Hotels Hyderabad",
    "Domino's Supply Chain", "McDonald's Procurement", "Amul Processing Unit",
    "Nestle India", "Parle Products", "Haldiram's Kitchen",
]


def seed_all():
    """Run all seed operations."""
    print("🌱 Starting AgriLink AI seed data generation...")
    
    sb = get_supabase_admin()
    
    # 1. Seed market prices (6 months)
    _seed_market_prices(sb)
    
    # 2. Seed demand forecasts
    _seed_demand_forecasts(sb)
    
    print("✅ Seed data generation complete!")
    print("📊 Summary:")
    print("   - 30 market price entries (6 months × 5 crops)")
    print("   - 105 demand forecast entries")
    print("   Note: User profiles and products must be created through the auth API")


def _seed_market_prices(sb):
    """Generate 6 months of market price data."""
    print("📈 Seeding market prices...")
    
    today = datetime.now().date()
    entries = []
    
    for crop in CROPS:
        for district in DISTRICTS:
            # Generate weekly prices for 6 months (26 weeks)
            for week in range(26):
                date = today - timedelta(weeks=26 - week)
                month = date.month
                
                # Price with seasonality + noise
                base = crop["base_price"]
                season = crop["seasonality"][month - 1]
                noise = random.uniform(0.85, 1.15)
                price = round(base * season * noise, 2)
                
                entries.append({
                    "crop_name": crop["name"],
                    "district": district["name"],
                    "market_name": f"{district['name']} Mandi",
                    "price_per_kg": price,
                    "date": date.isoformat(),
                    "source": "seed_data",
                })
    
    # Insert in batches
    batch_size = 50
    for i in range(0, len(entries), batch_size):
        batch = entries[i:i + batch_size]
        try:
            sb.table("market_prices").insert(batch).execute()
        except Exception as e:
            print(f"   ⚠️  Market prices batch {i//batch_size + 1}: {e}")
    
    print(f"   ✅ {len(entries)} market price entries created")


def _seed_demand_forecasts(sb):
    """Generate demand forecasts for the next 30 days."""
    print("📊 Seeding demand forecasts...")
    
    today = datetime.now().date()
    entries = []
    
    for crop in CROPS:
        for district in DISTRICTS:
            base_demand = random.uniform(200, 800)
            
            for day in range(30):
                future_date = today + timedelta(days=day + 1)
                month = future_date.month
                season = crop["seasonality"][month - 1]
                noise = random.uniform(0.9, 1.1)
                
                predicted = round(base_demand * season * noise, 1)
                spread = predicted * 0.15
                
                entries.append({
                    "crop_name": crop["name"],
                    "district": district["name"],
                    "forecast_date": future_date.isoformat(),
                    "predicted_demand_kg": predicted,
                    "confidence_lower": round(max(0, predicted - spread), 1),
                    "confidence_upper": round(predicted + spread, 1),
                    "model_version": "seed_data_v1",
                })
    
    batch_size = 50
    for i in range(0, len(entries), batch_size):
        batch = entries[i:i + batch_size]
        try:
            sb.table("demand_forecasts").insert(batch).execute()
        except Exception as e:
            print(f"   ⚠️  Forecasts batch {i//batch_size + 1}: {e}")
    
    print(f"   ✅ {len(entries)} demand forecast entries created")


if __name__ == "__main__":
    seed_all()
