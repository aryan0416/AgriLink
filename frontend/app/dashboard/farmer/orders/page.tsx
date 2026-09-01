'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get order items for this farmer
    const { data: items } = await supabase
      .from('order_items')
      .select('*, orders!inner(id, status, total_amount, created_at, delivery_address, buyer_id)')
      .eq('farmer_id', session.user.id);

    const orderMap = new Map();
    (items || []).forEach(item => {
      const orderId = item.orders?.id;
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          ...item.orders,
          items: [],
        });
      }
      orderMap.get(orderId).items.push(item);
    });

    setOrders(Array.from(orderMap.values()));
    setLoading(false);
  }

  async function updateItemStatus(itemId: string, status: string) {
    await supabase.from('order_items').update({ status }).eq('id', itemId);
    loadOrders();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Incoming Orders</h1>
        <p className="text-gray-500">Manage orders from buyers</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono text-sm text-gray-500">Order #{order.id.slice(0, 8)}</span>
                  <span className={`ml-3 badge-${order.status === 'delivered' ? 'green' : order.status === 'cancelled' ? 'red' : 'yellow'}`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-t border-gray-100">
                    <div className="text-sm">
                      <span className="font-medium">{item.quantity_kg} kg</span>
                      <span className="text-gray-500 ml-2">× ₹{item.price_per_kg}/kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge-${item.status === 'fulfilled' ? 'green' : item.status === 'accepted' ? 'blue' : item.status === 'rejected' ? 'red' : 'yellow'}`}>
                        {item.status}
                      </span>
                      {item.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateItemStatus(item.id, 'accepted')}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateItemStatus(item.id, 'rejected')}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {item.status === 'accepted' && (
                        <button
                          onClick={() => updateItemStatus(item.id, 'fulfilled')}
                          className="text-xs px-2 py-1 bg-brand-100 text-brand-700 rounded hover:bg-brand-200"
                        >
                          Mark Fulfilled
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Delivery: {order.delivery_address}
                </span>
                <span className="font-semibold">
                  Total: ₹{order.total_amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
