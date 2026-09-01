'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadShipments(); }, []);

  async function loadShipments() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get vehicles owned by this transporter
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id')
      .eq('transporter_id', session.user.id);

    const vehicleIds = (vehicles || []).map(v => v.id);
    if (vehicleIds.length === 0) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('shipments')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false });

    setShipments(data || []);
    setLoading(false);
  }

  async function updateShipmentStatus(id: string, status: string) {
    const update: any = { status };
    if (status === 'delivered') {
      update.actual_delivery = new Date().toISOString();
    }
    await supabase.from('shipments').update(update).eq('id', id);
    
    // If delivered, free up the vehicle
    if (status === 'delivered') {
      const shipment = shipments.find(s => s.id === id);
      if (shipment) {
        await supabase.from('vehicles').update({ available: true }).eq('id', shipment.vehicle_id);
      }
    }
    
    loadShipments();
  }

  const statusFlow = ['assigned', 'picked_up', 'in_transit', 'delivered'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
        <p className="text-gray-500">Track and manage your deliveries</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : shipments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <p>No shipments yet. Register a vehicle and wait for assignments!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map(shipment => {
            const currentIdx = statusFlow.indexOf(shipment.status);
            
            return (
              <div key={shipment.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="font-mono text-sm text-gray-500">
                      Shipment #{shipment.id.slice(0, 8)}
                    </span>
                    <span className={`ml-3 badge-${
                      shipment.status === 'delivered' ? 'green' :
                      shipment.status === 'in_transit' ? 'blue' : 'yellow'
                    }`}>
                      {shipment.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {shipment.distance_km && <div>{shipment.distance_km} km</div>}
                    {shipment.cost && <div className="font-medium text-gray-700">₹{shipment.cost}</div>}
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 mb-4">
                  {statusFlow.map((step, i) => (
                    <div key={step} className="flex-1">
                      <div className={`h-2 rounded-full ${i <= currentIdx ? 'bg-brand-500' : 'bg-gray-200'}`} />
                      <div className={`text-xs mt-1 capitalize ${i === currentIdx ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
                        {step.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pickup points */}
                {shipment.pickup_points && (
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="font-medium mb-1">Pickup Points:</div>
                    {(() => {
                      try {
                        const points = typeof shipment.pickup_points === 'string' 
                          ? JSON.parse(shipment.pickup_points) 
                          : shipment.pickup_points;
                        return points.map((p: any, i: number) => (
                          <div key={i} className="ml-4 text-gray-500">
                            {i + 1}. {p.quantity_kg || '?'} kg {p.address || `(${p.latitude}, ${p.longitude})`}
                          </div>
                        ));
                      } catch { return <div className="ml-4 text-gray-400">Route data available</div>; }
                    })()}
                  </div>
                )}

                {/* Actions */}
                {shipment.status !== 'delivered' && (
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {currentIdx < statusFlow.length - 1 && (
                      <button
                        onClick={() => updateShipmentStatus(shipment.id, statusFlow[currentIdx + 1])}
                        className="btn-primary text-sm"
                      >
                        Mark as {statusFlow[currentIdx + 1].replace('_', ' ')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
