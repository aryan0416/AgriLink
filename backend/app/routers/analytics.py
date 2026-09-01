from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.database import get_supabase
from app.models.analytics import (
    DemandForecastRequest, DemandForecastResponse, DemandForecast,
    PriceRecommendationRequest, PriceRecommendation,
    MarketPrice, MarketPriceCreate, ImpactMetrics,
)
from app.auth.middleware import get_current_user, UserPayload
from app.services.demand_forecast import generate_demand_forecast
from app.services.price_intelligence import calculate_price_recommendation

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


# ─── Demand Forecasting ──────────────────────────────────────────────────────

@router.post("/demand-forecast", response_model=DemandForecastResponse)
async def get_demand_forecast(
    data: DemandForecastRequest,
    user: UserPayload = Depends(get_current_user),
):
    """Get AI-powered demand forecast for a crop in a specific district."""
    sb = get_supabase()
    
    # Fetch historical market data for this crop+district
    history = (
        sb.table("market_prices")
        .select("*")
        .ilike("crop_name", f"%{data.crop_name}%")
        .eq("district", data.district)
        .order("date", desc=True)
        .limit(180)
        .execute()
    )
    
    # Also check demand_forecasts table
    past_forecasts = (
        sb.table("demand_forecasts")
        .select("*")
        .ilike("crop_name", f"%{data.crop_name}%")
        .eq("district", data.district)
        .order("forecast_date", desc=True)
        .limit(90)
        .execute()
    )
    
    forecasts = generate_demand_forecast(
        crop_name=data.crop_name,
        district=data.district,
        historical_prices=history.data or [],
        past_demand=past_forecasts.data or [],
        horizon_days=data.horizon_days,
    )
    
    # Determine trend
    if len(forecasts) >= 2:
        first_half = sum(f.predicted_demand_kg for f in forecasts[:len(forecasts)//2])
        second_half = sum(f.predicted_demand_kg for f in forecasts[len(forecasts)//2:])
        if second_half > first_half * 1.1:
            trend = "up"
        elif second_half < first_half * 0.9:
            trend = "down"
        else:
            trend = "stable"
    else:
        trend = "stable"
    
    summary = f"Demand for {data.crop_name} in {data.district} is projected to {'increase' if trend == 'up' else 'decrease' if trend == 'down' else 'remain stable'} over the next {data.horizon_days} days."
    
    return DemandForecastResponse(
        crop_name=data.crop_name,
        district=data.district,
        forecasts=forecasts,
        summary=summary,
        confidence_level="medium" if len(forecasts) > 5 else "low",
    )


# ─── Price Intelligence ──────────────────────────────────────────────────────

@router.post("/price-recommendation", response_model=PriceRecommendation)
async def get_price_recommendation(
    data: PriceRecommendationRequest,
    user: UserPayload = Depends(get_current_user),
):
    """Get AI-recommended pricing for a crop in a specific district."""
    sb = get_supabase()
    
    # Get market reference prices
    prices = (
        sb.table("market_prices")
        .select("*")
        .ilike("crop_name", f"%{data.crop_name}%")
        .eq("district", data.district)
        .order("date", desc=True)
        .limit(30)
        .execute()
    )
    
    # Get supply level (active listings)
    supply = (
        sb.table("products")
        .select("quantity_kg, unit_price")
        .ilike("crop_name", f"%{data.crop_name}%")
        .eq("district", data.district)
        .eq("status", "active")
        .execute()
    )
    
    # Get demand signal from recent forecasts
    demand = (
        sb.table("demand_forecasts")
        .select("predicted_demand_kg")
        .ilike("crop_name", f"%{data.crop_name}%")
        .eq("district", data.district)
        .order("forecast_date", desc=True)
        .limit(7)
        .execute()
    )
    
    recommendation = calculate_price_recommendation(
        market_prices=prices.data or [],
        supply_listings=supply.data or [],
        demand_forecasts=demand.data or [],
    )
    
    return PriceRecommendation(
        product_id="",
        crop_name=data.crop_name,
        market_reference=recommendation["market_reference"],
        recommended_min=recommendation["recommended_min"],
        recommended_max=recommendation["recommended_max"],
        demand_signal=recommendation["demand_signal"],
        supply_factor=recommendation["supply_factor"],
    )


# ─── Market Prices ───────────────────────────────────────────────────────────

@router.post("/market-prices", status_code=201)
async def add_market_price(
    data: MarketPriceCreate,
    user: UserPayload = Depends(get_current_user),
):
    """Add a market price entry."""
    sb = get_supabase()
    
    result = sb.table("market_prices").insert({
        "crop_name": data.crop_name,
        "district": data.district,
        "market_name": data.market_name,
        "price_per_kg": data.price_per_kg,
        "date": data.date.isoformat(),
        "source": "manual",
    }).execute()
    
    return {"message": "Market price added", "id": result.data[0]["id"] if result.data else None}


@router.get("/market-prices")
async def get_market_prices(
    crop_name: str = Query(...),
    district: str = Query(...),
    days: int = Query(30, ge=1, le=365),
    user: UserPayload = Depends(get_current_user),
):
    """Get historical market prices for a crop in a district."""
    sb = get_supabase()
    
    result = (
        sb.table("market_prices")
        .select("*")
        .ilike("crop_name", f"%{crop_name}%")
        .eq("district", district)
        .order("date", desc=True)
        .limit(days)
        .execute()
    )
    
    return result.data or []


# ─── Impact Dashboard ────────────────────────────────────────────────────────

@router.get("/impact", response_model=ImpactMetrics)
async def get_impact_metrics(user: UserPayload = Depends(get_current_user)):
    """Get platform-wide impact metrics for the admin dashboard."""
    sb = get_supabase()
    
    # Count users by role
    farmers = sb.table("profiles").select("id", count="exact").eq("role", "farmer").execute()
    fpos = sb.table("profiles").select("id", count="exact").eq("role", "fpo").execute()
    buyers = sb.table("profiles").select("id", count="exact").eq("role", "buyer").execute()
    consumers = sb.table("profiles").select("id", count="exact").eq("role", "consumer").execute()
    
    # Orders and revenue
    orders = sb.table("orders").select("total_amount, status, created_at").execute()
    all_orders = orders.data or []
    
    total_orders = len(all_orders)
    total_revenue = sum(o.get("total_amount", 0) for o in all_orders)
    delivered = [o for o in all_orders if o["status"] == "delivered"]
    fulfillment_rate = len(delivered) / total_orders if total_orders > 0 else 0
    
    # Farmer realization (avg price farmers receive vs market average)
    products = sb.table("products").select("unit_price").execute()
    avg_farmer_price = (
        sum(p.get("unit_price", 0) for p in (products.data or [])) / len(products.data)
        if products.data else 0
    )
    
    market = sb.table("market_prices").select("price_per_kg").execute()
    avg_market_price = (
        sum(m.get("price_per_kg", 0) for m in (market.data or [])) / len(market.data)
        if market.data else 0
    )
    
    # Transport metrics
    shipments = sb.table("shipments").select("distance_km, cost").execute()
    all_shipments = shipments.data or []
    total_distance = sum(s.get("distance_km", 0) for s in all_shipments)
    total_transport_cost = sum(s.get("cost", 0) for s in all_shipments)
    
    return ImpactMetrics(
        total_farmers=(farmers.count or 0) + (fpos.count or 0),
        total_buyers=(buyers.count or 0) + (consumers.count or 0),
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        avg_farmer_realization=round(avg_farmer_price, 2),
        fulfillment_rate=round(fulfillment_rate * 100, 1),
        avg_delivery_time_hours=24.0,  # Placeholder
        wastage_reduction_pct=15.0,    # Target hypothesis
        transport_savings_pct=20.0,    # Target hypothesis
    )
