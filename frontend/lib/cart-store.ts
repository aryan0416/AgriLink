import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  crop_name: string;
  grade: string;
  unit_price: number;
  quantity: number;
  max_quantity: number;
  seller_id?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.id === item.id);
        if (existingItem) {
          // If exists, just update quantity up to max_quantity
          return {
            items: state.items.map(i => 
              i.id === item.id 
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.max_quantity) }
                : i
            ),
            isOpen: true // auto open cart on add
          };
        }
        return { items: [...state.items, item], isOpen: true };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      getCartTotal: () => {
        return get().items.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
      },
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'agrilink-cart',
      // We only persist items, not the open state
      partialize: (state) => ({ items: state.items }),
    }
  )
);
