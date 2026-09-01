'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  crop_name: string;
  variety: string | null;
  grade: string;
  quantity_kg: number;
  unit_price: number;
  harvest_date: string;
  district: string;
  state: string;
  status: string;
  seller_id: string;
  images: string[];
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCrop, setSearchCrop] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);

  // New listing form state
  const [newCrop, setNewCrop] = useState('');
  const [newVariety, setNewVariety] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newHarvestDate, setNewHarvestDate] = useState('');
  const [newShelfLife, setNewShelfLife] = useState('7');
  const [newDistrict, setNewDistrict] = useState('');
  const [newState, setNewState] = useState('');

  useEffect(() => {
    checkUser();
    loadProducts();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      setUserRole(profile?.role || 'consumer');
    }
  }

  async function loadProducts() {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (searchCrop) {
      query = query.ilike('crop_name', `%${searchCrop}%`);
    }
    if (searchDistrict) {
      query = query.eq('district', searchDistrict);
    }

    const { data } = await query.limit(50);
    setProducts(data || []);
    setLoading(false);
  }

  async function handleCreateListing(e: React.FormEvent) {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from('products').insert({
      seller_id: session.user.id,
      crop_name: newCrop,
      variety: newVariety || null,
      grade: 'B',
      quantity_kg: parseFloat(newQuantity),
      unit_price: parseFloat(newPrice),
      harvest_date: newHarvestDate,
      shelf_life_days: parseInt(newShelfLife),
      district: newDistrict,
      state: newState,
      status: 'active',
    });

    if (!error) {
      setShowCreateForm(false);
      setNewCrop('');
      setNewVariety('');
      setNewQuantity('');
      setNewPrice('');
      setNewHarvestDate('');
      setNewShelfLife('7');
      setNewDistrict('');
      setNewState('');
      loadProducts();
    }
  }

  function addToCart(productId: string) {
    setCart(prev => {
      const existing = prev.find(c => c.productId === productId);
      if (existing) {
        return prev.map(c => c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-500">Browse fresh produce from local farmers</p>
        </div>
        <div className="flex gap-3">
          {['farmer', 'fpo'].includes(userRole) && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn-primary"
            >
              + New Listing
            </button>
          )}
          {cart.length > 0 && (
            <div className="btn-harvest relative">
              🛒 Cart ({cart.length})
            </div>
          )}
        </div>
      </div>

      {/* Create listing form */}
      {showCreateForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Create New Listing</h2>
          <form onSubmit={handleCreateListing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Tomato, Onion, Rice"
                value={newCrop}
                onChange={(e) => setNewCrop(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Cherry, Local"
                value={newVariety}
                onChange={(e) => setNewVariety(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg) *</label>
              <input
                type="number"
                className="input-field"
                placeholder="100"
                min="1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg (₹) *</label>
              <input
                type="number"
                className="input-field"
                placeholder="25"
                min="1"
                step="0.5"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date *</label>
              <input
                type="date"
                className="input-field"
                value={newHarvestDate}
                onChange={(e) => setNewHarvestDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Life (days)</label>
              <input
                type="number"
                className="input-field"
                value={newShelfLife}
                onChange={(e) => setNewShelfLife(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
              <select className="input-field" value={newDistrict} onChange={(e) => setNewDistrict(e.target.value)} required>
                <option value="">Select district</option>
                <option value="Pune">Pune</option>
                <option value="Nashik">Nashik</option>
                <option value="Indore">Indore</option>
                <option value="Jaipur">Jaipur</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
              <select className="input-field" value={newState} onChange={(e) => setNewState(e.target.value)} required>
                <option value="">Select state</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Telangana">Telangana</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Create Listing</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search filters */}
      <div className="flex gap-4 flex-wrap">
        <input
          type="text"
          className="input-field w-60"
          placeholder="Search crop..."
          value={searchCrop}
          onChange={(e) => setSearchCrop(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
        />
        <select
          className="input-field w-48"
          value={searchDistrict}
          onChange={(e) => setSearchDistrict(e.target.value)}
        >
          <option value="">All districts</option>
          <option value="Pune">Pune</option>
          <option value="Nashik">Nashik</option>
          <option value="Indore">Indore</option>
          <option value="Jaipur">Jaipur</option>
          <option value="Hyderabad">Hyderabad</option>
        </select>
        <button onClick={loadProducts} className="btn-primary">Search</button>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading produce...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-4">🌾</div>
          <p>No produce found. Try a different search or create a listing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card hover:shadow-md transition-shadow">
              {/* Crop icon */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{product.crop_name}</h3>
                  {product.variety && (
                    <p className="text-sm text-gray-500">{product.variety}</p>
                  )}
                </div>
                <span className={`badge-${product.grade === 'A' ? 'green' : product.grade === 'B' ? 'yellow' : 'red'}`}>
                  Grade {product.grade}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Quantity</span>
                  <span className="font-medium">{product.quantity_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Price</span>
                  <span className="font-medium text-brand-600">₹{product.unit_price}/kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Value</span>
                  <span className="font-medium">₹{(product.quantity_kg * product.unit_price).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span>
                  <span>{product.district}, {product.state}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harvested</span>
                  <span>{new Date(product.harvest_date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              {['buyer', 'consumer'].includes(userRole) && (
                <button
                  onClick={() => addToCart(product.id)}
                  className="btn-primary w-full"
                >
                  Add to Cart
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
