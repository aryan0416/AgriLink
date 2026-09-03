'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Sprout, Building, Store, User, Truck } from 'lucide-react';

const roles = [
  { value: 'farmer', label: 'Individual Farmer', icon: <Sprout className="w-5 h-5" />, color: 'border-green-300 bg-green-50', activeColor: 'border-green-600 bg-green-100 ring-2 ring-green-500/30', description: 'Sell fresh produce directly with zero middlemen commission' },
  { value: 'fpo', label: 'Farmer Producer Org', icon: <Building className="w-5 h-5" />, color: 'border-blue-200 bg-blue-50', activeColor: 'border-blue-500 bg-blue-100 ring-2 ring-blue-500/30', description: 'Aggregate and sell harvest lots for farmer collectives' },
  { value: 'buyer', label: 'Wholesale / Retail Buyer', icon: <Store className="w-5 h-5" />, color: 'border-amber-200 bg-amber-50', activeColor: 'border-amber-500 bg-amber-100 ring-2 ring-amber-500/30', description: 'Restaurants, supermarkets, and food processing units' },
  { value: 'consumer', label: 'Direct Consumer', icon: <User className="w-5 h-5" />, color: 'border-purple-200 bg-purple-50', activeColor: 'border-purple-500 bg-purple-100 ring-2 ring-purple-500/30', description: 'Procure farm-fresh vegetables and grains at fair rates' },
  { value: 'transporter', label: 'Logistics Transporter', icon: <Truck className="w-5 h-5" />, color: 'border-rose-200 bg-rose-50', activeColor: 'border-rose-500 bg-rose-100 ring-2 ring-rose-500/30', description: 'Accept OSRM-optimized multi-pickup route dispatches' },
];

const STEPS = ['Choose Role', 'Personal Info', 'Account Setup'];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('farmer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleNext = () => {
    setError('');
    if (step === 2) {
      if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError('');
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, role } },
      });

      if (authError) { setError(authError.message); return; }
      if (!authData.user) { setError('Registration failed. Please try again.'); return; }

      const { error: profileError } = await supabase.from('profiles').upsert({ id: authData.user.id, full_name: fullName, role, phone: phone || null });
      if (profileError) console.error('Profile upsert error:', profileError);

      const dashboardPath = `/dashboard/${role}`;
      router.push(dashboardPath);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 relative overflow-hidden">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-green-200/40 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-100/40 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-green-700 to-emerald-500 flex items-center justify-center text-white text-2xl shadow-sm hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <span className="text-2xl font-extrabold text-emerald-950">AgriLink AI</span>
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-950">Create your account</h1>
            <p className="text-sm text-emerald-900/60 mt-1">Join thousands of farmers and buyers on India's smartest agri-marketplace</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i + 1 < step ? 'bg-green-600 text-white' : i + 1 === step ? 'bg-green-700 text-white ring-4 ring-green-500/25' : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}>
                  {i + 1 < step ? '' : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${i + 1 <= step ? 'text-green-800' : 'text-gray-400'}`}>{label}</span>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 rounded-full mx-2 hidden sm:block" style={{ minWidth: '40px' }}>
                    <div className="h-full bg-green-600 rounded-full transition-all duration-500" style={{ width: i + 1 < step ? '100%' : '0%' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Mobile progress bar */}
          <div className="sm:hidden h-1.5 bg-gray-200 rounded-full">
            <div className="h-full bg-gradient-to-r from-green-600 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="glass-panel p-7 sm:p-9 shadow-2xl">
          {error && (
            <div className="flex items-start gap-3 bg-rose-50 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium border border-rose-200 mb-6 animate-scale-in">
              <span className="text-base">!</span><span>{error}</span>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-5 animate-scale-in">
              <div>
                <h2 className="text-xl font-bold text-emerald-950 mb-1">What describes you best?</h2>
                <p className="text-sm text-emerald-900/60">Your role determines your dashboard features.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all duration-200 ${
                      role === r.value ? r.activeColor : `${r.color} hover:border-opacity-70`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-emerald-950">{r.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.description}</div>
                      </div>
                      {role === r.value && (
                        <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] shrink-0"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={handleNext} className="btn-primary w-full py-3.5 text-sm font-bold">
                Continue as {roles.find(r => r.value === role)?.label} →
              </button>
            </div>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <form className="space-y-5 animate-scale-in" onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
              <div>
                <h2 className="text-xl font-bold text-emerald-950 mb-1">Personal Information</h2>
                <p className="text-sm text-emerald-900/60">We need a few details to set up your account.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input type="text" className="input-field" placeholder="Ramesh Patil" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Mobile Number (Optional)</label>
                  <input type="tel" className="input-field" placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 py-3">← Back</button>
                <button type="submit" className="btn-primary flex-1 py-3 font-bold">Continue →</button>
              </div>
            </form>
          )}

          {/* Step 3: Account Setup */}
          {step === 3 && (
            <form className="space-y-5 animate-scale-in" onSubmit={handleRegister}>
              <div>
                <h2 className="text-xl font-bold text-emerald-950 mb-1">Create your credentials</h2>
                <p className="text-sm text-emerald-900/60">Secure your {roles.find(r => r.value === role)?.label} account.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Email Address *</label>
                  <input type="email" className="input-field" placeholder="you@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Password *</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} className="input-field pr-12" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{showPass ? 'Hide' : 'Show'}</button>
                  </div>
                  {password && (
                    <div className="flex gap-1 mt-2">
                      {[password.length >= 6, /[A-Z]/.test(password), /[0-9]/.test(password)].map((ok, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${ok ? 'bg-green-500' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Confirm Password *</label>
                  <input type="password" className="input-field" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>

              {/* Summary card */}
              <div className="p-4 rounded-xl bg-green-50/80 border border-green-200/60 text-xs space-y-1.5">
                <div className="font-bold text-green-800 mb-2">Account Summary</div>
                <div className="flex justify-between text-gray-600"><span>Role:</span><span className="font-semibold text-emerald-900">{roles.find(r => r.value === role)?.label}</span></div>
                <div className="flex justify-between text-gray-600"><span>Name:</span><span className="font-semibold text-emerald-900">{fullName}</span></div>
                {phone && <div className="flex justify-between text-gray-600"><span>Phone:</span><span className="font-semibold text-emerald-900">{phone}</span></div>}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 py-3">← Back</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5 font-bold">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-emerald-900/65">
            Already have an account?{' '}
            <Link href="/login" className="text-green-700 font-bold hover:underline">Sign In →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
