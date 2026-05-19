-- Migration 001: Add missing columns to listings table
-- Applied: city, phone_number, image_urls
-- Run via: psql $DATABASE_URL -f scripts/migrations/001_add_listing_fields.sql

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS image_urls TEXT;
