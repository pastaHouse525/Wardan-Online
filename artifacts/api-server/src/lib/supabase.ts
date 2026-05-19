import { createClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type SupabaseListing = {
  id: number;
  title_ar: string;
  description_ar: string | null;
  category_slug: string;
  category_name_ar: string | null;
  price: number | null;
  price_unit: string | null;
  city: string | null;
  location: string | null;
  phone_number: string | null;
  whatsapp_number: string;
  seller_name: string | null;
  image_url: string | null;
  image_urls: string | null; // JSON-encoded string[]
  status: string;
  featured: boolean;
  created_at: string;
};

export type SupabaseCategory = {
  id: number;
  slug: string;
  name_ar: string;
  listing_count: number;
};

export type SupabaseAppointment = {
  id: number;
  doctor_name_ar: string;
  specialty: string | null;
  clinic_location: string | null;
  consultation_fee: number | null;
  whatsapp_number: string;
  patient_name: string | null;
  appointment_date: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

function parseImageUrls(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return [raw]; }
}

export function mapListing(l: SupabaseListing) {
  const urls = parseImageUrls(l.image_urls);
  return {
    id: l.id,
    titleAr: l.title_ar,
    descriptionAr: l.description_ar,
    categorySlug: l.category_slug,
    categoryNameAr: l.category_name_ar,
    price: l.price ? Number(l.price) : null,
    priceUnit: l.price_unit,
    city: l.city,
    location: l.location,
    phoneNumber: l.phone_number,
    whatsappNumber: l.whatsapp_number,
    sellerName: l.seller_name,
    imageUrl: urls[0] ?? l.image_url,
    imageUrls: urls.length ? urls : (l.image_url ? [l.image_url] : []),
    status: l.status,
    featured: l.featured,
    createdAt: l.created_at,
  };
}

export function mapCategory(c: SupabaseCategory) {
  return {
    id: c.id,
    slug: c.slug,
    nameAr: c.name_ar,
    listingCount: c.listing_count,
  };
}

export function mapAppointment(a: SupabaseAppointment) {
  return {
    id: a.id,
    doctorNameAr: a.doctor_name_ar,
    specialty: a.specialty,
    clinicLocation: a.clinic_location,
    consultationFee: a.consultation_fee ? Number(a.consultation_fee) : null,
    whatsappNumber: a.whatsapp_number,
    patientName: a.patient_name,
    appointmentDate: a.appointment_date,
    notes: a.notes,
    status: a.status,
    createdAt: a.created_at,
  };
}
