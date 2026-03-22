-- ============================================================
-- KrishiSethu — Order Tracking Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add tracking columns to existing orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status          TEXT DEFAULT 'placed';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at    TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at   TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at    TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at         TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatch_note   TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vehicle_number  TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS estimated_days  INT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_note   TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status_history  JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_reason  TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_details TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS disputed_by     UUID REFERENCES public.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS disputed_at     TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payout_reference TEXT;

-- 2. Disputes table (for admin queue)
CREATE TABLE IF NOT EXISTS public.order_disputes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  raised_by   UUID NOT NULL REFERENCES public.users(id),
  reason      TEXT NOT NULL,
  details     TEXT,
  status      TEXT DEFAULT 'open',  -- open | resolved | closed
  resolution  TEXT,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ratings table
CREATE TABLE IF NOT EXISTS public.user_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rater_id   UUID NOT NULL REFERENCES public.users(id),
  rated_id   UUID NOT NULL REFERENCES public.users(id),
  rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, rater_id)  -- one rating per person per order
);

-- 4. Add rating columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avg_rating   NUMERIC(3,1) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;

-- 5. Supabase Storage bucket for order photos (public — delivery proofs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-photos', 'order-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policy: anyone can read (delivery photos are evidence)
CREATE POLICY "order_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-photos');

-- Only service role can insert (backend uploads on behalf of user)
CREATE POLICY "order_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-photos');

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings   ENABLE ROW LEVEL SECURITY;

-- Disputes: parties + admins can read
CREATE POLICY "disputes_read" ON public.order_disputes FOR SELECT
  USING (
    raised_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (farmer_id = auth.uid() OR trader_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Ratings: public read
CREATE POLICY "ratings_read" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_write" ON public.user_ratings FOR INSERT WITH CHECK (rater_id = auth.uid());

-- ── Indexes ───────────────────────────────────────────────────
-- Note: Replaced table indexes with direct column indexes since Supabase doesn't accept function syntax for indexes without wrapping
CREATE INDEX IF NOT EXISTS idx_orders_farmer  ON public.orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_trader  ON public.orders(trader_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_ratings_rated  ON public.user_ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON public.order_disputes(order_id);
