'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vehicle_type: 'truck',
    capacity_kg: '',
    registration_no: '',
  });

  useEffect(() => { loadVehicles(); }, []);

  async function loadVehicles() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('transporter_id', session.user.id)
      .order('created_at', { ascending: false });

    setVehicles(data || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from('vehicles').insert({
      transporter_id: session.user.id,
      vehicle_type: form.vehicle_type,
      capacity_kg: parseFloat(form.capacity_kg),
      registration_no: form.registration_no,
      available: true,
    });

    setForm({ vehicle_type: 'truck', capacity_kg: '', registration_no: '' });
    setShowForm(false);
    loadVehicles();
  }

  async function toggleAvailability(id: string, current: boolean) {
    await supabase.from('vehicles').update({ available: !current }).eq('id', id);
    loadVehicles();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Vehicles</h1>
          <p className="text-gray-500">{vehicles.length} vehicles registered</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Register Vehicle
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Register New Vehicle</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <select
                className="input-field"
                value={form.vehicle_type}
                onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
              >
                <option value="truck">🚛 Truck</option>
                <option value="van">🚐 Van</option>
                <option value="tempo">🚛 Tempo</option>
                <option value="bike">🏍️ Bike</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (kg)</label>
              <input
                type="number"
                className="input-field"
                placeholder="5000"
                min="1"
                value={form.capacity_kg}
                onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration No.</label>
              <input
                type="text"
                className="input-field"
                placeholder="MH 12 AB 1234"
                value={form.registration_no}
                onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary">Register</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🚚</div>
          <p>No vehicles registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-2xl mb-1">
                    {vehicle.vehicle_type === 'truck' ? '🚛' : vehicle.vehicle_type === 'van' ? '🚐' : vehicle.vehicle_type === 'bike' ? '🏍️' : '🚛'}
                  </div>
                  <div className="font-semibold">{vehicle.registration_no}</div>
                  <div className="text-sm text-gray-500 capitalize">{vehicle.vehicle_type}</div>
                </div>
                <span className={`badge-${vehicle.available ? 'green' : 'red'}`}>
                  {vehicle.available ? 'Available' : 'On Trip'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Capacity: {vehicle.capacity_kg} kg
              </div>
              <button
                onClick={() => toggleAvailability(vehicle.id, vehicle.available)}
                className={`w-full py-2 rounded-lg text-sm font-medium ${
                  vehicle.available
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {vehicle.available ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
