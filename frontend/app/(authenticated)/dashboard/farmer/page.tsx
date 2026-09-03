'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Check, CheckCircle2 } from 'lucide-react';

// ── Synthetic / Fallback Data ──────────────────────
const SYNTHETIC_STATS = {
  activeListings: 7,
  totalOrders: 24,
  revenue: 186400,
  trustScore: 92,
  weeklyRevenue: [
    { day: 'Mon', revenue: 18200 },
    { day: 'Tue', revenue: 24500 },
    { day: 'Wed', revenue: 31200 },
    { day: 'Thu', revenue: 19800 },
    { day: 'Fri', revenue: 42100 },
    { day: 'Sat', revenue: 28600 },
    { day: 'Sun', revenue: 22000 },
  ],
  recentOrders: [
    { id: 'ord-a1b2', crop: 'Tomato', quantity_kg: 500, price_per_kg: 28, delivery_address: 'FreshMart, Pune', item_status: 'accepted', item_id: '1', total_amount: 14000 },
    { id: 'ord-c3d4', crop: 'Onion', quantity_kg: 1200, price_per_kg: 21, delivery_address: 'Big Bazaar, Nashik', item_status: 'pending', item_id: '2', total_amount: 25200 },
    { id: 'ord-e5f6', crop: 'Potato', quantity_kg: 800, price_per_kg: 17, delivery_address: 'Metro Cash, Indore', item_status: 'fulfilled', item_id: '3', total_amount: 13600 },
    { id: 'ord-g7h8', crop: 'Rice', quantity_kg: 2000, price_per_kg: 48, delivery_address: 'Govt Depot, Jaipur', item_status: 'fulfilled', item_id: '4', total_amount: 96000 },
    { id: 'ord-i9j0', crop: 'Tomato', quantity_kg: 350, price_per_kg: 30, delivery_address: 'Star Hotel, Pune', item_status: 'pending', item_id: '5', total_amount: 10500 },
  ],
  myListings: [
    { id: '1', crop_name: 'Tomato', grade: 'A', quantity_kg: 2000, unit_price: 28, district: 'Nashik', status: 'active', freshness: 94 },
    { id: '2', crop_name: 'Onion', grade: 'B', quantity_kg: 5000, unit_price: 19, district: 'Pune', status: 'active', freshness: 87 },
    { id: '3', crop_name: 'Potato', grade: 'A', quantity_kg: 1500, unit_price: 16, district: 'Indore', status: 'active', freshness: 91 },
    { id: '4', crop_name: 'Rice', grade: 'A', quantity_kg: 3000, unit_price: 46, district: 'Nashik', status: 'sold', freshness: 99 },
  ],
  advisories: [
    { icon: '️', title: 'Rain Alert', desc: 'Light rain expected in Nashik on Thu–Fri. Consider early harvest for Tomatoes.', type: 'warning' },
    { icon: '', title: 'Demand Surge', desc: 'Onion demand up 35% in Pune metro due to festival season. Optimal sell window: next 5 days.', type: 'positive' },
    { icon: '', title: 'Trust Milestone', desc: 'Your AgriTrust rating reached Gold Tier! 15% premium visibility on marketplace.', type: 'success' },
  ],
};

interface Stats {
  activeListings: number;
  totalOrders: number;
  revenue: number;
  trustScore: number;
  weeklyRevenue: { day: string; revenue: number }[];
  recentOrders: any[];
  myListings: any[];
  advisories: { icon: string; title: string; desc: string; type: string }[];
}

function StatBox({ label, value, sub, color, delay = 0 }: { label: string; value: string | number; sub: string; color: string; delay?: number }) {
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

const statusBadge: Record<string, string> = {
  pending: 'badge-yellow',
  accepted: 'badge-blue',
  fulfilled: 'badge-green',
  rejected: 'badge-red',
};

const CROP_ICONS: Record<string, string> = { tomato: '', onion: '', potato: '', rice: '', wheat: '', default: '' };

export default function FarmerDashboard() {
  const [stats, setStats] = useState<Stats>(SYNTHETIC_STATS);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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
    const { data: listings } = await supabase.from('products').select('*').eq('seller_id', userId).order('created_at', { ascending: false });
    const { data: orderItems } = await supabase.from('order_items').select('id, order_id, quantity_kg, price_per_kg, status, product_id, orders!inner(id, status, total_amount, created_at, delivery_address)').eq('farmer_id', userId);
    const { data: trust } = await supabase.from('trust_scores').select('score').eq('user_id', userId).single();

    const orderMap = new Map();
    (orderItems || []).forEach((item: any) => {
      const orderId = item.orders?.id;
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, { ...item.orders, item_id: item.id, quantity_kg: item.quantity_kg, price_per_kg: item.price_per_kg, item_status: item.status });
      }
    });
    const recentOrders = Array.from(orderMap.values());
    const revenue = (orderItems || []).filter((i: any) => i.status === 'fulfilled').reduce((sum: number, i: any) => sum + i.quantity_kg * i.price_per_kg, 0);

    // Use real data if available, otherwise keep synthetic
    if ((listings && listings.length > 0) || recentOrders.length > 0) {
      setStats({
        ...SYNTHETIC_STATS,
        activeListings: (listings || []).filter((l) => l.status === 'active').length || SYNTHETIC_STATS.activeListings,
        totalOrders: recentOrders.length || SYNTHETIC_STATS.totalOrders,
        revenue: Math.round(revenue) || SYNTHETIC_STATS.revenue,
        trustScore: trust?.score || SYNTHETIC_STATS.trustScore,
        recentOrders: recentOrders.length > 0 ? recentOrders.slice(0, 5) : SYNTHETIC_STATS.recentOrders,
        myListings: listings && listings.length > 0 ? listings.slice(0, 4) : SYNTHETIC_STATS.myListings,
      });
    }
    setLoading(false);
  }

  async function handleUpdateItemStatus(itemId: string, newStatus: string) {
    setActionLoading(itemId);

    // Optimistic UI update
    setStats((prev) => ({
      ...prev,
      recentOrders: prev.recentOrders.map((o) =>
        o.item_id === itemId ? { ...o, item_status: newStatus } : o
      ),
    }));

    // If it's a synthetic item (id is small like '1'), skip backend update
    if (!itemId || itemId.length < 10) {
      setActionLoading(null);
      return;
    }

    try {
      await supabase.from('order_items').update({ status: newStatus }).eq('id', itemId);
      await loadDashboard();
    } catch (e) {
      console.error(e);
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="glass-panel h-32 animate-shimmer rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-shimmer rounded-2xl" />)}
        </div>
        <div className="h-64 animate-shimmer rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ──────────────────────────────── */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="badge-organic"> Producer Hub</span>
            <span className="badge-gold"> Gold Tier</span>
          </div>
          <p className="text-sm text-emerald-900/55 mb-1">{greeting}, Farmer!</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">Farmer Command Hub</h1>
          <p className="text-sm text-emerald-900/65 mt-1 hidden sm:block">Monitor demand, manage orders, and maximize your harvest revenues.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/marketplace" className="btn-primary text-sm px-5 py-2.5">+ List Produce</Link>
          <Link href="/analytics" className="btn-secondary text-sm px-5 py-2.5"> Demand ML</Link>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Active Harvest Lots" value={stats.activeListings} sub="Live in marketplace" color="border-l-green-600" delay={0} />
        <StatBox label="Total Orders" value={stats.totalOrders} sub="Direct buyer commitments" color="border-l-blue-600" delay={100} />
        <StatBox label="Fulfilled Revenue" value={`₹${(stats.revenue / 1000).toFixed(0)}K`} sub="100% direct payouts" color="border-l-amber-500" delay={200} />
        <StatBox label="AgriTrust Score" value={`${Math.round(stats.trustScore)}/100`} sub="Top 5% regional supplier" color="border-l-emerald-600" delay={300} />
      </div>

      {/* ── Revenue Chart + Advisories ──────────── */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="lg:col-span-3 glass-card p-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-emerald-950">Weekly Revenue</h2>
              <p className="text-xs text-gray-400">Last 7 days earnings</p>
            </div>
            <span className="badge-green text-xs">+18% vs last week</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.weeklyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(20,83,45,0.12)', fontSize: '12px', background: 'rgba(255,255,255,0.95)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Advisories */}
        <div className="lg:col-span-2 space-y-3">
          <div className="text-sm font-bold text-emerald-950 px-1">AI Advisories</div>
          {stats.advisories.map((a, i) => (
            <div key={i} className={`glass-card p-4 border-l-4 animate-fade-in-up ${a.type === 'warning' ? 'border-l-amber-400' : a.type === 'positive' ? 'border-l-blue-500' : 'border-l-green-500'}`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{a.icon}</span>
                <div>
                  <div className="text-xs font-bold text-emerald-950">{a.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Tools ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/marketplace', icon: '', title: 'List Fresh Produce', desc: 'Post crop lots with AI grading', color: 'hover:border-green-300' },
          { href: '/analytics', icon: '', title: 'Demand Forecasting', desc: 'Check 14-day consumption projection', color: 'hover:border-blue-300' },
          { href: '/analytics', icon: '', title: 'Price Intelligence', desc: 'AI optimal direct market margins', color: 'hover:border-amber-300' },
        ].map((tool, i) => (
          <Link key={i} href={tool.href} className={`glass-card-hover p-5 text-center group block ${tool.color}`}>
            <span className="text-3xl group-hover:scale-110 transition-transform inline-block">{tool.icon}</span>
            <div className="font-bold text-emerald-950 text-sm mt-2">{tool.title}</div>
            <p className="text-xs text-gray-500 mt-1">{tool.desc}</p>
          </Link>
        ))}
      </div>

      {/* ── My Listings ───────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-emerald-950">Active Listings</h2>
            <p className="text-xs text-gray-400">Your current produce in marketplace</p>
          </div>
          <Link href="/dashboard/farmer/listings" className="text-xs font-bold text-green-700 hover:underline">View All →</Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {stats.myListings.map((listing: any, i: number) => {
            const icon = CROP_ICONS[(listing.crop_name || '').toLowerCase()] || CROP_ICONS.default;
            return (
              <div key={listing.id || i} className="flex items-center gap-4 p-4 rounded-xl bg-white/60 border border-emerald-900/8 hover:border-green-300 transition-colors group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-2xl shrink-0 border border-green-200/60 group-hover:scale-105 transition-transform">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-emerald-950 truncate">{listing.crop_name}</div>
                  <div className="text-xs text-gray-500">{listing.quantity_kg?.toLocaleString()} kg • Grade {listing.grade} • ₹{listing.unit_price}/kg</div>
                  {listing.freshness && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: `${listing.freshness}%` }} />
                      </div>
                      <span className="text-[10px] text-green-700 font-bold">{listing.freshness}% Fresh</span>
                    </div>
                  )}
                </div>
                <span className={listing.status === 'active' ? 'badge-green' : 'badge-silver'}>
                  {listing.status === 'active' ? '● Live' : ' Sold'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Incoming Orders ──────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5 border-b pb-4 border-emerald-900/8">
          <div>
            <h2 className="font-bold text-emerald-950">Incoming Buyer Orders</h2>
            <p className="text-xs text-gray-400">Manage acceptance and dispatch</p>
          </div>
          <Link href="/dashboard/farmer/orders" className="text-xs font-bold text-green-700 hover:underline">View All →</Link>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3"></div>
            <p className="text-sm">No orders yet. Post a listing to start receiving orders!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentOrders.map((o: any) => (
              <div key={o.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-white/60 border border-emerald-900/8 hover:border-green-200 transition-colors">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="text-gray-400 font-medium">Order</div>
                    <div className="font-bold text-emerald-950 font-mono">#{(o.id || '').toString().slice(0, 8)}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 font-medium">Quantity</div>
                    <div className="font-semibold text-emerald-950">{o.quantity_kg} kg @ ₹{o.price_per_kg}/kg</div>
                  </div>
                  <div>
                    <div className="text-gray-400 font-medium">Payout</div>
                    <div className="font-extrabold text-green-700">₹{(o.total_amount || o.quantity_kg * o.price_per_kg)?.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 font-medium">Status</div>
                    <span className={statusBadge[o.item_status] || 'badge-yellow'}>{o.item_status || 'pending'}</span>
                  </div>
                </div>
                {o.item_status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleUpdateItemStatus(o.item_id, 'accepted')} disabled={actionLoading === o.item_id}
                      className="px-3 py-1.5 rounded-xl bg-green-600 text-white font-bold text-xs hover:bg-green-700 transition-colors disabled:opacity-50">
                      Accept
                    </button>
                    <button onClick={() => handleUpdateItemStatus(o.item_id, 'rejected')} disabled={actionLoading === o.item_id}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-colors disabled:opacity-50">
                      Decline
                    </button>
                  </div>
                )}
                {o.item_status === 'accepted' && (
                  <button onClick={() => handleUpdateItemStatus(o.item_id, 'fulfilled')} disabled={actionLoading === o.item_id}
                    className="btn-primary text-xs px-4 py-1.5 shrink-0 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Mark Fulfilled
                  </button>
                )}
                {o.item_status === 'fulfilled' && (
                  <span className="text-green-700 font-bold text-xs shrink-0 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
