"""
Route Optimization Service

Uses OSRM (Open Source Routing Machine) for route calculation
with nearest-neighbor heuristic for multi-pickup sequencing.

Targets: lower transport cost, shorter delivery time, reduced unnecessary travel.
"""

import httpx
import math
from typing import Optional
from app.models.logistics import PickupPoint, RouteInfo
from app.config import get_settings

settings = get_settings()


async def optimize_route(
    pickup_points: list[PickupPoint],
    delivery_lat: float = 0,
    delivery_lng: float = 0,
) -> RouteInfo:
    """
    Optimize pickup sequence using nearest-neighbor heuristic,
    then calculate total route using OSRM.
    """
    if not pickup_points:
        return RouteInfo(distance_km=0, duration_minutes=0, waypoints=[])
    
    # 1. Sort pickup points using nearest-neighbor from first point
    ordered_points = _nearest_neighbor_order(pickup_points)
    
    # 2. Build OSRM route query
    # Format: lng,lat;lng,lat;...
    coords = []
    for p in ordered_points:
        coords.append(f"{p.longitude},{p.latitude}")
    
    if delivery_lat and delivery_lng:
        coords.append(f"{delivery_lng},{delivery_lat}")
    
    coords_str = ";".join(coords)
    
    # 3. Query OSRM
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = f"{settings.OSRM_BASE_URL}/route/v1/driving/{coords_str}"
            params = {
                "overview": "full",
                "geometries": "geojson",
                "steps": "true",
            }
            response = await client.get(url, params=params)
            data = response.json()
        
        if data.get("code") == "Ok" and data.get("routes"):
            route = data["routes"][0]
            
            return RouteInfo(
                distance_km=round(route["distance"] / 1000, 2),
                duration_minutes=round(route["duration"] / 60, 1),
                waypoints=_extract_waypoints(route),
            )
    except Exception:
        pass
    
    # 4. Fallback: estimate using Haversine distances
    return _estimate_route_fallback(ordered_points, delivery_lat, delivery_lng)


def _nearest_neighbor_order(points: list[PickupPoint]) -> list[PickupPoint]:
    """Order pickup points using nearest-neighbor heuristic."""
    if len(points) <= 1:
        return list(points)
    
    remaining = list(points)
    ordered = [remaining.pop(0)]
    
    while remaining:
        current = ordered[-1]
        nearest_idx = min(
            range(len(remaining)),
            key=lambda i: _haversine(
                current.latitude, current.longitude,
                remaining[i].latitude, remaining[i].longitude,
            ),
        )
        ordered.append(remaining.pop(nearest_idx))
    
    return ordered


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in kilometers."""
    R = 6371  # Earth's radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def _estimate_route_fallback(
    points: list[PickupPoint],
    delivery_lat: float,
    delivery_lng: float,
) -> RouteInfo:
    """Estimate route when OSRM is unavailable."""
    total_distance = 0
    
    for i in range(len(points) - 1):
        total_distance += _haversine(
            points[i].latitude, points[i].longitude,
            points[i + 1].latitude, points[i + 1].longitude,
        )
    
    # Add last pickup to delivery
    if delivery_lat and delivery_lng and points:
        total_distance += _haversine(
            points[-1].latitude, points[-1].longitude,
            delivery_lat, delivery_lng,
        )
    
    # Rough speed estimate: 40 km/h average (Indian roads)
    duration_hours = total_distance / 40.0
    
    return RouteInfo(
        distance_km=round(total_distance, 2),
        duration_minutes=round(duration_hours * 60, 1),
        waypoints=[],
    )


def _extract_waypoints(route: dict) -> list[dict]:
    """Extract waypoint data from OSRM response."""
    waypoints = []
    
    if "legs" in route:
        for leg in route["legs"]:
            waypoints.append({
                "distance_km": round(leg.get("distance", 0) / 1000, 2),
                "duration_min": round(leg.get("duration", 0) / 60, 1),
            })
    
    return waypoints
