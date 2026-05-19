-- ============================================================
-- Wardan Online — Supabase Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name_ar     TEXT NOT NULL,
  listing_count INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id              SERIAL PRIMARY KEY,
  title_ar        TEXT NOT NULL,
  description_ar  TEXT,
  category_slug   TEXT NOT NULL,
  category_name_ar TEXT,
  price           NUMERIC,
  price_unit      TEXT,
  location        TEXT,
  whatsapp_number TEXT NOT NULL,
  seller_name     TEXT,
  image_url       TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments (doctors)
CREATE TABLE IF NOT EXISTS appointments (
  id                SERIAL PRIMARY KEY,
  doctor_name_ar    TEXT NOT NULL,
  specialty         TEXT,
  clinic_location   TEXT,
  consultation_fee  NUMERIC,
  whatsapp_number   TEXT NOT NULL,
  patient_name      TEXT,
  appointment_date  TEXT,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'available',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function: increment listing_count on a category
CREATE OR REPLACE FUNCTION increment_listing_count(category_slug_param TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  UPDATE categories SET listing_count = listing_count + 1
  WHERE slug = category_slug_param;
END;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved listings & categories & appointments
CREATE POLICY "Public read categories"    ON categories    FOR SELECT USING (true);
CREATE POLICY "Public read appointments"  ON appointments  FOR SELECT USING (true);
CREATE POLICY "Public read approved"      ON listings      FOR SELECT USING (status = 'approved');
-- Anyone can insert a new (pending) listing
CREATE POLICY "Public insert listing"     ON listings      FOR INSERT WITH CHECK (status = 'pending');
-- Service role bypasses RLS automatically — no extra policy needed

-- ============================================================
-- Storage bucket for listing images
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-images');

-- ============================================================
-- Seed data — 7 categories
-- ============================================================

INSERT INTO categories (slug, name_ar) VALUES
  ('real-estate',    'عقارات'),
  ('livestock',      'مواشي'),
  ('birds',          'طيور'),
  ('vegetables',     'خضروات'),
  ('clothes',        'ملابس'),
  ('home-appliances','أجهزة منزلية'),
  ('doctors',        'مواعيد طبية')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Admin user (optional — create via Supabase Auth dashboard
-- or uncomment and replace with real values)
-- ============================================================
-- SELECT auth.create_user('{"email":"admin@wardan.com","password":"change-me","email_confirm":true}'::jsonb);
