-- ============================================================
-- KrishiSethu — SECURE Farmer KYC Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add KYC flag to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false;

-- 2. KYC records table
CREATE TABLE IF NOT EXISTS public.farmer_kyc (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- PAN
  pan_number            TEXT,
  pan_name              TEXT,
  pan_dob               TEXT,
  pan_verified          BOOLEAN DEFAULT false,
  pan_verified_at       TIMESTAMPTZ,

  -- Aadhaar (store only last 4 digits — never full number)
  aadhaar_last4         TEXT,
  aadhaar_name          TEXT,
  aadhaar_dob           TEXT,
  aadhaar_gender        TEXT,
  aadhaar_address       TEXT,
  aadhaar_verified      BOOLEAN DEFAULT false,
  aadhaar_verified_at   TIMESTAMPTZ,

  -- Documents (Supabase Storage paths — private bucket)
  selfie_path           TEXT,
  aadhaar_doc_path      TEXT,
  face_match_score      NUMERIC,

  -- Status ('not_started', 'pan_done', 'aadhaar_done', 'pending', 'approved', 'rejected')
  status                TEXT DEFAULT 'not_started',
  rejection_reason      TEXT,
  reviewed_by           UUID REFERENCES public.users(id),
  submitted_at          TIMESTAMPTZ,
  verified_at           TIMESTAMPTZ,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE public.farmer_kyc ENABLE ROW LEVEL SECURITY;

-- Users can READ their own KYC record to check status in App.tsx
CREATE POLICY "kyc_read_own" ON public.farmer_kyc
  FOR SELECT USING (auth.uid() = user_id);

-- [REMOVED "kyc_write_own" POLICY]
-- Security Fix: Do not allow frontend to write directly to farmer_kyc.
-- If they could, a hacker could simply UPDATE their status to 'approved' via API.
-- Because server.js uses the Supabase Service Role Key for writing, it inherently bypasses RLS and writes safely!

-- Admins can read any KYC
CREATE POLICY "kyc_admin_read" ON public.farmer_kyc
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any KYC (for approve/reject in admin dashboard)
CREATE POLICY "kyc_admin_update" ON public.farmer_kyc
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_farmer_kyc_user ON public.farmer_kyc(user_id);
CREATE INDEX IF NOT EXISTS idx_farmer_kyc_status ON public.farmer_kyc(status);

-- ── Supabase Storage: create private bucket for KYC docs ──────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,            -- PRIVATE — not publicly accessible
  5242880,          -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: only owner and admins can read
CREATE POLICY "kyc_doc_owner_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND (
      auth.uid()::text = (storage.foldername(name))[2]
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- [REMOVED "kyc_doc_service_insert" POLICY]
-- Security Fix: A generic INSERT policy allowed anyone to inject files into the bucket.
-- Same as above, server.js uses the Service Role Key to upload images safely, ignoring RLS.
