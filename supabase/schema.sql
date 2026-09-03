-- AT ORNAMENTS - SUPABASE PRODUCTION DATABASE SCHEMA
-- Migration & Initial Schema Creation Script

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('chain', 'anklet', 'ring', 'bracelet')),
  category_label VARCHAR(50) NOT NULL DEFAULT 'Jewellery',
  collection VARCHAR(50) NOT NULL CHECK (collection IN ('silver', 'artificial')),
  pricing_type VARCHAR(50) NOT NULL DEFAULT 'weight_based' CHECK (pricing_type IN ('weight_based', 'fixed')),
  fixed_price NUMERIC(10, 2),
  weight_grams NUMERIC(10, 2) DEFAULT 0,
  making_charge NUMERIC(10, 2) DEFAULT 0,
  purity TEXT DEFAULT '925 Sterling Silver',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  tag VARCHAR(100) DEFAULT '',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  stock_qty INT DEFAULT 10,
  is_bestseller BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  return_policy TEXT DEFAULT 'Silver items: Final Sale. Artificial items: 7-Day Return.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(100) PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id VARCHAR(100),
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  subtotal NUMERIC(10, 2) NOT NULL,
  gst NUMERIC(10, 2) NOT NULL DEFAULT 0,
  shipping_charge NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Paid Online',
  order_status TEXT NOT NULL DEFAULT 'Dispatched',
  current_stage_index INT NOT NULL DEFAULT 2,
  awb_number TEXT DEFAULT '',
  shipment_id TEXT DEFAULT '',
  courier TEXT DEFAULT 'Shiprocket Express',
  silver_rate_at_purchase NUMERIC(10, 2) NOT NULL DEFAULT 95.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDER ITEMS TABLE (PRICE & WEIGHT SNAPSHOTS)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(100) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL,
  product_name_snapshot TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  weight_snapshot NUMERIC(10, 2),
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  selected_size TEXT DEFAULT '',
  image_snapshot TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOM DESIGN REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.custom_design_requests (
  id VARCHAR(100) PRIMARY KEY,
  customer_id VARCHAR(100),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  material TEXT NOT NULL,
  style TEXT NOT NULL,
  thickness TEXT NOT NULL,
  size TEXT NOT NULL,
  stones TEXT DEFAULT '',
  charms TEXT DEFAULT '',
  engraving TEXT DEFAULT '',
  budget NUMERIC(10, 2) NOT NULL,
  ai_estimate_min NUMERIC(10, 2) NOT NULL,
  ai_estimate_max NUMERIC(10, 2) NOT NULL,
  design_image TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'UNDER_REVIEW' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'QUOTED', 'QUOTE_SENT', 'ACCEPTED')),
  merchant_decision TEXT DEFAULT '',
  merchant_notes TEXT DEFAULT '',
  final_weight_grams NUMERIC(10, 2),
  making_charge NUMERIC(10, 2),
  final_price NUMERIC(10, 2),
  estimated_completion_days INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOM DESIGN VERSIONS TABLE
CREATE TABLE IF NOT EXISTS public.custom_design_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id VARCHAR(100) NOT NULL REFERENCES public.custom_design_requests(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  design_image TEXT NOT NULL,
  prompt TEXT DEFAULT '',
  specifications JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMERS / PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WISHLIST TABLE
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id VARCHAR(100) NOT NULL,
  product_id VARCHAR(100) NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_customer_product_wishlist UNIQUE (customer_id, product_id)
);

-- 9. SILVER RATE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.silver_rate_settings (
  id INT PRIMARY KEY DEFAULT 1,
  current_rate NUMERIC(10, 2) NOT NULL DEFAULT 95.0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row_silver_rate CHECK (id = 1)
);

-- INITIAL SILVER RATE ROW
INSERT INTO public.silver_rate_settings (id, current_rate, updated_at)
VALUES (1, 95.0, NOW())
ON CONFLICT (id) DO NOTHING;

-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_collection ON public.products(collection);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_custom_design_status ON public.custom_design_requests(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_design_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silver_rate_settings ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS POLICIES
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read silver rate" ON public.silver_rate_settings FOR SELECT USING (true);
CREATE POLICY "Public write orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Public write order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Public write custom design requests" ON public.custom_design_requests FOR ALL USING (true);
CREATE POLICY "Public write custom design versions" ON public.custom_design_versions FOR ALL USING (true);
CREATE POLICY "Public write products admin" ON public.products FOR ALL USING (true);
CREATE POLICY "Public write silver rate admin" ON public.silver_rate_settings FOR ALL USING (true);
CREATE POLICY "Public wishlist" ON public.wishlist FOR ALL USING (true);

-- 10. EXTENDED RECOVERY ACTIONS TABLE (DECISION TRAIL)
CREATE TABLE IF NOT EXISTS public.recovery_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id TEXT,
  action_type TEXT,
  order_id VARCHAR(100),
  session_id TEXT,
  attempt_number INT DEFAULT 1,
  agent_decision TEXT,
  ai_confidence NUMERIC(3, 2),
  diagnosis_text TEXT,
  proposed_action TEXT,
  proposed_discount_percent NUMERIC(5, 2),
  final_action TEXT,
  final_discount_percent NUMERIC(5, 2),
  gate_overrides JSONB DEFAULT '[]'::jsonb,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AGENT POLICY STATE TABLE
CREATE TABLE IF NOT EXISTS public.agent_policy_state (
  id INT PRIMARY KEY DEFAULT 1,
  daily_discount_budget NUMERIC(10, 2) NOT NULL DEFAULT 5000,
  discount_spent_today NUMERIC(10, 2) NOT NULL DEFAULT 0,
  policy_date DATE NOT NULL DEFAULT CURRENT_DATE,
  max_discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 10,
  max_actions_per_order INT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row_policy CHECK (id = 1)
);

INSERT INTO public.agent_policy_state (id, daily_discount_budget, discount_spent_today, max_discount_percent, max_actions_per_order)
VALUES (1, 5000.00, 0.00, 10.00, 1)
ON CONFLICT (id) DO NOTHING;

-- 12. STANDALONE FUNNEL EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(100) REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  cart_total NUMERIC(10, 2) NOT NULL,
  time_since_event_hours NUMERIC(6, 2) NOT NULL DEFAULT 0,
  payment_attempt_status TEXT,
  customer_purchase_history_count INT DEFAULT 0,
  product_category TEXT,
  raw_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. EXTEND ORDERS TABLE WITH RECOVERY ACTION FK
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS recovery_action_id UUID REFERENCES public.recovery_actions(id);

-- INDEXES FOR NEW RECOVERY TABLES
CREATE INDEX IF NOT EXISTS idx_recovery_actions_order_id ON public.recovery_actions(order_id);
CREATE INDEX IF NOT EXISTS idx_funnel_events_event_type ON public.funnel_events(event_type);

-- ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
ALTER TABLE public.recovery_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_policy_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read/write recovery_actions" ON public.recovery_actions FOR ALL USING (true);
CREATE POLICY "Public read/write agent_policy_state" ON public.agent_policy_state FOR ALL USING (true);
CREATE POLICY "Public read/write funnel_events" ON public.funnel_events FOR ALL USING (true);

-- SCHEMA GRANTS FOR ANON AND AUTHENTICATED ROLES
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;


