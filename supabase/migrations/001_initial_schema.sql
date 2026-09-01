-- =====================================================
-- AgriLink AI — Database Schema
-- Smart India Hackathon 2026 | Problem Statement 26033
-- =====================================================

-- Enable PostGIS for geospatial queries (if available)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ─── Profiles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT 'consumer' CHECK (role IN ('farmer', 'fpo', 'buyer', 'consumer', 'transporter', 'admin')),
    phone TEXT,
    district TEXT,
    state TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Products (Produce Listings) ──────────────────────
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety TEXT,
    grade TEXT DEFAULT 'B' CHECK (grade IN ('A', 'B', 'C')),
    quantity_kg DOUBLE PRECISION NOT NULL CHECK (quantity_kg > 0),
    unit_price DOUBLE PRECISION NOT NULL CHECK (unit_price > 0),
    harvest_date DATE NOT NULL,
    shelf_life_days INTEGER DEFAULT 7 CHECK (shelf_life_days > 0),
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Orders ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    order_type TEXT DEFAULT 'retail' CHECK (order_type IN ('retail', 'bulk', 'subscription')),
    total_amount DOUBLE PRECISION DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'aggregating', 'in_transit', 'delivered', 'cancelled')),
    delivery_address TEXT NOT NULL,
    delivery_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Order Items ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_kg DOUBLE PRECISION NOT NULL CHECK (quantity_kg > 0),
    price_per_kg DOUBLE PRECISION NOT NULL,
    farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'fulfilled'))
);

-- ─── Vehicles ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('truck', 'van', 'bike', 'tempo')),
    capacity_kg DOUBLE PRECISION NOT NULL CHECK (capacity_kg > 0),
    registration_no TEXT NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Shipments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    pickup_points JSONB DEFAULT '[]',
    route JSONB DEFAULT '{}',
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered')),
    eta TIMESTAMPTZ,
    actual_delivery TIMESTAMPTZ,
    distance_km DOUBLE PRECISION,
    cost DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Market Prices ────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name TEXT NOT NULL,
    district TEXT NOT NULL,
    market_name TEXT,
    price_per_kg DOUBLE PRECISION NOT NULL,
    date DATE NOT NULL,
    source TEXT DEFAULT 'manual'
);

-- ─── Demand Forecasts ─────────────────────────────────
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name TEXT NOT NULL,
    district TEXT NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_demand_kg DOUBLE PRECISION NOT NULL,
    confidence_lower DOUBLE PRECISION,
    confidence_upper DOUBLE PRECISION,
    model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Quality Assessments ──────────────────────────────
CREATE TABLE IF NOT EXISTS quality_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    grade TEXT CHECK (grade IN ('A', 'B', 'C')),
    freshness_score DOUBLE PRECISION CHECK (freshness_score >= 0 AND freshness_score <= 100),
    defects TEXT[] DEFAULT '{}',
    confidence DOUBLE PRECISION DEFAULT 0.5,
    image_url TEXT,
    model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trust Scores ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS trust_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    fulfillment_rate DOUBLE PRECISION DEFAULT 0,
    delivery_timeliness DOUBLE PRECISION DEFAULT 0,
    quality_avg DOUBLE PRECISION DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    score DOUBLE PRECISION DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ─── Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_crop ON products(crop_name);
CREATE INDEX IF NOT EXISTS idx_products_district ON products(district);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_farmer ON order_items(farmer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_transporter ON vehicles(transporter_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_vehicle ON shipments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_crop_district ON market_prices(crop_name, district);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_crop_district ON demand_forecasts(crop_name, district);
CREATE INDEX IF NOT EXISTS idx_trust_scores_user ON trust_scores(user_id);

-- ─── Row Level Security (RLS) ─────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_scores ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles: public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: own update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles: own insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Products: anyone can read active, sellers manage own
CREATE POLICY "Products: public read active" ON products FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "Products: sellers insert" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Products: sellers update own" ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Products: sellers delete own" ON products FOR DELETE USING (auth.uid() = seller_id);

-- Orders: buyer sees own, farmers see items for their products
CREATE POLICY "Orders: buyers read own" ON orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Orders: buyers insert" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Orders: buyers update own" ON orders FOR UPDATE USING (buyer_id = auth.uid());

-- Order Items: linked to orders
CREATE POLICY "Order Items: read via order" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
    OR farmer_id = auth.uid()
);
CREATE POLICY "Order Items: insert via order" ON order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Order Items: farmers update" ON order_items FOR UPDATE USING (auth.uid() = farmer_id);

-- Vehicles: transporters manage own
CREATE POLICY "Vehicles: public read" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Vehicles: own insert" ON vehicles FOR INSERT WITH CHECK (auth.uid() = transporter_id);
CREATE POLICY "Vehicles: own update" ON vehicles FOR UPDATE USING (auth.uid() = transporter_id);

-- Shipments: viewable by order buyer and vehicle transporter
CREATE POLICY "Shipments: read relevant" ON shipments FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = shipments.order_id AND orders.buyer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = shipments.vehicle_id AND vehicles.transporter_id = auth.uid())
);

-- Market prices & demand forecasts: readable by all authenticated users
CREATE POLICY "Market Prices: auth read" ON market_prices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Demand Forecasts: auth read" ON demand_forecasts FOR SELECT USING (auth.role() = 'authenticated');

-- Quality assessments: readable by all
CREATE POLICY "Quality: public read" ON quality_assessments FOR SELECT USING (true);
CREATE POLICY "Quality: auth insert" ON quality_assessments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Trust scores: readable by all, system updates
CREATE POLICY "Trust: public read" ON trust_scores FOR SELECT USING (true);
CREATE POLICY "Trust: auth upsert" ON trust_scores FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Trust: auth update" ON trust_scores FOR UPDATE USING (auth.role() = 'authenticated');
