'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Stats {
  activeListings: number;
  totalOrders: number;
  revenue: number;
  trustScore: number;
  recentOrders: any[];
  topCrops: { name: string; count: number; revenue: number }[];
}

export default function FarmerDashboard() {
  const [stats, setStats] = useState<Stats>({
    activeListings: 0,
    totalOrders: 0,
    revenue: 0,
    trustScore: 0,
    recentOrders: [],
    topCrops: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // Fetch active listings
    const { data: listings } = await supabase
      .from('products')
      .select('id, crop_name, unit_price, quantity_kg')
      .eq('seller_id', userId)
      .eq('status', 'active');

    // Fetch orders containing this farmer's products
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order_id, quantity_kg, price_per_kg, status')
      .eq('farmer_id', userId);

    // Get unique order IDs
    const orderIds = Array.from(new Set((orderItems || []).map((i: any) => i.order_id)));
    
    let recentOrders: any[] = [];
    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total_amount, created_at, delivery_address')
        .in('id', orderIds.slice(0, 5))
        .order('created_at', { ascending: false });
      recentOrders = orders || [];
    }

    // Fetch trust score
    const { data: trust } = await supabase
      .from('trust_scores')
      .select('score')
      .eq('user_id', userId)
      .single();

    // Calculate stats
    const activeListings = listings?.length || 0;
    const totalOrders = orderIds.length;
    const revenue = (orderItems || [])
      .filter(i => i.status === 'fulfilled')
      .reduce((sum, i) => sum + (i.quantity_kg * i.price_per_kg), 0);

    // Top crops
    const topCrops: { name: string; count: number; revenue: number }[] = [];

    setStats({
      activeListings,
      totalOrders,
      revenue: Math.round(revenue),
      trustScore: trust?.score || 0,
      recentOrders,
      topCrops,
    });
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Farmer Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your listings and track your performance</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Active Listings</div>
          <div className="text-3xl font-bold text-brand-600">{stats.activeListings}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Orders</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalOrders}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Revenue</div>
          <div className="text-3xl font-bold text-harvest-600">₹{stats.revenue.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Trust Score</div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-brand-600">{stats.trustScore.toFixed(0)}</span>
            <span className={`badge-${stats.trustScore >= 80 ? 'green' : stats.trustScore >= 60 ? 'yellow' : 'red'}`}>
              {stats.trustScore >= 80 ? 'Gold' : stats.trustScore >= 60 ? 'Silver' : stats.trustScore >= 40 ? 'Bronze' : 'New'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/marketplace" className="card hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">🌾</div>
          <div className="font-medium">Create New Listing</div>
          <div className="text-sm text-gray-500">Sell your produce</div>
        </Link>
        <Link href="/analytics" className="card hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">📈</div>
          <div className="font-medium">View Demand Forecast</div>
          <div className="text-sm text-gray-500">Plan what to grow</div>
        </Link>
        <Link href="/marketplace" className="card hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">💰</div>
          <div className="font-medium">Price Intelligence</div>
          <div className="text-sm text-gray-500">Set the right price</div>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link href="/dashboard/farmer/orders" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No orders yet. Create a listing to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Order ID</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="py-3">
                      <span className={`badge-${
                        order.status === 'delivered' ? 'green' :
                        order.status === 'cancelled' ? 'red' : 'yellow'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 font-medium">₹{order.total_amount}</td>
                    <td className="py-3 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
