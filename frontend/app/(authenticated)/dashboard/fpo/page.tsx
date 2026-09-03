'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FPODashboard() {
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Good morning');

  const stats = {
    clusterMembers: 142,
    aggregatedTonnage: 12500,
    institutionalContracts: 8,
    payouts: 4850000,
    weeklyAggregation: [
      { day: 'Mon', tonnage: 1200 },
      { day: 'Tue', tonnage: 1500 },
      { day: 'Wed', tonnage: 2100 },
      { day: 'Thu', tonnage: 1800 },
      { day: 'Fri', tonnage: 2400 },
      { day: 'Sat', tonnage: 1900 },
      { day: 'Sun', tonnage: 1600 },
    ],
    clusterAlerts: [
      { icon: '️', title: 'Harvest Warning', desc: 'Rain forecasted in Cluster A. Alert 45 farmers to delay tomato harvest.', type: 'warning' },
      { icon: '', title: 'Bulk Contract Secured', desc: 'Reliance Retail contract signed for 5000kg Onion. Allocate quota to members.', type: 'positive' },
    ]
  };

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    setTimeout(() => setLoading(false), 800); // Simulate network
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
            <span className="badge-purple"> FPO Command Hub</span>
            <span className="badge-gold"> Premier Collective</span>
          </div>
          <p className="text-sm text-emerald-900/55 mb-1">{greeting}!</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950">Cluster Operations</h1>
          <p className="text-sm text-emerald-900/65 mt-1 hidden sm:block">Manage farmer members, track bulk aggregation, and negotiate institutional contracts.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/marketplace" className="btn-primary text-sm px-5 py-2.5">Post Bulk Listing</Link>
          <Link href="/analytics" className="btn-secondary text-sm px-5 py-2.5">Market Intel</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border-l-4 border-l-purple-600">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Active Members</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.clusterMembers}</div>
          <div className="text-xs text-gray-400 mt-1">Farmers in your FPO</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-blue-600">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Aggregated Tonnage</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">{(stats.aggregatedTonnage / 1000).toFixed(1)}k kg</div>
          <div className="text-xs text-gray-400 mt-1">This month</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Institutional Contracts</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">{stats.institutionalContracts}</div>
          <div className="text-xs text-gray-400 mt-1">Active bulk deals</div>
        </div>
        <div className="glass-card p-5 border-l-4 border-l-emerald-600">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Farmer Payouts</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">₹{(stats.payouts / 1000000).toFixed(2)}M</div>
          <div className="text-xs text-gray-400 mt-1">Distributed successfully</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-emerald-950">Harvest Aggregation Velocity</h2>
              <p className="text-xs text-gray-400">Daily crop intake from members</p>
            </div>
            <span className="badge-purple text-xs">Peak Harvest Season</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.weeklyAggregation}>
              <defs>
                <linearGradient id="aggGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(val: any) => [`${val} kg`, 'Aggregated']} />
              <Area type="monotone" dataKey="tonnage" stroke="#7c3aed" strokeWidth={2.5} fill="url(#aggGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="text-sm font-bold text-emerald-950 px-1">Cluster Alerts</div>
          {stats.clusterAlerts.map((a, i) => (
            <div key={i} className={`glass-card p-4 border-l-4 ${a.type === 'warning' ? 'border-l-amber-400' : 'border-l-blue-500'}`}>
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
    </div>
  );
}
