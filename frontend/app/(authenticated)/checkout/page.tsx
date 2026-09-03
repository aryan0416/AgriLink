'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/lib/cart-store';
import { CheckCircle2, Loader2, MapPin, CreditCard, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const cartItems = useCartStore((state) => state.items);
  const cartTotal = useCartStore((state) => state.getCartTotal());
  const clearCart = useCartStore((state) => state.clearCart);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [role, setRole] = useState('consumer');

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, role')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setPhone(profile.phone || '');
        setRole(profile.role || session.user.user_metadata?.role || 'consumer');
      } else {
        setRole(session.user.user_metadata?.role || 'consumer');
      }

      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    
    setProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // 1. Create the main Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: session.user.id,
          total_amount: cartTotal,
          delivery_address: address,
          status: 'pending',
          order_type: 'direct', // Defaulting to direct marketplace purchase
        })
        .select()
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order creation failed');

      // 2. Create the Order Items
      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.id,
        farmer_id: item.seller_id || null,
        quantity_kg: item.quantity,
        price_per_kg: item.unit_price,
        status: 'pending'
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 3. Success
      clearCart();
      setSuccess(true);
    } catch (err: any) {
      alert(`Error placing order: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-scale-in">
        <div className="glass-panel p-10 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-emerald-950 tracking-tight">Order Confirmed!</h1>
            <p className="text-emerald-900/60 mt-2">Your fresh produce order has been sent directly to the farmers.</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-800 font-medium max-w-md mx-auto">
            You will receive SMS updates on <span className="font-bold">{phone || 'your registered number'}</span> regarding dispatch and delivery.
          </div>
          <div className="pt-4">
            <Link href={`/dashboard/${role === 'consumer' || role === 'buyer' ? role : role === 'fpo' ? 'fpo' : 'farmer'}`} className="btn-primary px-8 py-3">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-12 text-center space-y-4 animate-fade-in">
        <ShoppingBag className="w-16 h-16 text-emerald-900/20 mx-auto" />
        <h2 className="text-2xl font-bold text-emerald-950">Your cart is empty</h2>
        <p className="text-emerald-900/60">Add some fresh produce before checking out.</p>
        <div className="pt-4">
          <Link href="/marketplace" className="btn-primary px-6 py-2">Return to Marketplace</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/60 hover:bg-white text-emerald-900 shadow-sm transition-colors border border-emerald-900/10">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">Secure Checkout</h1>
          <p className="text-sm text-emerald-900/60 mt-1">Review your order and enter delivery details.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
            
            <div className="glass-panel p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2 border-b border-emerald-900/5 pb-4">
                <MapPin className="w-5 h-5 text-emerald-600" /> Delivery Information
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-emerald-900/70 uppercase tracking-wider">Full Delivery Address</label>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/70 border border-emerald-900/20 text-emerald-950 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none resize-none shadow-sm"
                    placeholder="Enter building, street, and pin code..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-emerald-900/70 uppercase tracking-wider">Contact Phone</label>
                  <input 
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/70 border border-emerald-900/20 text-emerald-950 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none shadow-sm"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-bold text-emerald-950 flex items-center gap-2 border-b border-emerald-900/5 pb-4">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Payment Method
              </h2>
              
              <div className="grid sm:grid-cols-3 gap-4">
                {['upi', 'card', 'pod'].map((method) => (
                  <label key={method} className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === method ? 'border-emerald-500 bg-emerald-50/50' : 'border-emerald-900/10 hover:border-emerald-300 bg-white/60'}`}>
                    <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="sr-only" />
                    <span className="font-bold text-sm text-emerald-950 mb-1">
                      {method === 'upi' ? 'UPI / QR' : method === 'card' ? 'Credit / Debit' : 'Pay on Delivery'}
                    </span>
                    <span className="text-xs text-emerald-900/60">
                      {method === 'upi' ? 'GPay, PhonePe' : method === 'card' ? 'Visa, Mastercard' : 'Cash or UPI on delivery'}
                    </span>
                    {paymentMethod === method && (
                      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                    )}
                  </label>
                ))}
              </div>
            </div>

          </form>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 sm:p-8 sticky top-28 space-y-6">
            <h2 className="text-lg font-bold text-emerald-950 border-b border-emerald-900/5 pb-4">
              Order Summary
            </h2>

            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-bold text-sm text-emerald-950">{item.crop_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.quantity} kg @ ₹{item.unit_price}/kg</div>
                  </div>
                  <div className="font-bold text-emerald-800 text-sm shrink-0">
                    ₹{(item.quantity * item.unit_price).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-emerald-900/10 space-y-3">
              <div className="flex justify-between text-sm text-emerald-900/70">
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-900/70">
                <span>Platform Fee</span>
                <span className="text-green-600 font-medium">Free (SIH Demo)</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-emerald-900/10">
                <span className="font-bold text-emerald-950">Total Pay</span>
                <span className="text-2xl font-black text-emerald-700">₹{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={processing}
              className="btn-primary w-full py-4 text-base mt-2 shadow-lg hover:shadow-emerald-500/25"
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                </span>
              ) : (
                `Place Order • ₹${cartTotal.toLocaleString()}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
