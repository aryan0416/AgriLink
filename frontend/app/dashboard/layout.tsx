'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const navByRole: Record<string, { label: string; href: string; icon: string }[]> = {
  farmer: [
    { label: 'Dashboard', href: '/dashboard/farmer', icon: '📊' },
    { label: 'My Listings', href: '/dashboard/farmer/listings', icon: '🌾' },
    { label: 'Orders', href: '/dashboard/farmer/orders', icon: '📋' },
    { label: 'Marketplace', href: '/marketplace', icon: '🏪' },
    { label: 'Analytics', href: '/analytics', icon: '📈' },
  ],
  fpo: [
    { label: 'Dashboard', href: '/dashboard/farmer', icon: '📊' },
    { label: 'My Listings', href: '/dashboard/farmer/listings', icon: '🌾' },
    { label: 'Orders', href: '/dashboard/farmer/orders', icon: '📋' },
    { label: 'Analytics', href: '/analytics', icon: '📈' },
  ],
  buyer: [
    { label: 'Dashboard', href: '/dashboard/buyer', icon: '📊' },
    { label: 'Browse Produce', href: '/marketplace', icon: '🔍' },
    { label: 'My Orders', href: '/dashboard/buyer/orders', icon: '📋' },
    { label: 'Analytics', href: '/analytics', icon: '📈' },
  ],
  consumer: [
    { label: 'Dashboard', href: '/dashboard/buyer', icon: '📊' },
    { label: 'Browse Produce', href: '/marketplace', icon: '🔍' },
    { label: 'My Orders', href: '/dashboard/buyer/orders', icon: '📋' },
  ],
  transporter: [
    { label: 'Dashboard', href: '/dashboard/transporter', icon: '📊' },
    { label: 'My Vehicles', href: '/dashboard/transporter/vehicles', icon: '🚚' },
    { label: 'Shipments', href: '/dashboard/transporter/shipments', icon: '📦' },
  ],
  admin: [
    { label: 'Dashboard', href: '/dashboard/admin', icon: '📊' },
    { label: 'Impact Metrics', href: '/analytics', icon: '📈' },
    { label: 'Users', href: '/dashboard/admin', icon: '👥' },
  ],
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setRole(profile.role || 'consumer');
        setUserName(profile.full_name || session.user.email || '');
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
        <div className="text-brand-600 text-lg">Loading...</div>
      </div>
    );
  }

  const nav = navByRole[role] || navByRole.consumer;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="text-lg font-bold text-brand-700">AgriLink AI</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== `/dashboard/${role}` && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-sm font-bold text-brand-700">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-900 truncate">{userName}</div>
              <div className="text-gray-500 capitalize">{role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
