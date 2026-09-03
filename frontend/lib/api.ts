import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiOptions {
  method?: string;
  body?: any;
  token?: string;
  params?: Record<string, string | number | undefined>;
}

async function getAuthToken(): Promise<string | undefined> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

export async function api<T = any>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, params } = options;
  let token = options.token;

  if (!token) {
    token = await getAuthToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let fullPath = `${API_URL}${path}`;
  if (params) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    }
    const qStr = query.toString();
    if (qStr) fullPath += `?${qStr}`;
  }

  const res = await fetch(fullPath, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `API error: ${res.status}`);
  }

  return res.json();
}

// Upload file (for quality assessment images)
export async function apiUpload<T = any>(
  path: string,
  file: File | Blob,
  extraFields?: Record<string, string>,
): Promise<T> {
  const token = await getAuthToken();
  const formData = new FormData();
  formData.append('image', file);

  if (extraFields) {
    for (const [key, value] of Object.entries(extraFields)) {
      formData.append(key, value);
    }
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(error.detail || `Upload error: ${res.status}`);
  }

  return res.json();
}

// Typed API services
export const AgriAPI = {
  // Analytics & ML Forecasting
  getDemandForecast: (cropName: string, district: string, days: number = 14) =>
    api('/api/analytics/demand-forecast', {
      params: { crop_name: cropName, district, days },
    }),

  getPriceRecommendation: (cropName: string, district: string) =>
    api('/api/analytics/price-recommendation', {
      params: { crop_name: cropName, district },
    }),

  getImpactMetrics: () =>
    api('/api/analytics/impact'),

  // Produce Quality Vision AI
  assessQuality: (file: File | Blob, cropType: string, productId?: string) =>
    apiUpload('/api/quality/assess', file, {
      crop_type: cropType,
      ...(productId ? { product_id: productId } : {}),
    }),

  // Smart Bulk Aggregation
  planAggregation: (data: {
    crop_name: string;
    required_quantity_kg: number;
    max_radius_km?: number;
    buyer_district: string;
    buyer_state?: string;
    buyer_lat?: number;
    buyer_lng?: number;
  }) =>
    api('/api/aggregation/plan', {
      method: 'POST',
      body: data,
    }),

  executeAggregation: (data: {
    plan_id: string;
    buyer_id: string;
    delivery_address: string;
    delivery_date?: string;
    delivery_lat?: number;
    delivery_lng?: number;
  }) =>
    api('/api/aggregation/execute', {
      method: 'POST',
      body: data,
    }),

  // Logistics & Route Optimization
  optimizeRoute: (data: {
    start: { lat: number; lng: number };
    waypoints: { lat: number; lng: number }[];
    destination: { lat: number; lng: number };
  }) =>
    api('/api/logistics/optimize-route', {
      method: 'POST',
      body: data,
    }),

  getVehicles: () =>
    api('/api/logistics/vehicles'),

  getShipments: () =>
    api('/api/logistics/shipments'),

  // Trust Scores
  getTrustScore: (userId: string) =>
    api(`/api/trust/score/${userId}`),

  getMyTrustScore: () =>
    api('/api/trust/my-score'),

  getTrustLeaderboard: () =>
    api('/api/trust/leaderboard'),

  // Marketplace
  getProducts: (params?: { crop_name?: string; district?: string; grade?: string }) =>
    api('/api/marketplace/products', { params }),

  createProduct: (data: any) =>
    api('/api/marketplace/products', {
      method: 'POST',
      body: data,
    }),

  createOrder: (data: any) =>
    api('/api/marketplace/orders', {
      method: 'POST',
      body: data,
    }),
};
