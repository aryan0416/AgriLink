'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConsumerDashboard() {
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good morning');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  const stats = {
    monthlySavings: 1250,
    freshnessScore: 98,
    ordersDelivered: 12,
    favoriteFarms: 3,
    spendingTrend: [
      { week: 'Week 1', spent: 450 },
      { week: 'Week 2', spent: 320 },
      { week: 'Week 3', spent: 580 },
      { week: 'Week 4', spent: 410 },
    ]
  };

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select(`
          *,
          profiles!products_seller_id_fkey(full_name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4);
      
      setAvailableProducts(data || []);
      setLoading(false);
    }
    
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="glass-panel h-32 animate-shimmer rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 animate-shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in-up">
      <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-yellow"> Consumer Dashboard</span>
            <span className="badge-organic"> 100% Farm Fresh</span>
          </div>
          <p className="text-sm text-emerald-900/55 mb-1">{greeting}!</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950">Your Fresh Kitchen</h1>
          <p className="text-sm text-emerald-900/65 mt-1 hidden sm:block">Procure farm-fresh vegetables and grains directly from farmers at fair rates.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/marketplace" className="btn-primary text-sm px-5 py-2.5">Shop Fresh</Link>
          <Link href="/dashboard/consumer/orders" className="btn-secondary text-sm px-5 py-2.5">Track Delivery</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Monthly Savings</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">₹{stats.monthlySavings}</div>
          <div className="text-xs text-gray-400 mt-1">vs supermarket prices</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-green-600">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Freshness Score</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.freshnessScore}%</div>
          <div className="text-xs text-gray-400 mt-1">Average harvest-to-home</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-blue-600">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Orders Delivered</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.ordersDelivered}</div>
          <div className="text-xs text-gray-400 mt-1">Since joining</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-pink-500">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Favorite Farms</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.favoriteFarms}</div>
          <div className="text-xs text-gray-400 mt-1">Subscribed producers</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-emerald-950">Grocery Spending</h2>
              <p className="text-xs text-gray-400">Weekly expenditure on fresh produce</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.spendingTrend}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(val: any) => [`₹${val}`, 'Spent']} />
              <Area type="monotone" dataKey="spent" stroke="#f59e0b" strokeWidth={2.5} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="font-bold text-emerald-950 mb-4">Fresh Available Now</h2>
          <div className="space-y-3">
            {availableProducts.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-sm">No fresh produce currently listed.</div>
            ) : (
              availableProducts.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-emerald-900/8 hover:border-emerald-300 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {item.crop_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-emerald-950">{item.crop_name}</div>
                      <div className="text-xs text-gray-500">{item.profiles?.full_name || 'Farmer'} • ₹{item.unit_price}/kg</div>
                    </div>
                  </div>
                  <Link href="/marketplace" className="btn-secondary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
