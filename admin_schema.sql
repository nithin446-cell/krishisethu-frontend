-- ============================================================
-- KrishiSethu — Admin Schema additions
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add status + role columns to users (if not already present)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role   TEXT DEFAULT 'farmer';

-- 2. Create admin role for your user
-- Replace YOUR_PHONE_NUMBER with your Supabase user phone number
-- UPDATE public.users SET role = 'admin' WHERE phone = 'YOUR_PHONE_NUMBER';

-- 3. Index for common admin queries
CREATE INDEX IF NOT EXISTS idx_users_role     ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status   ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_kyc_status     ON public.farmer_kyc(status);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.order_disputes(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment ON public.orders(payment_status);

-- 4. RLS: ensure admin can read all tables
-- Orders
DROP POLICY IF EXISTS "admin_orders_read" ON public.orders;
CREATE POLICY "admin_orders_read" ON public.orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users (admins can read all)
DROP POLICY IF EXISTS "admin_users_read" ON public.users;
CREATE POLICY "admin_users_read" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users (admins can update)
DROP POLICY IF EXISTS "admin_users_update" ON public.users;
CREATE POLICY "admin_users_update" ON public.users
  FOR UPDATE USING (
    auth.uid() = id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
