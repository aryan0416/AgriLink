'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Forecast {
  forecast_date: string;
  predicted_demand_kg: number;
  confidence_lower: number;
  confidence_upper: number;
}

interface PriceRec {
  market_reference: number;
  recommended_min: number;
  recommended_max: number;
  demand_signal: string;
  supply_factor: number;
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'forecast' | 'prices' | 'impact'>('forecast');
  const [cropName, setCropName] = useState('Tomato');
  const [district, setDistrict] = useState('Pune');
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [priceRec, setPriceRec] = useState<PriceRec | null>(null);
  const [loading, setLoading] = useState(false);
  const [impactStats, setImpactStats] = useState({
    totalFarmers: 0,
    totalOrders: 0,
    fulfillmentRate: 0,
    avgPrice: 0,
  });

  const crops = ['Tomato', 'Onion', 'Potato', 'Rice', 'Wheat', 'Mango'];
  const districts = ['Pune', 'Nashik', 'Indore', 'Jaipur', 'Hyderabad'];

  async function loadForecast() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch market prices for the crop/district
      const { data: prices } = await supabase
        .from('market_prices')
        .select('*')
        .ilike('crop_name', `%${cropName}%`)
        .eq('district', district)
        .order('date', { ascending: false })
        .limit(30);

      // Fetch past demand forecasts
      const { data: pastDemand } = await supabase
        .from('demand_forecasts')
        .select('*')
        .ilike('crop_name', `%${cropName}%`)
        .eq('district', district)
        .order('forecast_date', { ascending: false })
        .limit(30);

      // Generate client-side forecast (simplified)
      const today = new Date();
      const seasonality: Record<string, number[]> = {
        tomato: [0.8, 0.85, 0.9, 1.0, 1.1, 0.7, 0.6, 0.7, 0.9, 1.0, 1.1, 1.2],
        onion: [0.9, 0.8, 0.7, 0.8, 1.0, 1.1, 1.2, 1.1, 1.0, 1.2, 1.3, 1.0],
        potato: [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.6, 0.8, 1.0, 1.2, 1.3],
        rice: [0.9, 0.85, 0.8, 0.9, 1.0, 0.7, 0.8, 0.9, 1.1, 1.3, 1.4, 1.1],
        wheat: [1.2, 1.1, 1.0, 0.9, 0.8, 0.7, 0.6, 0.6, 0.7, 0.8, 1.0, 1.1],
        mango: [0.3, 0.3, 0.5, 1.2, 1.5, 1.4, 1.0, 0.4, 0.3, 0.3, 0.3, 0.3],
      };

      const avgPrice = prices?.length
        ? prices.reduce((s, p) => s + p.price_per_kg, 0) / prices.length
        : 25;
      
      const baseDemand = avgPrice * 40;
      const season = seasonality[cropName.toLowerCase()] || Array(12).fill(1);
      const horizons = 14;

      const forecasts: Forecast[] = [];
      for (let i = 1; i <= horizons; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + i);
        const month = futureDate.getMonth();
        const seasonFactor = season[month] || 1;
        const noise = 0.9 + (Math.abs(Math.sin(i * 7 + cropName.length)) * 0.2);
        const predicted = baseDemand * seasonFactor * noise;
        const spread = predicted * 0.15;

        forecasts.push({
          forecast_date: futureDate.toISOString().split('T')[0],
          predicted_demand_kg: Math.round(predicted),
          confidence_lower: Math.round(Math.max(0, predicted - spread)),
          confidence_upper: Math.round(predicted + spread),
        });
      }

      setForecast(forecasts);

      // Also fetch from DB if available
      if (pastDemand && pastDemand.length > 0) {
        setForecast(prev => [...pastDemand.slice(0, 14).reverse(), ...prev.filter(f => 
          !pastDemand.some(p => p.forecast_date === f.forecast_date)
        )]);
      }
    } catch (err) {
      console.error('Forecast error:', err);
    }
    setLoading(false);
  }

  async function loadPriceRecommendation() {
    setLoading(true);
    try {
      const { data: prices } = await supabase
        .from('market_prices')
        .select('*')
        .ilike('crop_name', `%${cropName}%`)
        .eq('district', district)
        .order('date', { ascending: false })
        .limit(30);

      const { data: supply } = await supabase
        .from('products')
        .select('quantity_kg, unit_price')
        .ilike('crop_name', `%${cropName}%`)
        .eq('district', district)
        .eq('status', 'active');

      const avgPrice = prices?.length
        ? prices.reduce((s, p) => s + p.price_per_kg, 0) / prices.length
        : 25;

      const supplyCount = supply?.length || 0;
      let supplyFactor = 1.0;
      if (supplyCount > 20) supplyFactor = 0.92;
      else if (supplyCount > 10) supplyFactor = 0.96;
      else if (supplyCount < 3) supplyFactor = 1.12;
      else if (supplyCount < 5) supplyFactor = 1.05;

      const demandSignal = avgPrice > 30 ? 'high' : avgPrice < 18 ? 'low' : 'medium';
      const demandMult = demandSignal === 'high' ? 1.15 : demandSignal === 'low' ? 0.90 : 1.0;

      const rec = avgPrice * demandMult * supplyFactor;
      setPriceRec({
        market_reference: Math.round(avgPrice * 100) / 100,
        recommended_min: Math.round(rec * 0.95 * 100) / 100,
        recommended_max: Math.round(rec * 1.10 * 100) / 100,
        demand_signal: demandSignal,
        supply_factor: Math.round(supplyFactor * 1000) / 1000,
      });
    } catch (err) {
      console.error('Price rec error:', err);
    }
    setLoading(false);
  }

  async function loadImpactStats() {
    const farmers = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'farmer');
    const orders = await supabase.from('orders').select('status, total_amount');
    const allOrders = orders.data || [];
    const delivered = allOrders.filter(o => o.status === 'delivered');
    
    const listings = await supabase.from('market_prices').select('price_per_kg');
    const avgPrice = listings.data?.length
      ? listings.data.reduce((s, l) => s + l.price_per_kg, 0) / listings.data.length
      : 0;

    setImpactStats({
      totalFarmers: farmers.count || 0,
      totalOrders: allOrders.length,
      fulfillmentRate: allOrders.length > 0 ? Math.round((delivered.length / allOrders.length) * 100) : 0,
      avgPrice: Math.round(avgPrice * 100) / 100,
    });
  }

  useEffect(() => {
    if (activeTab === 'forecast') loadForecast();
    else if (activeTab === 'prices') loadPriceRecommendation();
    else loadImpactStats();
  }, [activeTab, cropName, district]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Intelligence</h1>
        <p className="text-gray-500">AI-powered demand forecasting and price intelligence</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'forecast', label: '📈 Demand Forecast' },
          { key: 'prices', label: '💰 Price Intelligence' },
          { key: 'impact', label: '🎯 Impact Dashboard' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select className="input-field w-48" value={cropName} onChange={(e) => setCropName(e.target.value)}>
          {crops.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-field w-48" value={district} onChange={(e) => setDistrict(e.target.value)}>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading analytics...</div>
      ) : (
        <>
          {/* Demand Forecast */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-2">
                  14-Day Demand Forecast: {cropName} in {district}
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Based on historical prices, seasonality, and regional patterns
                </p>
                
                {forecast.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="flex gap-1 items-end h-48 min-w-[600px]">
                      {forecast.map((f, i) => {
                        const maxVal = Math.max(...forecast.map(x => x.confidence_upper));
                        const height = (f.predicted_demand_kg / maxVal) * 100;
                        const lowerHeight = (f.confidence_lower / maxVal) * 100;
                        
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="text-xs text-gray-500">
                              {Math.round(f.predicted_demand_kg)}
                            </div>
                            <div
                              className="w-full bg-brand-200 rounded-t relative"
                              style={{ height: `${height}%`, minHeight: '4px' }}
                            >
                              <div
                                className="absolute inset-0 bg-brand-500 rounded-t opacity-60"
                                style={{ height: `${(f.predicted_demand_kg / f.confidence_upper) * 100}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-400" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '40px' }}>
                              {new Date(f.forecast_date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">No forecast data available</div>
                )}
              </div>

              {/* Trend summary */}
              {forecast.length >= 2 && (
                <div className="card">
                  <h3 className="font-semibold mb-2">Trend Summary</h3>
                  {(() => {
                    const firstHalf = forecast.slice(0, 7).reduce((s, f) => s + f.predicted_demand_kg, 0);
                    const secondHalf = forecast.slice(7).reduce((s, f) => s + f.predicted_demand_kg, 0);
                    const change = ((secondHalf - firstHalf) / firstHalf) * 100;
                    const trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
                    return (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'}
                        </span>
                        <div>
                          <div className="font-medium">
                            Demand is projected to {trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'remain stable'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {change > 0 ? '+' : ''}{change.toFixed(1)}% change over the forecast period
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Price Intelligence */}
          {activeTab === 'prices' && (
            <div className="space-y-6">
              {priceRec ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card text-center">
                      <div className="text-sm text-gray-500 mb-1">Market Reference</div>
                      <div className="text-3xl font-bold text-gray-700">₹{priceRec.market_reference}/kg</div>
                      <div className="text-xs text-gray-400 mt-1">Average of recent market prices</div>
                    </div>
                    <div className="card text-center border-2 border-brand-500">
                      <div className="text-sm text-gray-500 mb-1">AI Recommended Price</div>
                      <div className="text-3xl font-bold text-brand-600">
                        ₹{priceRec.recommended_min} — ₹{priceRec.recommended_max}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Optimal selling range</div>
                    </div>
                    <div className="card text-center">
                      <div className="text-sm text-gray-500 mb-1">Demand Signal</div>
                      <div className="text-3xl">
                        {priceRec.demand_signal === 'high' ? '🔥' : priceRec.demand_signal === 'low' ? '❄️' : '📊'}
                      </div>
                      <div className={`badge-${priceRec.demand_signal === 'high' ? 'green' : priceRec.demand_signal === 'low' ? 'red' : 'yellow'}`}>
                        {priceRec.demand_signal.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <h3 className="font-semibold mb-3">Pricing Factors</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Market Reference</span>
                        <span className="font-medium">₹{priceRec.market_reference}/kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Supply Factor</span>
                        <span className={`font-medium ${priceRec.supply_factor > 1 ? 'text-green-600' : priceRec.supply_factor < 1 ? 'text-red-600' : ''}`}>
                          {priceRec.supply_factor > 1 ? '+' : ''}{((priceRec.supply_factor - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Demand Multiplier</span>
                        <span className={`font-medium ${priceRec.demand_signal === 'high' ? 'text-green-600' : priceRec.demand_signal === 'low' ? 'text-red-600' : ''}`}>
                          {priceRec.demand_signal === 'high' ? '+15%' : priceRec.demand_signal === 'low' ? '-10%' : '0%'}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">No price data available</div>
              )}
            </div>
          )}

          {/* Impact Dashboard */}
          {activeTab === 'impact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card text-center">
                  <div className="text-3xl mb-2">👨‍🌾</div>
                  <div className="text-2xl font-bold text-brand-600">{impactStats.totalFarmers}</div>
                  <div className="text-sm text-gray-500">Registered Farmers</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-2xl font-bold text-blue-600">{impactStats.totalOrders}</div>
                  <div className="text-sm text-gray-500">Total Orders</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-2xl font-bold text-green-600">{impactStats.fulfillmentRate}%</div>
                  <div className="text-sm text-gray-500">Fulfillment Rate</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl mb-2">💰</div>
                  <div className="text-2xl font-bold text-harvest-600">₹{impactStats.avgPrice}</div>
                  <div className="text-sm text-gray-500">Avg Market Price/kg</div>
                </div>
              </div>

              {/* Impact targets */}
              <div className="card bg-gradient-to-br from-brand-50 to-harvest-50">
                <h2 className="text-lg font-semibold mb-4">Expected Impact Targets</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-white rounded-xl">
                    <div className="text-3xl font-bold text-brand-600">20-40%</div>
                    <div className="text-sm text-gray-600 mt-1">Farmer Income Improvement</div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: '30%' }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">30% estimated (midpoint)</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl">
                    <div className="text-3xl font-bold text-harvest-600">15-25%</div>
                    <div className="text-sm text-gray-600 mt-1">Logistics Cost Reduction</div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-harvest-500 rounded-full" style={{ width: '20%' }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">20% estimated (midpoint)</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl">
                    <div className="text-3xl font-bold text-red-500">30-50%</div>
                    <div className="text-sm text-gray-600 mt-1">Wastage Reduction</div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400 rounded-full" style={{ width: '40%' }} />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">40% estimated (midpoint)</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
