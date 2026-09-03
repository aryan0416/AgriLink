'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function TransporterDashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    activeShipments: 0,
    totalEarnings: 0,
    vehicles: [] as any[],
    recentShipments: [] as any[],
  });
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;

    // Fetch vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('*')
      .eq('transporter_id', userId)
      .order('created_at', { ascending: false });

    const totalVehicles = vehicles?.length || 0;
    const availableVehicles = vehicles?.filter(v => v.available).length || 0;

    // Fetch shipments
    const vehicleIds = (vehicles || []).map(v => v.id);
    let shipments: any[] = [];
    if (vehicleIds.length > 0) {
      const { data } = await supabase
        .from('shipments')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .order('created_at', { ascending: false })
        .limit(10);
      shipments = data || [];
    }

    const activeShipments = shipments.filter(s => 
      ['assigned', 'picked_up', 'in_transit'].includes(s.status)
    ).length;

    const totalEarnings = shipments
      .filter(s => s.status === 'delivered')
      .reduce((sum, s) => sum + (s.cost || 0), 0);

    setStats({
      totalVehicles,
      availableVehicles,
      activeShipments,
      totalEarnings: Math.round(totalEarnings),
      vehicles: vehicles || [],
      recentShipments: shipments,
    });
    setLoading(false);
  }

  async function handleToggleVehicle(id: string, current: boolean) {
    setToggleLoading(id);
    await supabase.from('vehicles').update({ available: !current }).eq('id', id);
    await loadDashboard();
    setToggleLoading(null);
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-emerald-900/60 font-semibold">
        <div className="text-4xl animate-spin mb-3 inline-block"></div>
        <p>Loading transporter fleet operations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-white/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-organic"> Intelligent Logistics Fleet</span>
            <span className="text-xs text-emerald-900/60 font-medium">• OSRM Clustered Transport</span>
          </div>
          <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">
            Transporter Fleet Management
          </h1>
          <p className="text-emerald-900/70 text-sm mt-1">
            Manage your vehicles, accept route-optimized cluster pickups, and track delivery earnings.
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/dashboard/transporter/vehicles" className="btn-primary text-sm flex items-center gap-2">
            <span>+ Register New Vehicle</span>
          </Link>
          <Link href="/dashboard/transporter/shipments" className="btn-secondary text-sm flex items-center gap-2">
            <span> Shipment Trips</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 space-y-2 border-l-4 border-l-brand-600">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Fleet</div>
          <div className="text-3xl font-black text-brand-700">{stats.totalVehicles}</div>
          <div className="text-xs text-emerald-700 font-medium">{stats.availableVehicles} units available for dispatch</div>
        </div>

        <div className="glass-card p-6 space-y-2 border-l-4 border-l-blue-600">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Trip Dispatches</div>
          <div className="text-3xl font-black text-blue-700">{stats.activeShipments}</div>
          <div className="text-xs text-gray-400">On-route deliveries</div>
        </div>

        <div className="glass-card p-6 space-y-2 border-l-4 border-l-amber-600">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Completed Trip Earnings</div>
          <div className="text-3xl font-black text-amber-700">₹{stats.totalEarnings.toLocaleString()}</div>
          <div className="text-xs text-gray-400">₹15/km standard benchmark</div>
        </div>

        <div className="glass-card p-6 space-y-2 border-l-4 border-l-emerald-600">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fleet Utilization</div>
          <div className="text-3xl font-black text-emerald-800">
            {stats.totalVehicles > 0 
              ? Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100)
              : 0}%
          </div>
          <div className="text-xs text-emerald-700/70 font-medium">Clustered efficiency</div>
        </div>
      </div>

      {/* Fleet Vehicles Snapshot */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-emerald-950">Fleet Units</h2>
            <p className="text-xs text-gray-500">Toggle live availability for automated OSRM matching</p>
          </div>
          <Link href="/dashboard/transporter/vehicles" className="text-xs font-bold text-brand-700 hover:underline">
            Manage Fleet →
          </Link>
        </div>

        {stats.vehicles.length === 0 ? (
          <div className="text-center py-10 text-gray-400 space-y-2">
            <div className="text-4xl"></div>
            <p className="text-sm">No vehicles registered yet. Click &quot;Register New Vehicle&quot; to join the logistics pool!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.vehicles.map((v) => (
              <div key={v.id} className="p-4 rounded-2xl bg-white/70 border border-emerald-900/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">
                      {v.vehicle_type === 'truck' ? '' : v.vehicle_type === 'van' ? '' : v.vehicle_type === 'tempo' ? '' : '️'}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-emerald-950">{v.registration_no}</div>
                      <div className="text-[10px] text-gray-500 capitalize">{v.vehicle_type} • {v.capacity_kg} kg capacity</div>
                    </div>
                  </div>
                  <span className={`badge-${v.available ? 'green' : 'red'}`}>
                    {v.available ? 'Available' : 'On Trip'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleVehicle(v.id, v.available)}
                  disabled={toggleLoading === v.id}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    v.available
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {toggleLoading === v.id ? 'Updating...' : v.available ? 'Set Offline' : 'Set Available'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Shipments */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-emerald-950">Shipment Deliveries</h2>
            <p className="text-xs text-gray-500">Track mileage, clustered pickup points, and earnings</p>
          </div>
          <Link href="/dashboard/transporter/shipments" className="text-xs font-bold text-brand-700 hover:underline">
            View All Shipments →
          </Link>
        </div>

        {stats.recentShipments.length === 0 ? (
          <div className="text-center py-10 text-gray-400 space-y-2">
            <div className="text-4xl"></div>
            <p className="text-sm">No shipments yet. Make sure vehicles are set to &quot;Available&quot; to receive trips!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Shipment ID</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Calculated Route</th>
                  <th className="py-3 px-2 font-bold">Earnings</th>
                  <th className="py-3 px-2 text-right">Trip Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-white/60 transition-colors">
                    <td className="py-3.5 px-2 font-mono text-gray-700 font-bold">#{s.id.slice(0, 8)}</td>
                    <td className="py-3.5 px-2">
                      <span className={`badge-${
                        s.status === 'delivered' ? 'green' :
                        s.status === 'in_transit' ? 'blue' : 'yellow'
                      }`}>
                        {s.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-gray-600 font-medium">
                      {s.distance_km ? `${s.distance_km} km (OSRM Optimized)` : 'Local cluster'}
                    </td>
                    <td className="py-3.5 px-2 font-extrabold text-brand-700">₹{s.cost || '450'}</td>
                    <td className="py-3.5 px-2 text-right text-gray-400">
                      {new Date(s.created_at).toLocaleDateString()}
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
