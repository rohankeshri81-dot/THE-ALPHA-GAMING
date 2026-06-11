-- ====================================================================
-- THE ALPHA - SUPABASE DATABASE MIGRATION SCRIPT
-- Target Tables: alpha_bookings, payment_receipts
-- ====================================================================

-- 1. Create alpha_bookings table
CREATE TABLE IF NOT EXISTS public.alpha_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    mobile_number TEXT,
    service_type TEXT,
    plan_name TEXT,
    product_name TEXT,
    quantity INTEGER DEFAULT 1,
    amount NUMERIC(12, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'PENDING',
    razorpay_order_id TEXT DEFAULT 'N/A',
    razorpay_payment_id TEXT DEFAULT 'N/A',
    utr_reference TEXT DEFAULT 'N/A',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns are present on existing alpha_bookings table
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS service_type TEXT;
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT DEFAULT 'N/A';
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT DEFAULT 'N/A';
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS utr_reference TEXT DEFAULT 'N/A';
ALTER TABLE public.alpha_bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 2. Create payment_receipts table
CREATE TABLE IF NOT EXISTS public.payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT,
    customer_name TEXT,
    mobile_number TEXT,
    service_name TEXT,
    quantity INTEGER DEFAULT 1,
    amount NUMERIC(12, 2) DEFAULT 0.00,
    payment_status TEXT DEFAULT 'PENDING',
    razorpay_order_id TEXT DEFAULT 'N/A',
    razorpay_payment_id TEXT DEFAULT 'N/A',
    utr_reference TEXT DEFAULT 'N/A',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns are present on existing payment_receipts table
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS mobile_number TEXT;
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS service_name TEXT;
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS amount NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PENDING';
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT DEFAULT 'N/A';
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT DEFAULT 'N/A';
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS utr_reference TEXT DEFAULT 'N/A';
ALTER TABLE public.payment_receipts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Configure indexing for optimal performance
CREATE INDEX IF NOT EXISTS idx_alpha_bookings_service ON public.alpha_bookings (service_type);
CREATE INDEX IF NOT EXISTS idx_alpha_bookings_mobile ON public.alpha_bookings (mobile_number);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_number ON public.payment_receipts (receipt_number);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_mobile ON public.payment_receipts (mobile_number);

-- 4. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.alpha_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- 5. Drop any old/different policies to prevent duplicate or conflict errors
DROP POLICY IF EXISTS "Allow public insert to alpha_bookings" ON public.alpha_bookings;
DROP POLICY IF EXISTS "Allow public insert to payment_receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Allow public select to alpha_bookings" ON public.alpha_bookings;
DROP POLICY IF EXISTS "Allow public select to payment_receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Allow select for auth users to alpha_bookings" ON public.alpha_bookings;
DROP POLICY IF EXISTS "Allow select for auth users to payment_receipts" ON public.payment_receipts;
DROP POLICY IF EXISTS "Allow public test delete from alpha_bookings" ON public.alpha_bookings;
DROP POLICY IF EXISTS "Allow public test delete from payment_receipts" ON public.payment_receipts;

-- 6. Create highly permissive public RLS policies allowing inserts/selects/deletes on all operations
CREATE POLICY "Allow public insert to alpha_bookings" ON public.alpha_bookings FOR INSERT TO anon, authenticated, public WITH CHECK (true);
CREATE POLICY "Allow public insert to payment_receipts" ON public.payment_receipts FOR INSERT TO anon, authenticated, public WITH CHECK (true);
CREATE POLICY "Allow public select to alpha_bookings" ON public.alpha_bookings FOR SELECT TO anon, authenticated, public USING (true);
CREATE POLICY "Allow public select to payment_receipts" ON public.payment_receipts FOR SELECT TO anon, authenticated, public USING (true);
CREATE POLICY "Allow public test delete from alpha_bookings" ON public.alpha_bookings FOR DELETE TO anon, authenticated, public USING (true);
CREATE POLICY "Allow public test delete from payment_receipts" ON public.payment_receipts FOR DELETE TO anon, authenticated, public USING (true);

-- Create alpha_admins table
CREATE TABLE IF NOT EXISTS public.alpha_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.alpha_admins ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.alpha_admins ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE public.alpha_admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.alpha_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select on alpha_admins" ON public.alpha_admins;
DROP POLICY IF EXISTS "Allow public insert on alpha_admins" ON public.alpha_admins;
CREATE POLICY "Allow public select on alpha_admins" ON public.alpha_admins FOR SELECT TO anon, authenticated, public USING (true);
CREATE POLICY "Allow public insert on alpha_admins" ON public.alpha_admins FOR INSERT TO anon, authenticated, public WITH CHECK (true);

-- 7. Flush schema cache immediately
NOTIFY pgrst, 'reload schema';

-- ====================================================================
-- DATABASE UTILITIES: EXEC RAW SQL (used by Admin Panel)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Override/bypass RLS limitations for admin raw client workspace queries
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
    RETURN COALESCE(result, '[]'::json);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;
