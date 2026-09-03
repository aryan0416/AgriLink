'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Sprout } from 'lucide-react';

const loginStats = [
  { value: '2,400+', label: 'Active Farmers' },
  { value: '₹4.2 Cr', label: 'Revenue Transacted' },
  { value: '98.4%', label: 'On-Time Delivery' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) { setError(authError.message); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      let role = profile?.role;
      if (!role && data.user.user_metadata?.role) {
        role = data.user.user_metadata.role;
        supabase.from('profiles').update({ role }).eq('id', data.user.id).then();
      }
      role = role || 'consumer';
      const dashboardPath = `/dashboard/${role}`;
      router.push(dashboardPath);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background ambient */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-200/40 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[130px] pointer-events-none" />

      {/* Left Panel — Brand Story */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-gradient-to-br from-green-900 via-emerald-900 to-green-950 text-white relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-green-400/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-5%] left-[-5%] w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight">AgriLink AI</div>
              <div className="text-[11px] text-green-300 font-bold uppercase tracking-wider">Direct Agricultural Exchange</div>
            </div>
          </Link>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-green-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Smart India Hackathon 2026 · PS 26033
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.15]">
            Farm to buyer,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-200">zero middlemen.</span>
          </h1>
          <p className="text-emerald-100/70 leading-relaxed">
            Sign in to access your AI-powered agricultural dashboard — real-time demand forecasts, quality grading, and direct market pricing.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {loginStats.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-xl bg-white/8 border border-white/10">
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-[11px] text-emerald-200/70 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <div className="p-4 rounded-2xl bg-white/8 border border-white/10">
            <p className="text-sm text-emerald-100/80 italic">"AgriLink doubled my income in one season — I now sell directly to hotels at real market price."</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-lg">U</div>
              <div>
                <div className="text-sm font-semibold">Ramesh Patil</div>
                <div className="text-[11px] text-green-300">Tomato Farmer, Nashik</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-700 to-emerald-500 flex items-center justify-center text-white text-2xl shadow-sm">A</div>
              <span className="text-2xl font-extrabold text-emerald-950">AgriLink AI</span>
            </Link>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-emerald-950">Welcome back</h2>
            <p className="text-sm text-emerald-900/60 mt-2">Sign in to your agricultural exchange account</p>
          </div>

          <div className="glass-panel p-8 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 bg-rose-50 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium border border-rose-200 animate-scale-in">
                  <span className="text-base mt-0.5">!</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm font-bold">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : 'Sign In to Portal →'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-emerald-900/8 text-center text-sm text-emerald-900/70">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-green-700 font-bold hover:underline">Create Account →</Link>
            </div>
          </div>

          {/* Role hint */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Farmer', 'Buyer', 'Transporter', 'Admin'].map((role) => (
              <span key={role} className="badge-organic text-xs">{role}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
