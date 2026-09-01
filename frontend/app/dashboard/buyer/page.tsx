'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function BuyerDashboard() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalSpent: 0,
    itemsPurchased: 0,
    avgDeliveryDays: 2.5,
    recentOrders: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, total_amount, created_at, delivery_address, order_type')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const allOrders = orders || [];
    const activeOrders = allOrders.filter(o => 
      ['pending', 'confirmed', 'aggregating', 'in_transit'].includes(o.status)
    ).length;

    const totalSpent = allOrders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + (o.total_amount || 0), 0);

    // Fetch order items count
    const orderIds = allOrders.map(o => o.id);
    let itemsCount = 0;
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('id')
        .in('order_id', orderIds);
      itemsCount = items?.length || 0;
    }

    setStats({
      activeOrders,
      totalSpent: Math.round(totalSpent),
      itemsPurchased: itemsCount,
      avgDeliveryDays: 2.5,
      recentOrders: allOrders,
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
        <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
        <p className="text-gray-500 mt-1">Track your orders and discover fresh produce</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Active Orders</div>
          <div className="text-3xl font-bold text-blue-600">{stats.activeOrders}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Spent</div>
          <div className="text-3xl font-bold text-harvest-600">₹{stats.totalSpent.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Items Purchased</div>
          <div className="text-3xl font-bold text-brand-600">{stats.itemsPurchased}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Avg. Delivery</div>
          <div className="text-3xl font-bold text-gray-700">{stats.avgDeliveryDays}d</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/marketplace" className="card hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">🔍</div>
          <div className="font-medium">Browse Produce</div>
          <div className="text-sm text-gray-500">Find fresh vegetables & grains</div>
        </Link>
        <Link href="/analytics" className="card hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="font-medium">Demand Insights</div>
          <div className="text-sm text-gray-500">See what's in demand</div>
        </Link>
        <Link href="/marketplace" className="card hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">📦</div>
          <div className="font-medium">Bulk Order</div>
          <div className="text-sm text-gray-500">Aggregated from multiple farmers</div>
        </Link>
      </div>

      {/* Recent orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <Link href="/dashboard/buyer/orders" className="text-sm text-brand-600 hover:underline">
            View all →
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No orders yet. Browse the marketplace to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Order</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                    <td className="py-3 capitalize">{order.order_type}</td>
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
