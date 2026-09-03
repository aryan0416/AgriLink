'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Home, Sprout, ClipboardList, Store, TrendingUp, Search, 
  Package, Truck, Settings, LogOut, Menu, ShoppingCart, Bell, User
} from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

const navByRole: Record<string, { label: string; href: string; icon: any }[]> = {
  farmer: [
    { label: 'Overview', href: '/dashboard/farmer', icon: Home },
    { label: 'My Listings', href: '/dashboard/farmer/listings', icon: Sprout },
    { label: 'Incoming Orders', href: '/dashboard/farmer/orders', icon: ClipboardList },
    { label: 'Produce Market', href: '/marketplace', icon: Store },
    { label: 'AI Intelligence', href: '/analytics', icon: TrendingUp },
  ],
  fpo: [
    { label: 'Cluster Hub', href: '/dashboard/fpo', icon: Home },
    { label: 'Marketplace', href: '/marketplace', icon: Store },
    { label: 'Analytics', href: '/analytics', icon: TrendingUp },
  ],
  buyer: [
    { label: 'Buyer Center', href: '/dashboard/buyer', icon: Home },
    { label: 'Marketplace', href: '/marketplace', icon: Search },
    { label: 'My Orders', href: '/dashboard/buyer/orders', icon: Package },
    { label: 'Price Intel', href: '/analytics', icon: TrendingUp },
  ],
  consumer: [
    { label: 'Overview', href: '/dashboard/consumer', icon: Home },
    { label: 'Fresh Marketplace', href: '/marketplace', icon: Search },
    { label: 'My Deliveries', href: '/dashboard/consumer/orders', icon: Package },
  ],
  transporter: [
    { label: 'Fleet Control', href: '/dashboard/transporter', icon: Truck },
    { label: 'Vehicles', href: '/dashboard/transporter/vehicles', icon: Settings },
    { label: 'Shipment Trips', href: '/dashboard/transporter/shipments', icon: Package },
  ],
  admin: [
    { label: 'Executive Admin', href: '/dashboard/admin', icon: Home },
    { label: 'AI Analytics', href: '/analytics', icon: TrendingUp },
    { label: 'Marketplace', href: '/marketplace', icon: Store },
  ],
};

const roleColors: Record<string, string> = {
  farmer: 'from-green-600 to-emerald-600',
  fpo: 'from-blue-600 to-cyan-600',
  buyer: 'from-amber-500 to-orange-500',
  consumer: 'from-purple-600 to-violet-600',
  transporter: 'from-rose-600 to-red-500',
  admin: 'from-slate-700 to-gray-700',
};

const roleBadge: Record<string, string> = {
  farmer: 'badge-green',
  fpo: 'badge-blue',
  buyer: 'badge-yellow',
  consumer: 'badge-purple',
  transporter: 'badge-red',
  admin: 'badge-silver',
};

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string>('consumer');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const toggleCart = useCartStore((state) => state.toggleCart);
  const isCartOpen = useCartStore((state) => state.isOpen);
  const cartItems = useCartStore((state) => state.items);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        let currentRole = profile.role;
        if (!currentRole && session.user.user_metadata?.role) {
          currentRole = session.user.user_metadata.role;
          supabase.from('profiles').update({ role: currentRole }).eq('id', session.user.id).then();
        }
        setRole(currentRole || 'consumer');
        setUserName(profile.full_name || session.user.email?.split('@')[0] || 'Agri User');
      } else if (session.user.user_metadata?.role) {
        setRole(session.user.user_metadata.role);
        setUserName(session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Agri User');
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-green-600 to-emerald-500 flex items-center justify-center animate-float shadow-lg">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <div className="text-emerald-900/70 font-semibold text-sm animate-pulse">Syncing workspace...</div>
          <div className="flex gap-1.5 justify-center">
            {[0, 0.15, 0.3].map((delay, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-green-500 animate-fade-in-up" style={{ animationDelay: `${delay}s`, animationIterationCount: 'infinite' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const nav = navByRole[role] || navByRole.consumer;
  const gradient = roleColors[role] || roleColors.farmer;
  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className="pb-5 border-b border-emerald-900/10 mb-5">
        <Link href={`/dashboard/${role}`} className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-sm`}>
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base text-emerald-950 block leading-tight tracking-tight">AgriLink AI</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${roleBadge[role]}`}>
              {role.toUpperCase()}
            </span>
          </div>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="space-y-1.5 flex-1">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/dashboard/${role}` && item.href !== '/dashboard/buyer' && item.href !== '/dashboard/farmer' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? `bg-gradient-to-r ${gradient} text-white shadow-sm shadow-${gradient.split('-')[1]}-500/20`
                  : 'text-emerald-950/65 hover:bg-white/80 hover:text-emerald-950'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-700/60 group-hover:text-emerald-700'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="pt-5 border-t border-emerald-900/10 mt-5 space-y-3">
        <div className="p-3 bg-white/60 rounded-2xl border border-emerald-900/10 flex items-center gap-3 transition-colors hover:bg-white/80 cursor-pointer">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white text-sm shadow-xs`}>
            {initials || '?'}
          </div>
          <div className="overflow-hidden flex-1 text-xs">
            <div className="font-bold text-emerald-950 truncate">{userName}</div>
            <div className="text-gray-400 capitalize text-[10px] flex items-center gap-1">
              <User className="w-3 h-3" /> {role} Account
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full text-xs font-bold text-rose-600 hover:bg-rose-50/80 p-2.5 rounded-xl transition-colors text-center border border-transparent hover:border-rose-100 flex items-center justify-center gap-2"
        >
          <LogOut className="w-3 h-3" /> Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex relative bg-[#f4faf5]">
      {/* Ambient background */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ── Desktop Sidebar ──────────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col shrink-0 bg-white/50 backdrop-blur-xl border-r border-emerald-900/5 min-h-screen p-5 sticky top-0 z-20">
        <SidebarContent />
      </aside>

      {/* ── Mobile: Top Header Bar ────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-emerald-900/10 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link href={`/dashboard/${role}`} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-sm`}>
            <Sprout className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm text-emerald-950">AgriLink AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={toggleCart} className="p-2 relative rounded-xl text-emerald-900 hover:bg-emerald-50 transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {cartItemCount > 99 ? '99+' : cartItemCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl text-emerald-900 hover:bg-emerald-50 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile Sidebar Overlay ───────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)} />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white/90 backdrop-blur-xl border-r border-emerald-900/10 p-5 flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── Main Content Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Top Header Bar (Persistent across authenticated pages) */}
        <header className="hidden md:flex h-20 shrink-0 items-center justify-between px-8 bg-white/40 backdrop-blur-md border-b border-emerald-900/5 z-10 sticky top-0">
          <div className="font-semibold text-sm text-emerald-900/70">
            {pathname.split('/').map(p => p ? p.charAt(0).toUpperCase() + p.slice(1) : '').filter(Boolean).join(' / ')}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-emerald-900/60 hover:text-emerald-900 hover:bg-white/60 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={toggleCart} className="p-2 relative text-emerald-900/60 hover:text-emerald-900 hover:bg-white/60 rounded-xl transition-all">
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>
            <div className="relative">
              <div 
                className={`w-8 h-8 rounded-full bg-gradient-to-tr ${gradient} flex items-center justify-center font-bold text-white text-xs shadow-sm ring-2 ring-white ml-2 cursor-pointer`}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                {initials || '?'}
              </div>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-3 w-48 bg-white/95 backdrop-blur-xl border border-emerald-900/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-top-right py-1">
                    <div className="px-4 py-2 border-b border-emerald-900/5 mb-1">
                      <div className="font-bold text-sm text-emerald-950 truncate">{userName}</div>
                      <div className="text-[10px] uppercase font-bold text-emerald-600">{role}</div>
                    </div>
                    <Link href="/profile" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-emerald-900/80 hover:bg-emerald-50 hover:text-emerald-900 transition-colors">
                      <User className="w-4 h-4" /> My Profile
                    </Link>
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-20 md:pt-6">
          {children}
        </main>
      </div>

      {/* ── Global Cart Slide-out ─────────────────────── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-emerald-950/20 backdrop-blur-sm transition-opacity" onClick={toggleCart} />
          <div className="relative w-full max-w-md h-full bg-white/95 backdrop-blur-xl shadow-2xl overflow-y-auto animate-slide-in-right p-6 flex flex-col border-l border-emerald-900/10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-900/10">
              <h2 className="text-xl font-extrabold text-emerald-950 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" /> Your Cart
              </h2>
              <button onClick={toggleCart} className="p-2 rounded-xl text-emerald-900 hover:bg-emerald-50 transition-colors">
                ✕
              </button>
            </div>

            {cartItemCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-emerald-900/40 space-y-3">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <p className="font-semibold">Your cart is empty.</p>
                <button onClick={() => { toggleCart(); router.push('/marketplace'); }} className="btn-secondary text-xs">Browse Market</button>
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-white/60 border border-emerald-900/10 hover:border-emerald-900/20 transition-all">
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                         <Sprout className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-emerald-950 truncate">{item.crop_name}</div>
                        <div className="text-[10px] font-semibold text-emerald-900/60 uppercase tracking-wider mb-1">Grade {item.grade}</div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => useCartStore.getState().updateQuantity(item.id, Math.max(50, item.quantity - 50))} className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center hover:bg-emerald-200">-</button>
                          <span className="text-xs font-bold text-emerald-950 w-10 text-center">{item.quantity} kg</span>
                          <button onClick={() => useCartStore.getState().updateQuantity(item.id, Math.min(item.max_quantity, item.quantity + 50))} className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center hover:bg-emerald-200">+</button>
                        </div>
                      </div>
                      <div className="text-right flex flex-col justify-between">
                        <button onClick={() => useCartStore.getState().removeItem(item.id)} className="text-xs text-rose-500 font-bold hover:text-rose-600 self-end">✕</button>
                        <div className="font-bold text-emerald-700 text-sm">₹{(item.quantity * item.unit_price).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-900/10 space-y-4">
                  <div className="flex justify-between font-extrabold text-lg text-emerald-950">
                    <span>Total</span>
                    <span className="text-emerald-700">₹{useCartStore.getState().getCartTotal().toLocaleString()}</span>
                  </div>
                  <button onClick={() => { toggleCart(); router.push('/checkout'); }} className="btn-primary w-full py-3.5 text-sm">
                    Secure Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
