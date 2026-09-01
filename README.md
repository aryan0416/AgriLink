# 🌾 AgriLink AI

**AI-Powered Direct Agricultural Marketplace with Intelligent Logistics & Demand Forecasting**

Smart India Hackathon 2026 | Problem Statement 26033
Ministry of Consumer Affairs, Food & Public Distribution

---

## 🎯 What is AgriLink AI?

AgriLink AI is a digital agricultural commerce and intelligence platform that connects farmers and FPOs directly with consumers, retailers, restaurants, and institutional buyers. It combines:

- **Direct Marketplace** — Farmers sell directly to buyers, no middlemen
- **AI Demand Forecasting** — Predict demand by crop, region, and season
- **Price Intelligence** — AI-recommended pricing based on market signals
- **Smart Logistics** — Optimized routes, shared transport, real-time tracking
- **Bulk Aggregation** — Split large orders across multiple farmers automatically
- **Quality Assessment** — AI-powered produce grading from photos
- **AgriTrust Score** — Performance-based trust system

## 🏗️ Architecture

```
Frontend (Next.js)  →  Backend (FastAPI)  →  Supabase (PostgreSQL + Auth + Storage)
                            ↓
                    AI/ML Services (Python)
                    - Prophet demand forecasting
                    - Price intelligence engine
                    - OSRM route optimization
                    - CV quality assessment
                    - AgriTrust scoring
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Supabase project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/aryan0416/AgriLink.git
cd AgriLink

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migration in the Supabase SQL Editor:
   - Go to `supabase/migrations/001_initial_schema.sql`
   - Copy the contents and run in SQL Editor
3. Update `.env` files with your Supabase credentials:
   - `backend/.env`
   - `frontend/.env.local`

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Seed Demo Data (Optional)

```bash
cd backend
python -m app.seed.seed_data
```

## 📁 Project Structure

```
AgriLink/
├── frontend/               # Next.js app (TypeScript, Tailwind)
│   ├── app/                # Pages and layouts
│   │   ├── (auth)/         # Login, register
│   │   ├── (dashboard)/    # Role-based dashboards
│   │   ├── marketplace/    # Produce browsing
│   │   └── analytics/      # Demand forecast, price intel
│   ├── components/         # Reusable UI components
│   └── lib/                # Supabase client, API client
│
├── backend/                # FastAPI app (Python)
│   ├── app/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # AI/ML business logic
│   │   ├── models/         # Pydantic schemas
│   │   ├── auth/           # JWT authentication
│   │   └── seed/           # Demo data generator
│   └── ml_models/          # Trained model artifacts
│
├── supabase/
│   └── migrations/         # SQL schema
│
└── docker-compose.yml      # Redis for caching
```

## 🧪 MVP Modules (Hackathon Scope)

| # | Module | Status |
|---|--------|--------|
| 1 | Farmer & Buyer Registration (role-based) | ✅ |
| 2 | Produce Listings & Search | ✅ |
| 3 | Bulk Order Aggregation | ✅ |
| 4 | Demand Forecast Dashboard | ✅ |
| 5 | Price Recommendation Module | ✅ |
| 6 | Vehicle Matching & Route Optimization | ✅ |
| 7 | Image-based Quality Classification | ✅ |
| 8 | Order Lifecycle & Tracking | ✅ |
| 9 | Impact Dashboard | ✅ |

## 🎯 Expected Impact

- **20-40%** Farmer income improvement (via direct market access)
- **15-25%** Logistics cost reduction (via route optimization)
- **30-50%** Wastage reduction (via demand-supply matching)

## 🔐 Security

- JWT-based authentication via Supabase Auth
- Row-Level Security (RLS) on all tables
- Role-based access control (farmer, buyer, transporter, admin)
- Encrypted data in transit and at rest

## 📄 License

Built for Smart India Hackathon 2026

---

*"Connect the farm directly to demand, then use AI to optimize the decisions in between."*
