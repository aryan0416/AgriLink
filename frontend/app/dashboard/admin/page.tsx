'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalBuyers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    fulfillmentRate: 0,
    activeListings: 0,
    totalShipments: 0,
    avgTrustScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    // Count users by role
    const farmers = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'farmer');
    const fpos = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'fpo');
    const buyers = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'buyer');
    const consumers = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'consumer');

    // Count orders
    const orders = await supabase.from('orders').select('total_amount, status');
    const allOrders = orders.data || [];
    const delivered = allOrders.filter(o => o.status === 'delivered');
    const revenue = delivered.reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Listings
    const listings = await supabase.from('products').select('id', { count: 'exact' }).eq('status', 'active');

    // Shipments
    const shipments = await supabase.from('shipments').select('id', { count: 'exact' });

    // Trust scores
    const trustScores = await supabase.from('trust_scores').select('score');
    const avgTrust = trustScores.data?.length
      ? trustScores.data.reduce((sum, t) => sum + (t.score || 0), 0) / trustScores.data.length
      : 0;

    setStats({
      totalFarmers: (farmers.count || 0) + (fpos.count || 0),
      totalBuyers: (buyers.count || 0) + (consumers.count || 0),
      totalOrders: allOrders.length,
      totalRevenue: Math.round(revenue),
      fulfillmentRate: allOrders.length > 0 ? Math.round((delivered.length / allOrders.length) * 100) : 0,
      activeListings: listings.count || 0,
      totalShipments: shipments.count || 0,
      avgTrustScore: Math.round(avgTrust),
    });
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Platform-wide metrics and impact overview</p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card border-l-4 border-l-brand-500">
          <div className="text-sm text-gray-500 mb-1">Total Farmers</div>
          <div className="text-3xl font-bold text-brand-600">{stats.totalFarmers}</div>
        </div>
        <div className="card border-l-4 border-l-harvest-500">
          <div className="text-sm text-gray-500 mb-1">Total Buyers</div>
          <div className="text-3xl font-bold text-harvest-600">{stats.totalBuyers}</div>
        </div>
        <div className="card border-l-4 border-l-blue-500">
          <div className="text-sm text-gray-500 mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalOrders}</div>
        </div>
        <div className="card border-l-4 border-l-purple-500">
          <div className="text-sm text-gray-500 mb-1">Total Revenue</div>
          <div className="text-3xl font-bold text-purple-600">₹{stats.totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-1">Fulfillment Rate</div>
          <div className="text-2xl font-bold text-green-600">{stats.fulfillmentRate}%</div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-1">Active Listings</div>
          <div className="text-2xl font-bold text-brand-600">{stats.activeListings}</div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-1">Total Shipments</div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalShipments}</div>
        </div>
        <div className="card text-center">
          <div className="text-sm text-gray-500 mb-1">Avg Trust Score</div>
          <div className="text-2xl font-bold text-harvest-600">{stats.avgTrustScore}/100</div>
        </div>
      </div>

      {/* Impact summary */}
      <div className="card bg-gradient-to-br from-brand-50 to-harvest-50">
        <h2 className="text-lg font-semibold mb-4">Platform Impact (Estimated)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-brand-600">20-40%</div>
            <div className="text-sm text-gray-600 mt-1">Farmer Income Improvement Target</div>
            <div className="text-xs text-gray-400">Based on direct market access</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-harvest-600">15-25%</div>
            <div className="text-sm text-gray-600 mt-1">Logistics Cost Reduction Target</div>
            <div className="text-xs text-gray-400">Via route optimization & shared transport</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">30-50%</div>
            <div className="text-sm text-gray-600 mt-1">Wastage Reduction Target</div>
            <div className="text-xs text-gray-400">Through demand-supply matching</div>
          </div>
        </div>
      </div>
    </div>
  );
}
