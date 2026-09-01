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
    recentShipments: [] as any[],
  });
  const [loading, setLoading] = useState(true);

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
      .select('id, available')
      .eq('transporter_id', userId);

    const totalVehicles = vehicles?.length || 0;
    const availableVehicles = vehicles?.filter(v => v.available).length || 0;

    // Fetch shipments
    const vehicleIds = (vehicles || []).map(v => v.id);
    let shipments: any[] = [];
    if (vehicleIds.length > 0) {
      const { data } = await supabase
        .from('shipments')
        .select('id, order_id, status, distance_km, cost, created_at')
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
      recentShipments: shipments,
    });
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transporter Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your vehicles and shipments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Vehicles</div>
          <div className="text-3xl font-bold text-brand-600">{stats.totalVehicles}</div>
          <div className="text-xs text-gray-400">{stats.availableVehicles} available</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Active Shipments</div>
          <div className="text-3xl font-bold text-blue-600">{stats.activeShipments}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Earnings</div>
          <div className="text-3xl font-bold text-harvest-600">₹{stats.totalEarnings.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Utilization</div>
          <div className="text-3xl font-bold text-gray-700">
            {stats.totalVehicles > 0 
              ? Math.round(((stats.totalVehicles - stats.availableVehicles) / stats.totalVehicles) * 100)
              : 0}%
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/transporter/vehicles" className="card hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">🚚</div>
          <div className="font-medium">Manage Vehicles</div>
          <div className="text-sm text-gray-500">Register and manage your fleet</div>
        </Link>
        <Link href="/dashboard/transporter/shipments" className="card hover:shadow-md transition-shadow text-center">
          <div className="text-3xl mb-2">📦</div>
          <div className="font-medium">View Shipments</div>
          <div className="text-sm text-gray-500">Track deliveries and routes</div>
        </Link>
      </div>

      {/* Recent shipments */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Recent Shipments</h2>
        {stats.recentShipments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No shipments yet. Register a vehicle to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">Shipment</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Distance</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentShipments.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100">
                    <td className="py-3 font-mono text-xs">{s.id.slice(0, 8)}...</td>
                    <td className="py-3">
                      <span className={`badge-${
                        s.status === 'delivered' ? 'green' :
                        s.status === 'in_transit' ? 'blue' : 'yellow'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3">{s.distance_km ? `${s.distance_km} km` : '-'}</td>
                    <td className="py-3 font-medium">₹{s.cost || '-'}</td>
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
