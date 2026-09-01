'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const roles = [
  { value: 'farmer', label: 'Farmer', icon: '🌾', description: 'Sell your produce directly' },
  { value: 'fpo', label: 'FPO', icon: '🏛️', description: 'Manage farmer collectives' },
  { value: 'buyer', label: 'Buyer', icon: '🏪', description: 'Restaurants, retailers, processors' },
  { value: 'consumer', label: 'Consumer', icon: '🛒', description: 'Buy fresh produce' },
  { value: 'transporter', label: 'Transporter', icon: '🚚', description: 'Provide logistics services' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Registration failed');
        return;
      }

      // 2. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: fullName,
        role: role,
        phone: phone || null,
      });

      if (profileError) {
        console.warn('Profile insert error:', profileError);
        // Continue anyway — RLS might handle it
      }

      // 3. Redirect to dashboard
      router.push(`/dashboard/${role}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-harvest-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-3xl">🌾</span>
            <span className="text-2xl font-bold text-brand-700">AgriLink AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-600 mt-1">Join the agricultural marketplace</p>
        </div>

        <div className="card">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">I am a...</h2>
              <div className="grid grid-cols-1 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => { setRole(r.value); setStep(2); }}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      role === r.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-3xl">{r.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{r.label}</div>
                      <div className="text-sm text-gray-500">{r.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleRegister} className="space-y-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Change role
              </button>

              <div className="bg-brand-50 px-4 py-2 rounded-lg text-sm text-brand-700">
                Registering as: <strong>{roles.find(r => r.value === role)?.label}</strong>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-600 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
