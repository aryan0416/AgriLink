'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function FarmerListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadListings(); }, [filter]);

  async function loadListings() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    let query = supabase
      .from('products')
      .select('*')
      .eq('seller_id', session.user.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setListings(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('products').update({ status }).eq('id', id);
    loadListings();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-gray-500">{listings.length} total listings</p>
        </div>
        <Link href="/marketplace" className="btn-primary">+ New Listing</Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'active', 'sold', 'expired'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🌾</div>
          <p>No listings yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <div key={listing.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center text-xl">
                  🌾
                </div>
                <div>
                  <div className="font-semibold">{listing.crop_name}</div>
                  <div className="text-sm text-gray-500">
                    {listing.quantity_kg} kg × ₹{listing.unit_price}/kg = ₹{(listing.quantity_kg * listing.unit_price).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {listing.district}, {listing.state} • Harvested {new Date(listing.harvest_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge-${listing.status === 'active' ? 'green' : listing.status === 'sold' ? 'blue' : 'red'}`}>
                  {listing.status}
                </span>
                <span className={`badge-${listing.grade === 'A' ? 'green' : listing.grade === 'B' ? 'yellow' : 'red'}`}>
                  Grade {listing.grade}
                </span>
                {listing.status === 'active' && (
                  <button
                    onClick={() => updateStatus(listing.id, 'expired')}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
