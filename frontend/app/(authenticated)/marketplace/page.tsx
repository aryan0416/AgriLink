'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useCartStore } from '@/lib/cart-store';
import { Search, Filter, Leaf } from 'lucide-react';
import { CreateListingSheet } from '@/components/CreateListingSheet';

// ── Types ──────────────────────────────────────────────
interface Product {
  id: string;
  crop_name: string;
  variety: string | null;
  grade: 'A' | 'B' | 'C';
  quantity_kg: number;
  unit_price: number;
  harvest_date: string;
  shelf_life_days?: number;
  district: string;
  state: string;
  status: string;
  seller_id?: string;
  freshness?: number;
  category?: string;
}

// ── Synthetic Data ─────────────────────────────────────
const SYNTHETIC_PRODUCTS: Product[] = [
  { id: 'syn-1', crop_name: 'Tomato', variety: 'Roma', grade: 'A', quantity_kg: 2000, unit_price: 28, harvest_date: '2026-09-01', shelf_life_days: 7, district: 'Nashik', state: 'Maharashtra', status: 'active', freshness: 94, category: 'Vegetables' },
  { id: 'syn-2', crop_name: 'Onion', variety: 'Red Globe', grade: 'A', quantity_kg: 5000, unit_price: 21, harvest_date: '2026-08-28', shelf_life_days: 30, district: 'Pune', state: 'Maharashtra', status: 'active', freshness: 89, category: 'Vegetables' },
  { id: 'syn-3', crop_name: 'Potato', variety: 'Kufri Jyoti', grade: 'B', quantity_kg: 3000, unit_price: 16, harvest_date: '2026-08-25', shelf_life_days: 45, district: 'Indore', state: 'Madhya Pradesh', status: 'active', freshness: 85, category: 'Vegetables' },
  { id: 'syn-4', crop_name: 'Rice', variety: 'Basmati 1121', grade: 'A', quantity_kg: 10000, unit_price: 52, harvest_date: '2026-08-20', shelf_life_days: 365, district: 'Karnal', state: 'Haryana', status: 'active', freshness: 99, category: 'Grains & Pulses' },
  { id: 'syn-5', crop_name: 'Mango', variety: 'Alphonso', grade: 'A', quantity_kg: 800, unit_price: 120, harvest_date: '2026-09-02', shelf_life_days: 5, district: 'Ratnagiri', state: 'Maharashtra', status: 'active', freshness: 97, category: 'Fruits' },
  { id: 'syn-6', crop_name: 'Chilli', variety: 'Guntur Red', grade: 'A', quantity_kg: 1500, unit_price: 85, harvest_date: '2026-08-30', shelf_life_days: 10, district: 'Guntur', state: 'Andhra Pradesh', status: 'active', freshness: 92, category: 'Vegetables' },
  { id: 'syn-7', crop_name: 'Wheat', variety: 'HD-2967', grade: 'B', quantity_kg: 20000, unit_price: 24, harvest_date: '2026-08-10', shelf_life_days: 365, district: 'Jaipur', state: 'Rajasthan', status: 'active', freshness: 98, category: 'Grains & Pulses' },
  { id: 'syn-8', crop_name: 'Banana', variety: 'Cavendish', grade: 'A', quantity_kg: 2500, unit_price: 32, harvest_date: '2026-09-01', shelf_life_days: 6, district: 'Anand', state: 'Gujarat', status: 'active', freshness: 91, category: 'Fruits' },
  { id: 'syn-9', crop_name: 'Carrot', variety: 'Nantes', grade: 'A', quantity_kg: 1200, unit_price: 22, harvest_date: '2026-08-31', shelf_life_days: 14, district: 'Ooty', state: 'Tamil Nadu', status: 'active', freshness: 93, category: 'Vegetables' },
  { id: 'syn-10', crop_name: 'Onion', variety: 'White Globe', grade: 'C', quantity_kg: 8000, unit_price: 14, harvest_date: '2026-08-15', shelf_life_days: 20, district: 'Solapur', state: 'Maharashtra', status: 'active', freshness: 76, category: 'Vegetables' },
  { id: 'syn-11', crop_name: 'Soybean', variety: 'JS-335', grade: 'A', quantity_kg: 5000, unit_price: 48, harvest_date: '2026-08-22', shelf_life_days: 180, district: 'Nagpur', state: 'Maharashtra', status: 'active', freshness: 95, category: 'Grains & Pulses' },
  { id: 'syn-12', crop_name: 'Tomato', variety: 'Hybrid Cherry', grade: 'A', quantity_kg: 600, unit_price: 45, harvest_date: '2026-09-02', shelf_life_days: 5, district: 'Bangalore', state: 'Karnataka', status: 'active', freshness: 96, category: 'Vegetables' },
];

const CROP_ICONS: Record<string, string> = {
  tomato: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
  onion: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
  potato: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
  rice: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80',
  wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80',
  mango: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
  carrot: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
  chilli: 'https://images.unsplash.com/photo-1588012891129-9e8ff5f9e30a?w=400&q=80',
  banana: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=80',
  soybean: 'https://images.unsplash.com/photo-1529312266912-b33cfce2eefd?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80',
};

const GRADE_CONFIG = {
  A: { label: 'Grade A', badge: 'badge-green', bg: 'bg-green-50', border: 'border-green-200' },
  B: { label: 'Grade B', badge: 'badge-yellow', bg: 'bg-amber-50', border: 'border-amber-200' },
  C: { label: 'Grade C', badge: 'badge-silver', bg: 'bg-gray-50', border: 'border-gray-200' },
};

const CATEGORIES = ['All', 'Vegetables', 'Grains & Pulses', 'Fruits'];

// ── Product Card ───────────────────────────────────────
function ProductCard({ product, onView, onAddToCart }: { product: Product; onView: (p: Product) => void; onAddToCart: (p: Product) => void }) {
  const icon = CROP_ICONS[product.crop_name.toLowerCase()] || CROP_ICONS.default;
  const grade = GRADE_CONFIG[product.grade] || GRADE_CONFIG.B;
  const freshnessBg = product.freshness && product.freshness >= 90 ? 'from-green-400 to-emerald-500' : product.freshness && product.freshness >= 75 ? 'from-amber-400 to-yellow-500' : 'from-rose-400 to-red-500';

  return (
    <div className="glass-card-hover flex flex-col overflow-hidden group">
      {/* Image area */}
      <div className={`h-40 flex items-center justify-center relative overflow-hidden bg-emerald-50/50`}>
        <img src={icon} alt={product.crop_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute top-3 left-3">
          <span className={grade.badge}>{grade.label}</span>
        </div>
        {product.freshness && (
          <div className="absolute top-3 right-3 text-[11px] font-bold bg-white/90 px-2 py-0.5 rounded-full text-green-700 shadow-sm">
            {product.freshness}% Fresh
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">{product.crop_name}</h3>
              {product.variety && <div className="text-xs text-gray-400">{product.variety}</div>}
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-black text-green-700">₹{product.unit_price}</div>
              <div className="text-[10px] text-gray-400">/kg</div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-gray-500">
            <div className="flex justify-between">
              <span> {product.district}, {product.state}</span>
              <span className="font-semibold text-emerald-900">{product.quantity_kg.toLocaleString()} kg</span>
            </div>
            {product.freshness && (
              <div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                  <div className={`h-full rounded-full bg-gradient-to-r ${freshnessBg} transition-all`} style={{ width: `${product.freshness}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2 pt-3 border-t border-emerald-900/10">
          <button onClick={() => onView(product)} className="btn-secondary flex-1 text-xs py-2">View Details</button>
          <button onClick={() => onAddToCart(product)} className="btn-primary flex-1 text-xs py-2">Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

// ── Product Detail Modal ───────────────────────────────
function ProductModal({ product, onClose, onAddToCart }: { product: Product; onClose: () => void; onAddToCart: (p: Product, qty: number) => void }) {
  const [qty, setQty] = useState(100);
  const icon = CROP_ICONS[product.crop_name.toLowerCase()] || CROP_ICONS.default;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-panel p-6 sm:p-8 w-full max-w-lg shadow-2xl animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">✕</button>

        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden mb-3 border border-emerald-900/10 shadow-sm">
            <img src={icon} alt={product.crop_name} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-extrabold text-emerald-950 mt-3">{product.crop_name}</h2>
          {product.variety && <div className="text-sm text-gray-500">{product.variety}</div>}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Grade', value: `Grade ${product.grade}` },
            { label: 'Price', value: `₹${product.unit_price}/kg` },
            { label: 'Available', value: `${product.quantity_kg.toLocaleString()} kg` },
            { label: 'Location', value: `${product.district}, ${product.state}` },
            { label: 'Harvest Date', value: new Date(product.harvest_date).toLocaleDateString('en-IN') },
            { label: 'Shelf Life', value: product.shelf_life_days ? `${product.shelf_life_days} days` : 'N/A' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/60 border border-emerald-900/8">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.label}</div>
              <div className="text-sm font-bold text-emerald-950 mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>

        {product.freshness && (
          <div className="mb-5 p-4 rounded-xl bg-green-50/80 border border-green-200/60">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-green-800">AI Freshness Index</span>
              <span className="text-green-700">{product.freshness}%</span>
            </div>
            <div className="h-2 bg-green-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full" style={{ width: `${product.freshness}%` }} />
            </div>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Order Quantity (kg)</label>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(Math.max(50, qty - 50))} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors">-</button>
            <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} min={50} max={product.quantity_kg} className="input-field text-center font-bold text-lg" />
            <button onClick={() => setQty(Math.min(product.quantity_kg, qty + 50))} className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-lg transition-colors">+</button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-right">Total: <span className="font-bold text-emerald-950">₹{(qty * product.unit_price).toLocaleString()}</span></div>
        </div>

        <button onClick={() => { onAddToCart(product, qty); onClose(); }} className="btn-primary w-full py-3.5 font-bold">
          Add {qty} kg to Cart — ₹{(qty * product.unit_price).toLocaleString()}
        </button>
      </div>
    </div>
  );
}




// ── Main Marketplace Component ─────────────────────────
export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>(SYNTHETIC_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [category, setCategory] = useState('All');
  const [grade, setGrade] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const addItemToCart = useCartStore((state) => state.addItem);

  useEffect(() => {
    checkUser();
    loadProducts();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile) setUserRole(profile.role || '');
    }
  }

  async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching products:', error);
    }
    
    let dbProducts = data || [];
    
    // Assign a default category if missing based on crop_name to ensure filters work
    dbProducts = dbProducts.map((p: any) => ({
      ...p,
      category: p.category || (['Rice', 'Wheat', 'Soybean'].includes(p.crop_name) ? 'Grains & Pulses' : ['Mango', 'Banana'].includes(p.crop_name) ? 'Fruits' : 'Vegetables')
    }));

    if (dbProducts.length > 0) {
      setProducts([...dbProducts, ...SYNTHETIC_PRODUCTS.filter((s) => !dbProducts.find((d: Product) => d.crop_name.toLowerCase() === s.crop_name.toLowerCase()))]);
    } else {
      setProducts(SYNTHETIC_PRODUCTS);
    }
    setLoading(false);
  }

  const filteredProducts = products.filter((p) => {
    const matchCrop = p.crop_name.toLowerCase().includes(search.toLowerCase());
    const matchDistrict = p.district.toLowerCase().includes(district.toLowerCase());
    const matchCategory = category === 'All' || p.category === category;
    const matchGrade = grade === 'All' || p.grade === grade;
    return matchCrop && matchDistrict && matchCategory && matchGrade && p.status === 'active';
  });

  const handleAddToCart = (product: Product, quantity: number = 100) => {
    addItemToCart({
      id: product.id,
      crop_name: product.crop_name,
      grade: product.grade,
      unit_price: product.unit_price,
      quantity,
      max_quantity: product.quantity_kg,
      seller_id: product.seller_id
    });
  };

  async function handleCheckout(address: string, deliveryDate: string) {
    if (!userId) { alert('Please sign in to place an order.'); return; }
    // Checkout logic using useCartStore would go here
  }

  async function handleCreateListing(form: any) {
    if (!userId) { alert('Sign in as a farmer to list produce.'); return; }
    setFormLoading(true);
    const { error } = await supabase.from('products').insert({ seller_id: userId, crop_name: form.crop, variety: form.variety || null, grade: form.grade, quantity_kg: Number(form.qty), unit_price: Number(form.price), harvest_date: form.harvest, shelf_life_days: Number(form.shelf) || null, district: form.district, state: form.state, status: 'active' });
    if (error) {
      console.error('Error creating listing:', error);
      alert('Failed to create listing: ' + error.message);
    }
    await loadProducts();
    setFormLoading(false);
    setShowCreate(false);
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Ambient */}
      <div className="fixed top-[-15%] left-[-8%] w-[600px] h-[600px] bg-green-200/30 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ── Navbar ────────────────────────────────── */}
      <nav className="glass-nav sticky top-0 z-40 bg-white/70 backdrop-blur-md rounded-2xl border border-emerald-900/10 mx-4 sm:mx-8 mt-4 shadow-sm">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Search & Filters */}
          <div className="flex-1 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-900/40" />
              <input className="input-field text-sm py-2 pl-9 w-full bg-white/60" placeholder="Search crops..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <input className="input-field text-sm py-2 w-32 hidden sm:block bg-white/60" placeholder="District..." value={district} onChange={(e) => setDistrict(e.target.value)} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(userRole === 'farmer' || userRole === 'fpo') && (
              <button onClick={() => setShowCreate(true)} className="btn-primary text-xs px-4 py-2 shadow-sm">+ List Produce</button>
            )}
            <button onClick={() => setShowCart(true)} className="relative btn-secondary text-xs px-4 py-2">
               Cart
            </button>
            {userId ? (
              <Link href={`/dashboard/${userRole}/orders`} className="btn-ghost text-xs px-3 py-2 hidden sm:flex font-semibold">My Orders</Link>
            ) : (
              <Link href="/login" className="btn-ghost text-xs px-3 py-2 hidden sm:flex">Sign In</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Success toast */}
      {orderSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm animate-scale-in">
          {orderSuccess}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ──────────────────────────────── */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <span className="section-tag">Direct Agricultural Exchange</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950">Fresh Produce Marketplace</h1>
            </div>
          </div>
        </div>

        {/* ── Filters ──────────────────────────────── */}
        <div className="mb-6 space-y-3 animate-fade-in-up">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${category === cat ? 'bg-green-700 text-white shadow-sm' : 'bg-white/70 text-emerald-900/70 hover:bg-white border border-emerald-900/10'}`}>
                {cat}
              </button>
            ))}
            <div className="flex gap-2 ml-auto">
              {['All', 'A', 'B', 'C'].map((g) => (
                <button key={g} onClick={() => setGrade(g)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all ${grade === g ? 'bg-emerald-700 text-white' : 'bg-white/70 text-emerald-900/70 hover:bg-white border border-emerald-900/10'}`}>
                  {g === 'All' ? 'All Grades' : `Grade ${g}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Products Grid ─────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-shimmer rounded-2xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-bold text-emerald-950 mb-2">No produce found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((product, i) => (
              <div key={product.id} className="animate-fade-in-up">
                <ProductCard product={product} onView={setSelectedProduct} onAddToCart={(p) => handleAddToCart(p)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />}
      {showCreate && <CreateListingSheet onClose={() => setShowCreate(false)} onSubmit={handleCreateListing} loading={formLoading} />}
    </div>
  );
}
