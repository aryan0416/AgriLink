'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_id', session.user.id)
      .order('created_at', { ascending: false });

    // Fetch items for each order
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);
        return { ...order, items: items || [] };
      })
    );

    setOrders(ordersWithItems);
    setLoading(false);
  }

  async function updateOrderStatus(orderId: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    loadOrders();
  }

  const statusSteps = ['pending', 'confirmed', 'in_transit', 'delivered'];

  function getStepIndex(status: string) {
    return statusSteps.indexOf(status);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500">Track your purchases</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <p>No orders yet. Browse the marketplace to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="font-mono text-sm text-gray-500">Order #{order.id.slice(0, 8)}</span>
                  <span className={`ml-3 badge-${order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : 'yellow'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{order.total_amount}</div>
                  <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Progress bar */}
              {order.status !== 'cancelled' && (
                <div className="flex items-center gap-2 mb-4">
                  {statusSteps.map((step, i) => {
                    const currentIdx = getStepIndex(order.status);
                    const isComplete = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step} className="flex-1">
                        <div className={`h-2 rounded-full ${isComplete ? 'bg-brand-500' : 'bg-gray-200'}`} />
                        <div className={`text-xs mt-1 text-center capitalize ${isCurrent ? 'text-brand-700 font-medium' : 'text-gray-400'}`}>
                          {step.replace('_', ' ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-t border-gray-100 text-sm">
                    <div>
                      <span className="font-medium">{item.quantity_kg} kg</span>
                      <span className="text-gray-500 ml-2">× ₹{item.price_per_kg}/kg</span>
                    </div>
                    <span className={`badge-${item.status === 'fulfilled' ? 'green' : item.status === 'accepted' ? 'blue' : 'yellow'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Delivery info */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">📍 {order.delivery_address}</span>
                {order.delivery_date && (
                  <span className="text-gray-500">📅 {new Date(order.delivery_date).toLocaleDateString()}</span>
                )}
              </div>

              {/* Action buttons */}
              {order.status === 'delivered' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-green-600 font-medium">✅ Delivery confirmed</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
