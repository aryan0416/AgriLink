"""
Price Intelligence Service

Combines market prices, demand forecasts, supply levels, and historical
trends to produce a recommended selling-price range.

Output: recommended_min, recommended_max, market_reference, demand_signal
"""

from datetime import datetime, timedelta
from typing import Optional


def calculate_price_recommendation(
    market_prices: list[dict],
    supply_listings: list[dict],
    demand_forecasts: list[dict],
) -> dict:
    """
    Calculate AI-recommended pricing.
    
    Formula:
        base_price = weighted_avg(market_prices)
        demand_multiplier = f(predicted_demand vs historical)
        supply_factor = g(supply level)
        recommended = base_price × demand_multiplier × supply_factor
    """
    
    # 1. Market reference price (weighted average of recent prices)
    if market_prices:
        # More recent prices get higher weight
        sorted_prices = sorted(market_prices, key=lambda x: x.get("date", ""), reverse=True)
        weighted_sum = 0
        weight_total = 0
        for i, p in enumerate(sorted_prices[:30]):
            weight = 30 - i  # Recent prices weigh more
            price = p.get("price_per_kg", 0)
            weighted_sum += price * weight
            weight_total += weight
        
        market_reference = weighted_sum / weight_total if weight_total > 0 else 20.0
    else:
        # Default reference prices by crop (₹/kg, approximate Indian market)
        market_reference = 25.0
    
    # 2. Demand multiplier
    if demand_forecasts:
        recent_demand = sum(d.get("predicted_demand_kg", 100) for d in demand_forecasts[:7]) / min(7, len(demand_forecasts))
        historical_demand = 100  # baseline
        
        if recent_demand > historical_demand * 1.2:
            demand_multiplier = 1.15  # High demand → price up
            demand_signal = "high"
        elif recent_demand > historical_demand * 1.05:
            demand_multiplier = 1.05
            demand_signal = "medium"
        elif recent_demand < historical_demand * 0.85:
            demand_multiplier = 0.90  # Low demand → price down
            demand_signal = "low"
        else:
            demand_multiplier = 1.0
            demand_signal = "medium"
    else:
        demand_multiplier = 1.0
        demand_signal = "medium"
    
    # 3. Supply factor
    total_supply = sum(s.get("quantity_kg", 0) for s in supply_listings)
    listing_count = len(supply_listings)
    
    if listing_count > 20:
        supply_factor = 0.92  # Oversupply → price down
    elif listing_count > 10:
        supply_factor = 0.96
    elif listing_count < 3:
        supply_factor = 1.12  # Undersupply → price up
    elif listing_count < 5:
        supply_factor = 1.05
    else:
        supply_factor = 1.0
    
    # 4. Compute recommended price
    recommended = market_reference * demand_multiplier * supply_factor
    
    # 5. Add margin for farmer
    recommended_with_margin = recommended * 1.05  # 5% buffer for negotiation
    
    return {
        "market_reference": round(market_reference, 2),
        "recommended_min": round(recommended * 0.95, 2),
        "recommended_max": round(recommended_with_margin * 1.05, 2),
        "demand_signal": demand_signal,
        "supply_factor": round(supply_factor, 3),
        "demand_multiplier": round(demand_multiplier, 3),
        "total_supply_kg": round(total_supply, 1),
        "active_listings": listing_count,
    }


def get_price_history_trend(prices: list[dict]) -> dict:
    """Analyze price trend from historical data."""
    if len(prices) < 2:
        return {"trend": "stable", "change_pct": 0, "avg_price": 0}
    
    sorted_prices = sorted(prices, key=lambda x: x.get("date", ""))
    
    recent_avg = sum(p.get("price_per_kg", 0) for p in sorted_prices[-7:]) / min(7, len(sorted_prices))
    older_avg = sum(p.get("price_per_kg", 0) for p in sorted_prices[-14:-7]) / min(7, max(1, len(sorted_prices) - 7))
    
    if older_avg > 0:
        change_pct = ((recent_avg - older_avg) / older_avg) * 100
    else:
        change_pct = 0
    
    if change_pct > 5:
        trend = "rising"
    elif change_pct < -5:
        trend = "falling"
    else:
        trend = "stable"
    
    return {
        "trend": trend,
        "change_pct": round(change_pct, 1),
        "avg_price": round(recent_avg, 2),
    }
