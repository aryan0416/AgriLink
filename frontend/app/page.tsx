'use client';

import Link from 'next/link';

const features = [
  {
    icon: '🌾',
    title: 'Direct Marketplace',
    description: 'Farmers sell directly to buyers — no middlemen, better prices.',
  },
  {
    icon: '🤖',
    title: 'AI Demand Forecasting',
    description: 'Predict demand by crop, region, and season to plan better.',
  },
  {
    icon: '💰',
    title: 'Price Intelligence',
    description: 'AI-recommended pricing based on market signals and demand.',
  },
  {
    icon: '🚚',
    title: 'Smart Logistics',
    description: 'Optimized routes, shared transport, and real-time tracking.',
  },
  {
    icon: '📦',
    title: 'Bulk Aggregation',
    description: 'Split large orders across multiple farmers automatically.',
  },
  {
    icon: '📸',
    title: 'Quality Assessment',
    description: 'AI-powered produce grading from photos.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-bold text-brand-700">AgriLink AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-harvest-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="animate-pulse">🟢</span>
              Smart India Hackathon 2026
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Connect the farm to demand.
              <span className="text-brand-600"> Use AI to optimize.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              AgriLink AI is a direct agricultural marketplace with intelligent logistics,
              demand forecasting, and price intelligence — empowering farmers and buyers
              to make smarter decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg px-8 py-3">
                I'm a Farmer 🌾
              </Link>
              <Link href="/register" className="btn-harvest text-lg px-8 py-3">
                I'm a Buyer 🛒
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-harvest-200/30 rounded-full blur-3xl" />
      </section>

      {/* Value proposition */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              The traditional supply chain
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-lg flex-wrap">
              <span>Farmers</span>
              <span className="text-red-400">→</span>
              <span>Aggregator</span>
              <span className="text-red-400">→</span>
              <span>Trader</span>
              <span className="text-red-400">→</span>
              <span>Wholesaler</span>
              <span className="text-red-400">→</span>
              <span>Retailer</span>
              <span className="text-red-400">→</span>
              <span>Consumer</span>
            </div>
            <p className="text-gray-500 mt-3">6 intermediaries. Low price transparency. High wastage.</p>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              AgriLink AI simplifies it
            </h2>
            <div className="flex items-center justify-center gap-4 text-lg flex-wrap">
              <span className="badge-green text-base">Farmers</span>
              <span className="text-brand-500 text-2xl">⟷</span>
              <span className="badge-harvest bg-harvest-100 text-harvest-800 text-base">AgriLink AI</span>
              <span className="text-brand-500 text-2xl">⟷</span>
              <span className="badge-blue text-base">Buyers</span>
            </div>
            <p className="text-gray-500 mt-3">Direct connection. AI-optimized decisions. Better for everyone.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Intelligent agriculture, powered by AI
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="card hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section className="py-20 bg-brand-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Expected Impact</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">20-40%</div>
              <div className="text-brand-200">Farmer Income Improvement</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15-25%</div>
              <div className="text-brand-200">Logistics Cost Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">30-50%</div>
              <div className="text-brand-200">Wastage Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100%</div>
              <div className="text-brand-200">Price Transparency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>AgriLink AI — Smart India Hackathon 2026 | Problem Statement 26033</p>
          <p className="text-sm mt-2">Ministry of Consumer Affairs, Food & Public Distribution</p>
        </div>
      </footer>
    </div>
  );
}
