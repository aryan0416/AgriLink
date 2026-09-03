"""
Demand Forecasting Service

Uses Facebook Prophet for time-series forecasting when available,
with a statistical fallback for the hackathon MVP.

Inputs: historical market prices, past demand data, seasonality, festivals
Output: demand forecast by crop/region/time
"""

import math
from datetime import datetime, timedelta
from typing import Optional
from app.models.analytics import DemandForecast


# Festival calendar (Indian, approximate dates) — used as seasonality signals
FESTIVALS = {
    1: ["Makar Sankranti"],
    2: [],
    3: ["Holi"],
    4: ["Ram Navami"],
    5: ["Akshaya Tritiya"],
    6: [],
    7: ["Guru Purnima"],
    8: ["Raksha Bandhan", "Independence Day"],
    9: ["Ganesh Chaturthi", "Onam"],
    10: ["Navratri", "Dussehra", "Diwali"],
    11: ["Diwali", "Bhai Dooj"],
    12: ["Christmas", "Year End"],
}

# Crop seasonality multipliers (India, kharif+rabi cycles)
SEASONALITY = {
    "tomato": {1: 0.8, 2: 0.85, 3: 0.9, 4: 1.0, 5: 1.1, 6: 0.7, 7: 0.6, 8: 0.7, 9: 0.9, 10: 1.0, 11: 1.1, 12: 1.2},
    "onion": {1: 0.9, 2: 0.8, 3: 0.7, 4: 0.8, 5: 1.0, 6: 1.1, 7: 1.2, 8: 1.1, 9: 1.0, 10: 1.2, 11: 1.3, 12: 1.0},
    "potato": {1: 1.0, 2: 0.9, 3: 0.8, 4: 0.7, 5: 0.6, 6: 0.5, 7: 0.5, 8: 0.6, 9: 0.8, 10: 1.0, 11: 1.2, 12: 1.3},
    "rice": {1: 0.9, 2: 0.85, 3: 0.8, 4: 0.9, 5: 1.0, 6: 0.7, 7: 0.8, 8: 0.9, 9: 1.1, 10: 1.3, 11: 1.4, 12: 1.1},
    "wheat": {1: 1.2, 2: 1.1, 3: 1.0, 4: 0.9, 5: 0.8, 6: 0.7, 7: 0.6, 8: 0.6, 9: 0.7, 10: 0.8, 11: 1.0, 12: 1.1},
    "mango": {1: 0.3, 2: 0.3, 3: 0.5, 4: 1.2, 5: 1.5, 6: 1.4, 7: 1.0, 8: 0.4, 9: 0.3, 10: 0.3, 11: 0.3, 12: 0.3},
}


def generate_demand_forecast(
    crop_name: str,
    district: str,
    historical_prices: list[dict],
    past_demand: list[dict],
    horizon_days: int = 7,
) -> list[DemandForecast]:
    """
    Generate demand forecast using Prophet if available,
    otherwise use statistical fallback with seasonality + trend.
    """
    try:
        return _prophet_forecast(crop_name, district, historical_prices, past_demand, horizon_days)
    except Exception:
        return _statistical_forecast(crop_name, district, historical_prices, past_demand, horizon_days)


def _prophet_forecast(
    crop_name: str,
    district: str,
    historical_prices: list[dict],
    past_demand: list[dict],
    horizon_days: int,
) -> list[DemandForecast]:
    """Use Facebook Prophet for time-series forecasting."""
    from prophet import Prophet
    import pandas as pd
    
    # Build training data from historical prices as demand proxy
    if not historical_prices:
        return _statistical_forecast(crop_name, district, historical_prices, past_demand, horizon_days)
    
    records = []
    for h in historical_prices:
        if h.get("date") and h.get("price_per_kg"):
            records.append({
                "ds": pd.to_datetime(h["date"]),
                "y": float(h["price_per_kg"]) * 100,  # Price as demand proxy
            })
    
    if len(records) < 10:
        return _statistical_forecast(crop_name, district, historical_prices, past_demand, horizon_days)
    
    df = pd.DataFrame(records).sort_values("ds").drop_duplicates("ds")
    
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,
    )
    model.fit(df)
    
    future = model.make_future_dataframe(periods=horizon_days)
    forecast = model.predict(future)
    
    # Compute trend for Prophet forecast
    tail_forecast = forecast.tail(horizon_days)
    if len(tail_forecast) >= 2:
        yhat_first = tail_forecast.iloc[0]["yhat"]
        yhat_last = tail_forecast.iloc[-1]["yhat"]
        trend_str = "up" if yhat_last > yhat_first * 1.05 else "down" if yhat_last < yhat_first * 0.95 else "stable"
    else:
        trend_str = "stable"
        
    results = []
    for _, row in tail_forecast.iterrows():
        pred = max(0, row["yhat"])
        lower = max(0, row["yhat_lower"])
        upper = row["yhat_upper"]
        
        results.append(DemandForecast(
            crop_name=crop_name,
            district=district,
            forecast_date=row["ds"].date(),
            predicted_demand_kg=round(pred, 1),
            confidence_lower=round(lower, 1),
            confidence_upper=round(upper, 1),
            trend=trend_str,
        ))
    
    return results


def _statistical_forecast(
    crop_name: str,
    district: str,
    historical_prices: list[dict],
    past_demand: list[dict],
    horizon_days: int,
) -> list[DemandForecast]:
    """
    Statistical fallback: seasonality × trend × festival boost × price signal.
    Good enough for hackathon demo.
    """
    today = datetime.now().date()
    crop_lower = crop_name.lower()
    seasonality = SEASONALITY.get(crop_lower, {m: 1.0 for m in range(1, 13)})
    
    # Base demand estimate from historical prices
    if historical_prices:
        avg_price = sum(h.get("price_per_kg", 20) for h in historical_prices) / len(historical_prices)
        base_demand = avg_price * 50  # rough conversion
    else:
        base_demand = 500  # default kg
    
    # Trend: simple linear from recent prices
    if len(historical_prices) >= 2:
        recent = [h.get("price_per_kg", 20) for h in historical_prices[:7]]
        older = [h.get("price_per_kg", 20) for h in historical_prices[7:14]]
        if older:
            trend = (sum(recent) / len(recent)) / (sum(older) / len(older))
        else:
            trend = 1.0
    else:
        trend = 1.0
    
    results = []
    for day_offset in range(1, horizon_days + 1):
        future_date = today + timedelta(days=day_offset)
        month = future_date.month
        
        # Seasonality factor
        season_factor = seasonality.get(month, 1.0)
        
        # Festival boost
        festival_boost = 1.2 if month in FESTIVALS and FESTIVALS[month] else 1.0
        
        # Compute predicted demand
        predicted = base_demand * season_factor * trend * festival_boost
        
        # Add some noise for realism
        noise = 1.0 + (hash(f"{crop_name}{district}{future_date}") % 20 - 10) / 100
        predicted *= noise
        
        confidence_spread = predicted * 0.15
        
        results.append(DemandForecast(
            crop_name=crop_name,
            district=district,
            forecast_date=future_date,
            predicted_demand_kg=round(max(0, predicted), 1),
            confidence_lower=round(max(0, predicted - confidence_spread), 1),
            confidence_upper=round(predicted + confidence_spread, 1),
            trend="up" if trend > 1.05 else "down" if trend < 0.95 else "stable",
        ))
    
    return results
