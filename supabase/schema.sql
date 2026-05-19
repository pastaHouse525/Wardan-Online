-- ============================================================
-- Wardan Online — Supabase Schema (v3 — matches actual DB)
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id            SERIAL PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,
  name_ar       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  icon          TEXT NOT NULL DEFAULT 'tag',
  listing_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id               SERIAL PRIMARY KEY,
  title_ar         TEXT NOT NULL,
  description_ar   TEXT,
  category_slug    TEXT NOT NULL,
  category_name_ar TEXT,
  price            NUMERIC,
  price_unit       TEXT,
  city             TEXT,
  location         TEXT,
  phone_number     TEXT,
  whatsapp_number  TEXT NOT NULL,
  seller_name      TEXT,
  image_url        TEXT,
  image_urls       TEXT,           -- JSON-encoded array of URLs
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
  featured         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Appointments (doctors)
CREATE TABLE IF NOT EXISTS appointments (
  id               SERIAL PRIMARY KEY,
  doctor_name_ar   TEXT NOT NULL,
  specialty        TEXT,
  clinic_location  TEXT,
  consultation_fee NUMERIC,
  whatsapp_number  TEXT NOT NULL,
  patient_name     TEXT,
  appointment_date TEXT,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'available',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users (authorized to access the admin panel)
CREATE TABLE IF NOT EXISTS admin_users (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
ALTER TABLE admin_users   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories"     ON categories   FOR SELECT USING (true);
CREATE POLICY "Public read appointments"   ON appointments FOR SELECT USING (true);
CREATE POLICY "Public insert appointment"  ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read approved"       ON listings     FOR SELECT USING (status = 'approved');
CREATE POLICY "Public insert listing"      ON listings     FOR INSERT WITH CHECK (true);

-- ============================================================
-- Storage bucket for listing images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "Anyone can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-images');

-- ============================================================
-- Seed data — 7 categories
-- ============================================================
INSERT INTO categories (slug, name_ar, name_en, icon) VALUES
  ('real-estate',     'عقارات',        'Real Estate',       'home'),
  ('livestock',       'مواشي',         'Livestock',         'beef'),
  ('birds',           'طيور',          'Birds',             'bird'),
  ('vegetables',      'خضروات',        'Vegetables',        'leaf'),
  ('clothes',         'ملابس',         'Clothes',           'shirt'),
  ('home-appliances', 'أجهزة منزلية', 'Home Appliances',   'tv'),
  ('doctors',         'مواعيد طبية',  'Doctor Appointments','stethoscope')
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon;

-- ============================================================
-- Migrations: add columns if upgrading from older schema
-- ============================================================
ALTER TABLE listings ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS image_urls   TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS city         TEXT;
