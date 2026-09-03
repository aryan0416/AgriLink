'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Leaf, TrendingUp, BarChart3, Truck, Box, ShieldCheck, User, Store, ArrowRight, Zap, Target, Smartphone } from 'lucide-react';

import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { useTranslation } from '@/lib/useTranslation';

// ─── Scroll Animation Hook ───────────────────────────
function useScrollAnimation() {
  useEffect(() => {
    const elements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.12 }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ─── Count-Up Hook ────────────────────────────────────
function useCountUp(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(e * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [active, target, duration]);
  return count;
}

// ─── Animated Counter Component ───────────────────────
function AnimatedStat({ value, label, prefix = '', suffix = '', color = 'text-emerald-900' }: {
  value: number; label: string; prefix?: string; suffix?: string; color?: string;
}) {
  const [active, setActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = useCountUp(value, 1500, active);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setActive(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <div className={`text-3xl sm:text-4xl font-black ${color}`}>
        {prefix}{count}{suffix}
      </div>
      <div className="text-xs font-medium text-emerald-800/60 mt-1">{label}</div>
    </div>
  );
}

const features = [
  { icon: Target, tag: 'Zero Middlemen', title: 'Direct Marketplace', description: 'Farmers list harvest directly to verified buyers. Eliminates 6 layers of intermediaries, returning 20–40% more income to growers.' },
  { icon: TrendingUp, tag: 'Facebook Prophet ML', title: 'Demand Forecasting', description: '14 to 90-day time series demand forecasts by crop, district, and festival calendar — minimizing post-harvest surplus.' },
  { icon: BarChart3, tag: 'Dynamic Margins', title: 'Price Intelligence', description: 'AI-recommended pricing derived from mandi arrivals, real-time supply listings, and local consumption signals.' },
  { icon: Truck, tag: 'OSRM Route Sequencing', title: 'Smart Logistics', description: 'Multi-pickup routing and pooled transport clustering that cuts transportation costs by 15–25% per quintal.' },
  { icon: Box, tag: 'Autonomous Splitting', title: 'Bulk Aggregation', description: 'Splits massive institutional buyer orders (10+ tons) across nearby cluster farmers seamlessly in one transaction.' },
  { icon: ShieldCheck, tag: 'MobileNetV2 Vision', title: 'Quality Assessment', description: 'Computer vision grading from photo uploads. Instant Grade A/B/C rating, freshness index, and surface defect checks.' },
];

const testimonials = [
  { name: 'Ramesh Patil', role: 'Tomato Farmer, Nashik', icon: User, quote: 'Earlier middlemen took 40% — now I get direct payment at 78% of buyer price. My income doubled in one season.' },
  { name: 'Priya Foods Ltd.', role: 'Wholesale Buyer, Pune', icon: Store, quote: 'Quality-graded produce delivered in 36 hours at consistent grades. Our procurement costs dropped by 22%.' },
  { name: 'Suresh Logistics', role: 'Transporter, Indore', icon: Truck, quote: 'OSRM routes fill my trucks at 90%+ capacity. No more empty return trips from mandis.' },
];

const supplyChainSteps = [
  { step: '01', icon: Leaf, title: 'Farmer Lists', desc: 'Posts produce lot with AI quality scan' },
  { step: '02', icon: Zap, title: 'AI Grades & Prices', desc: 'MobileNetV2 grades, Prophet prices' },
  { step: '03', icon: ShieldCheck, title: 'Buyer Matches', desc: 'Direct contract in minutes' },
  { step: '04', icon: Truck, title: 'OSRM Routes', desc: 'Pooled pickup, optimized delivery' },
  { step: '05', icon: Target, title: 'Verified & Paid', desc: 'Instant digital payment, full traceability' },
];

export default function HomePage() {
  const [activeDemoTab, setActiveDemoTab] = useState<'quality' | 'pricing'>('quality');
  const [demoCrop, setDemoCrop] = useState('Tomato');
  const [demoDistrict, setDemoDistrict] = useState('Pune');
  const [simulatedFreshness, setSimulatedFreshness] = useState(92);
  const [isScanning, setIsScanning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { t } = useTranslation();

  useScrollAnimation();

  const priceMap: Record<string, Record<string, { mandi: number; low: number; high: number }>> = {
    Tomato: { Pune: { mandi: 24.5, low: 28, high: 31.5 }, Nashik: { mandi: 22, low: 26, high: 29 }, Indore: { mandi: 20, low: 24, high: 27 }, Jaipur: { mandi: 18, low: 22, high: 25 } },
    Onion: { Pune: { mandi: 18, low: 21, high: 24 }, Nashik: { mandi: 16, low: 19, high: 22 }, Indore: { mandi: 15, low: 18, high: 21 }, Jaipur: { mandi: 14, low: 17, high: 20 } },
    Potato: { Pune: { mandi: 14, low: 17, high: 19 }, Nashik: { mandi: 13, low: 16, high: 18 }, Indore: { mandi: 12, low: 15, high: 17 }, Jaipur: { mandi: 11, low: 14, high: 16 } },
    Rice: { Pune: { mandi: 42, low: 48, high: 54 }, Nashik: { mandi: 40, low: 46, high: 52 }, Indore: { mandi: 38, low: 44, high: 50 }, Jaipur: { mandi: 36, low: 42, high: 48 } },
  };

  const priceData = priceMap[demoCrop]?.[demoDistrict] || { mandi: 20, low: 24, high: 28 };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setSimulatedFreshness(Math.floor(Math.random() * 14) + 85);
      setIsScanning(false);
    }, 1100);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed top-[-15%] left-[-8%] w-[700px] h-[700px] bg-emerald-200/35 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-[40%] right-[-12%] w-[600px] h-[600px] bg-amber-100/35 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-12%] left-[25%] w-[500px] h-[500px] bg-green-100/45 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* ── Navbar ─────────────────────────────────── */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-green-700 to-emerald-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-950 via-emerald-800 to-green-700 bg-clip-text text-transparent">
                {t.home.title}
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 border border-green-200">
                SIH 2026
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-emerald-900/80">
            <Link href="/marketplace" className="hover:text-green-700 transition-colors">{t.nav.marketplace}</Link>
            <Link href="/analytics" className="hover:text-green-700 transition-colors">{t.nav.analytics}</Link>
            <Link href="/how-to-use" className="hover:text-green-700 transition-colors">{t.nav.how_to_use}</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">{t.nav.login}</Link>
            <Link href="/register" className="btn-primary text-sm px-5 py-2">{t.home.get_started} →</Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-emerald-900 hover:bg-white/60 transition-colors"
          >
            <div className="w-5 space-y-1.5">
              <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-900/8 bg-white/90 backdrop-blur-lg py-4 px-4 space-y-2 animate-fade-in">
            {[
              { href: '/marketplace', label: 'Marketplace', icon: '' },
              { href: '/analytics', label: 'AI Intelligence', icon: '' },
              { href: '#how-it-works', label: 'How It Works', icon: '️' },
              { href: '#impact', label: 'Impact', icon: '' },
            ].map((item) => (
              <a key={item.href} href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-emerald-900 font-medium hover:bg-green-50 transition-colors">
                <span>{item.icon}</span><span>{item.label}</span>
              </a>
            ))}
            <div className="flex gap-3 pt-3 border-t border-emerald-900/10">
              <Link href="/login" className="btn-secondary flex-1 text-sm py-2.5" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link href="/register" className="btn-primary flex-1 text-sm py-2.5" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ──────────────────────────────── */}
      <section className="pt-14 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-7">
            {/* Hackathon badge */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/85 border border-green-200/80 shadow-sm backdrop-blur-sm text-green-800">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Smart India Hackathon 2026 | PS 26033
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-emerald-950 leading-[1.10] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {t.home.hero_title_1}<br className="hidden sm:block" /> {t.home.hero_title_2}{' '}
              <span className="gradient-text">
                {t.home.hero_title_highlight}
              </span>
            </h1>

            <p className="text-lg text-emerald-900/70 max-w-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {t.home.hero_desc}
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/register" className="btn-primary text-base px-8 py-3.5">
                <span>{t.home.start_farmer}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link href="/marketplace" className="btn-secondary text-base px-8 py-3.5">
                <span>{t.home.browse_market}</span>
                <Store className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-emerald-900/10 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <AnimatedStat value={35} label={t.home.stat_income} suffix="%" color="text-emerald-900" />
              <AnimatedStat value={22} label={t.home.stat_logistics} prefix="-" suffix="%" color="text-green-700" />
              <AnimatedStat value={50} label={t.home.stat_waste} suffix="%" color="text-amber-700" />
            </div>
          </div>

          {/* Hero AI Demo Card */}
          <div className="lg:col-span-5 relative animate-slide-in-right">
            <div className="glass-panel p-6 sm:p-7 relative z-10 shadow-2xl">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-emerald-900/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-green-700 uppercase tracking-wider">Live AI Engine Demo</div>
                    <div className="text-sm font-semibold text-emerald-950">Produce Intelligence Console</div>
                  </div>
                </div>
                <span className="badge-green">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                  Online
                </span>
              </div>

              {/* Tab Switcher */}
              <div className="flex bg-emerald-900/5 p-1 rounded-xl my-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveDemoTab('quality')}
                  className={`flex-1 py-2 rounded-lg transition-all ${activeDemoTab === 'quality' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-900/55 hover:text-emerald-900'}`}
                >
                   Quality Vision AI
                </button>
                <button
                  onClick={() => setActiveDemoTab('pricing')}
                  className={`flex-1 py-2 rounded-lg transition-all ${activeDemoTab === 'pricing' ? 'bg-white text-emerald-900 shadow-sm' : 'text-emerald-900/55 hover:text-emerald-900'}`}
                >
                   Price Intelligence
                </button>
              </div>

              {activeDemoTab === 'quality' ? (
                <div className="space-y-4 animate-scale-in">
                  <div className="p-4 rounded-xl bg-white/65 border border-emerald-900/10 space-y-3">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>Produce Sample:</span>
                      <span className="font-semibold text-emerald-900">Pune Hydroponic Tomatoes</span>
                    </div>
                    <div className="h-28 rounded-xl bg-gradient-to-br from-red-50 to-orange-100 flex flex-col items-center justify-center border border-dashed border-red-200/70 relative overflow-hidden">
                      <span className={`text-5xl ${isScanning ? 'animate-bounce' : 'animate-float-slow'}`}></span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isScanning && (
                          <div className="absolute w-full h-0.5 bg-green-400/60 animate-bounce" style={{ top: '50%' }} />
                        )}
                      </div>
                      <div className="absolute bottom-2 text-[11px] font-medium text-emerald-900/70 bg-white/80 px-2.5 py-0.5 rounded-full">
                        {isScanning ? 'Analyzing pixel distribution...' : ' MobileNetV2 Ready'}
                      </div>
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-emerald-950">Freshness Index</span>
                        <span className="text-green-700 font-bold">{simulatedFreshness}%</span>
                      </div>
                      <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-700"
                          style={{ width: `${simulatedFreshness}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="badge-green">Grade A Quality</span>
                        <span className="text-gray-400 text-[11px]">0.98 Confidence</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSimulateScan} disabled={isScanning} className="btn-primary w-full py-2.5 text-xs font-bold uppercase tracking-wider">
                    {isScanning ? 'Scanning Produce...' : 'Scan Another Batch'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-scale-in">
                  <div className="p-4 rounded-xl bg-white/65 border border-emerald-900/10 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1 font-medium">Crop</label>
                        <select value={demoCrop} onChange={(e) => setDemoCrop(e.target.value)} className="input-field text-xs py-1.5">
                          {['Tomato', 'Onion', 'Potato', 'Rice'].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 block mb-1 font-medium">District</label>
                        <select value={demoDistrict} onChange={(e) => setDemoDistrict(e.target.value)} className="input-field text-xs py-1.5">
                          {['Pune', 'Nashik', 'Indore', 'Jaipur'].map((d) => <option key={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="p-3 bg-green-50/80 rounded-xl border border-green-200/60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Current Mandi Price:</span>
                        <span className="font-semibold text-gray-900">₹{priceData.mandi.toFixed(2)} / kg</span>
                      </div>
                      <div className="flex justify-between text-green-900 font-bold text-sm">
                        <span>AI Recommended Sell:</span>
                        <span className="text-green-700">₹{priceData.low} — ₹{priceData.high}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-emerald-700">
                        <span>Signal: High Local Demand</span>
                        <span>Margin: +{Math.round(((priceData.high - priceData.mandi) / priceData.mandi) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/analytics" className="btn-primary block text-center w-full py-2.5 text-xs font-bold uppercase tracking-wider">
                    Explore Full Price Forecast →
                  </Link>
                </div>
              )}
            </div>
            {/* Decorative */}
            <div className="absolute -top-5 -right-5 w-32 h-32 bg-green-400/15 rounded-2xl blur-2xl -z-10 animate-float" />
            <div className="absolute -bottom-5 -left-5 w-36 h-36 bg-amber-400/15 rounded-2xl blur-2xl -z-10 animate-float-slow" />
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll">
          <span className="section-tag">The AgriLink Flow</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950">From farm gate to buyer in 5 steps</h2>
          <p className="text-emerald-900/60 text-base mt-3">Automated, transparent, and traceable — every single transaction.</p>
        </div>

        <div className="relative">
          {/* Connector line - desktop only */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-green-300 to-transparent" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {supplyChainSteps.map((step, i) => (
              <div key={i} className={`animate-on-scroll stagger-${i + 1} text-center group`}>
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/80 border-2 border-green-200/70 flex flex-col items-center justify-center shadow-sm group-hover:border-green-400 group-hover:shadow-glass-hover transition-all duration-300 mb-3 relative">
                  <step.icon className="w-7 h-7 text-green-700" />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                    {step.step}
                  </span>
                </div>
                <div className="font-bold text-sm text-emerald-950">{step.title}</div>
                <div className="text-xs text-gray-500 mt-1">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Traditional vs AgriLink ─────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 animate-on-scroll">
          <span className="section-tag">Supply Chain Transformation</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950">Why direct agricultural commerce changes the game</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-8 border-rose-200/50 bg-white/70 animate-on-scroll">
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Traditional Fragmentation</span>
              <span className="text-rose-500 font-semibold text-sm">6 Middlemen</span>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: <Truck className="w-5 h-5" />, text: 'Farmer receives only 20–30% of end consumer price' },
                { icon: <Truck className="w-5 h-5" />, text: 'Individual uncoordinated truck trips with high deadhead mileage' },
                { icon: <TrendingUp className="w-5 h-5" />, text: '30–40% produce spoiled due to lack of demand forecasting' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-sm">
                  <span className="text-rose-500 mt-0.5">{item.icon}</span>
                  <div className="text-gray-700">{item.text}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 font-medium pt-4 border-t border-gray-100">Average turnaround: 4–6 days • Zero traceability</div>
          </div>

          <div className="glass-card p-8 border-emerald-300/70 bg-white/80 shadow-[0_14px_40px_0_rgba(20,83,45,0.14)] animate-on-scroll stagger-2">
            <div className="flex items-center justify-between mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-900 border border-green-200"> AgriLink AI Model</span>
              <span className="text-green-700 font-bold text-sm">Direct & Optimized</span>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: <Leaf className="w-5 h-5" />, text: 'Farmer realizes 70–85% of buyer payout via direct digital contracts' },
                { icon: <Target className="w-5 h-5" />, text: 'OSRM multi-pickup route planning clustering local FPO pickups' },
                { icon: <BarChart3 className="w-5 h-5" />, text: 'Predictive demand signals ensure produce moves before spoilage' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-100 text-sm">
                  <span className="text-emerald-700 mt-0.5">{item.icon}</span>
                  <div className="font-medium text-emerald-950">{item.text}</div>
                </div>
              ))}
            </div>
            <div className="text-xs text-green-700 font-semibold pt-4 border-t border-emerald-100 flex justify-between">
              <span>Direct Farm-to-Buyer in 24–48 Hours</span>
              <span> 100% Quality Inspected</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll">
          <span className="section-tag">Core Modules</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950">Intelligent tools for every stakeholder</h2>
          <p className="text-emerald-900/60 text-base mt-3">Built for farmers, FPOs, wholesale buyers, retailers, and transporter fleets.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className={`glass-card-hover p-7 flex flex-col justify-between group animate-on-scroll stagger-${(i % 6) + 1}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-2.5 rounded-2xl bg-white/90 border border-emerald-900/10 shadow-sm inline-block group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-7 h-7 text-green-700" />
                  </span>
                  <span className="text-[11px] font-bold text-green-700 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-emerald-950 mb-2">{feature.title}</h3>
                <p className="text-sm text-emerald-900/65 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 animate-on-scroll">
          <span className="section-tag">Early Pilot Stories</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-emerald-950">Trusted by farmers, buyers, and transporters</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className={`glass-card p-7 animate-on-scroll stagger-${i + 1}`}>
              <div className="text-4xl mb-4">"</div>
              <p className="text-sm text-emerald-900/80 leading-relaxed mb-5">{t.quote}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-emerald-900/10">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <t.icon className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <div className="font-bold text-sm text-emerald-950">{t.name}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Impact Banner ─────────────────────────────── */}
      <section id="impact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="glass-panel p-8 sm:p-12 relative overflow-hidden bg-gradient-to-br from-green-900 via-emerald-900 to-emerald-950 text-white border-none shadow-2xl animate-on-scroll">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-green-300 border border-white/20 mb-4">
              Impact Projections
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Targeted Economic & Environmental Impact</h2>
            <p className="text-emerald-100/65 text-sm sm:text-base mt-3">
              Quantifiable metrics aligning with Ministry of Consumer Affairs goals for reducing food inflation and post-harvest wastage.
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { value: '20–40%', label: 'Farmer Income Uplift', sub: 'Via direct buyer pricing', color: 'text-green-300' },
              { value: '15–25%', label: 'Logistics Cost Savings', sub: 'Via OSRM route clustering', color: 'text-amber-300' },
              { value: '30–50%', label: 'Wastage Reduction', sub: 'Through demand-supply sync', color: 'text-emerald-300' },
              { value: '100%', label: 'Price Transparency', sub: 'Public mandi benchmark', color: 'text-teal-300' },
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-2xl bg-white/8 backdrop-blur-md border border-white/10 text-center animate-on-scroll stagger-${i + 1}`}>
                <div className={`text-3xl sm:text-4xl font-black ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs sm:text-sm font-medium text-emerald-100">{stat.label}</div>
                <div className="text-[11px] text-emerald-200/55 mt-1">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* CTA inside banner */}
          <div className="relative z-10 mt-12 text-center">
            <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-green-800 font-bold text-sm hover:bg-green-50 transition-all shadow-lg">
              <span>Join AgriLink AI Today</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────── */}
      <footer className="glass-nav mt-8 py-10 border-t border-emerald-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-green-700 to-emerald-500 flex items-center justify-center text-white text-lg"></div>
              <div>
                <div className="font-extrabold text-emerald-950">AgriLink AI</div>
                <div className="text-xs text-gray-500">Smart India Hackathon 2026</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-5 text-sm font-medium text-emerald-900/70">
              <Link href="/marketplace" className="hover:text-green-700">Marketplace</Link>
              <Link href="/analytics" className="hover:text-green-700">Analytics</Link>
              <Link href="/login" className="hover:text-green-700">Sign In</Link>
              <Link href="/register" className="hover:text-green-700">Register</Link>
            </div>
            <div className="text-xs text-emerald-900/50 text-center sm:text-right">
              PS 26033 | Ministry of Consumer Affairs, Food & Public Distribution
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
