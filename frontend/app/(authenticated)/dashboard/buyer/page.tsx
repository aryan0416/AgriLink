'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const SYNTHETIC = {
  activeOrders: 4,
  totalSpent: 324500,
  itemsPurchased: 18,
  avgDeliveryDays: 1.8,
  spendingTrend: [
    { month: 'Apr', spent: 42000 },
    { month: 'May', spent: 58000 },
    { month: 'Jun', spent: 47000 },
    { month: 'Jul', spent: 71000 },
    { month: 'Aug', spent: 63000 },
    { month: 'Sep', spent: 43500 },
  ],
  recentOrders: [
    { id: 'ORD-A1B2', status: 'in_transit', total_amount: 42000, order_type: 'direct', created_at: '2026-08-29', delivery_address: 'FreshMart Warehouse, Pune', crop: ' Tomato', quantity: '1,500 kg', progress: 75 },
    { id: 'ORD-C3D4', status: 'confirmed', total_amount: 25200, order_type: 'bulk', created_at: '2026-08-30', delivery_address: 'Big Bazaar DC, Nashik', crop: ' Onion', quantity: '1,200 kg', progress: 35 },
    { id: 'ORD-E5F6', status: 'delivered', total_amount: 96000, order_type: 'aggregation', created_at: '2026-08-26', delivery_address: 'Govt Depot, Jaipur', crop: ' Rice', quantity: '2,000 kg', progress: 100 },
    { id: 'ORD-G7H8', status: 'pending', total_amount: 13600, order_type: 'direct', created_at: '2026-09-01', delivery_address: 'Metro Cash & Carry, Indore', crop: ' Potato', quantity: '800 kg', progress: 10 },
    { id: 'ORD-I9J0', status: 'delivered', total_amount: 10500, order_type: 'direct', created_at: '2026-08-24', delivery_address: 'Star Hotel, Pune', crop: ' Tomato', quantity: '350 kg', progress: 100 },
    { id: 'ORD-K1L2', status: 'confirmed', total_amount: 21000, order_type: 'direct', created_at: '2026-09-01', delivery_address: 'Reliance Fresh, Mumbai', crop: ' Onion', quantity: '1,000 kg', progress: 40 },
  ],
  quickReorder: [
    { crop: ' Tomato', lastQty: '500 kg', lastPrice: '₹28/kg' },
    { crop: ' Onion', lastQty: '1,000 kg', lastPrice: '₹21/kg' },
    { crop: ' Potato', lastQty: '800 kg', lastPrice: '₹17/kg' },
  ],
};

const statusConfig: Record<string, { label: string; badge: string; color: string }> = {
  pending: { label: 'Pending', badge: 'badge-yellow', color: 'bg-yellow-500' },
  confirmed: { label: 'Confirmed', badge: 'badge-blue', color: 'bg-blue-500' },
  aggregating: { label: 'Aggregating', badge: 'badge-purple', color: 'bg-violet-500' },
  in_transit: { label: 'In Transit', badge: 'badge-blue', color: 'bg-sky-500' },
  delivered: { label: 'Delivered', badge: 'badge-green', color: 'bg-green-500' },
  cancelled: { label: 'Cancelled', badge: 'badge-red', color: 'bg-rose-500' },
};

function StatBox({ label, value, sub, color, delay = 0 }: { label: string; value: string; sub: string; color: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), delay); }, [delay]);
  return (
    <div className={`glass-card p-5 border-l-4 ${color} transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-2xl sm:text-3xl font-black text-emerald-950">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{sub}</div>
    </div>
  );
}

export default function BuyerDashboard() {
  const [stats, setStats] = useState(SYNTHETIC);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const userId = session.user.id;
    const { data: orders } = await supabase.from('orders').select('id, status, total_amount, created_at, delivery_address, order_type').eq('buyer_id', userId).order('created_at', { ascending: false }).limit(10);

    if (orders && orders.length > 0) {
      const allOrders = orders;
      const activeOrders = allOrders.filter((o) => ['pending', 'confirmed', 'aggregating', 'in_transit'].includes(o.status)).length;
      const totalSpent = allOrders.filter((o) => o.status === 'delivered').reduce((sum, o) => sum + (o.total_amount || 0), 0);
      setStats({ ...SYNTHETIC, activeOrders, totalSpent: Math.round(totalSpent), recentOrders: allOrders.map(o => ({ ...o, progress: o.status === 'delivered' ? 100 : 50, crop: ' Produce', quantity: 'N/A' })) });
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="glass-panel h-32 animate-shimmer rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[1,2,3,4].map((i) => <div key={i} className="h-28 animate-shimmer rounded-2xl" />)}</div>
        <div className="h-64 animate-shimmer rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge-yellow">Buyer Portal</span>
            <span className="badge-blue">Premium Buyer</span>
          </div>
          <p className="text-sm text-emerald-900/55 mb-1">{greeting}!</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950">Buyer Command Center</h1>
          <p className="text-sm text-emerald-900/65 mt-1 hidden sm:block">Track orders, discover produce, and manage your supply pipeline.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/marketplace" className="btn-primary text-sm px-5 py-2.5"> Browse Produce</Link>
          <Link href="/analytics" className="btn-secondary text-sm px-5 py-2.5"> Price Intel</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Active Orders" value={String(stats.activeOrders)} sub="In progress" color="border-l-blue-600" delay={0} />
        <StatBox label="Total Spent" value={`₹${(stats.totalSpent / 1000).toFixed(0)}K`} sub="This season" color="border-l-amber-500" delay={100} />
        <StatBox label="Items Purchased" value={String(stats.itemsPurchased)} sub="Unique crop lots" color="border-l-green-600" delay={200} />
        <StatBox label="Avg. Delivery" value={`${stats.avgDeliveryDays} days`} sub="Farm to door" color="border-l-teal-600" delay={300} />
      </div>

      {/* Spending Chart + Quick Reorder */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass-card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-emerald-950">Spending Trend</h2>
              <p className="text-xs text-gray-400">Monthly procurement value</p>
            </div>
            <span className="badge-blue text-xs">6-month view</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Spent']} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(20,83,45,0.12)', fontSize: '12px', background: 'rgba(255,255,255,0.95)' }} />
              <Line type="monotone" dataKey="spent" stroke="#d97706" strokeWidth={2.5} dot={{ fill: '#d97706', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 glass-card p-6 animate-fade-in-up">
          <h2 className="font-bold text-emerald-950 mb-4">Quick Reorder</h2>
          <div className="space-y-3">
            {stats.quickReorder.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-emerald-900/8 group hover:border-green-200 transition-colors">
                <div>
                  <div className="font-semibold text-sm text-emerald-950">{r.crop}</div>
                  <div className="text-xs text-gray-400">{r.lastQty} • {r.lastPrice}</div>
                </div>
                <Link href="/marketplace" className="btn-primary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">Reorder →</Link>
              </div>
            ))}
          </div>
          <Link href="/marketplace" className="btn-secondary w-full mt-4 text-sm py-2.5 block text-center">Browse All Produce →</Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5 border-b pb-4 border-emerald-900/8">
          <div>
            <h2 className="font-bold text-emerald-950">Recent Orders</h2>
            <p className="text-xs text-gray-400">Track your procurement pipeline</p>
          </div>
          <Link href="/dashboard/buyer/orders" className="text-xs font-bold text-green-700 hover:underline">View All →</Link>
        </div>

        <div className="space-y-4">
          {stats.recentOrders.slice(0, 5).map((o: any) => {
            const sc = statusConfig[o.status] || statusConfig.pending;
            return (
              <div key={o.id} className="p-4 rounded-xl bg-white/60 border border-emerald-900/8 hover:border-green-200 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400 font-medium">Order ID</div>
                      <div className="font-bold font-mono text-emerald-950">{o.id.slice(0, 10)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 font-medium">Crop</div>
                      <div className="font-semibold text-emerald-950">{o.crop}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 font-medium">Amount</div>
                      <div className="font-extrabold text-amber-700">₹{o.total_amount?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 font-medium">Status</div>
                      <span className={sc.badge}>{sc.label}</span>
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                    <span>Order Progress</span>
                    <span>{o.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${sc.color}`}
                      style={{ width: `${o.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
