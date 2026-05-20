# وردان أونلاين — Wardan Online

Arabic-language marketplace website with RTL layout, covering 7 categories and a full admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/wardan-online run dev` — run the frontend (port from env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS, Cairo Arabic font, full RTL layout
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/` — DB schema (categories, listings, appointments)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/wardan-online/src/pages/` — Frontend pages
- `artifacts/wardan-online/src/components/` — Shared UI components

## Architecture decisions

- Full RTL layout set via `dir="rtl"` on `<html>` in main.tsx
- Cairo Google Font for Arabic typography
- Dark green primary palette (#166534-ish) with white backgrounds
- WhatsApp contact links use `https://wa.me/<number>` format
- Listings are created with `status: "pending"` and must be approved in the admin dashboard
- Admin routes (`/admin/listings/:id/approve` and `/admin/listings/:id/reject`) use PATCH

## Product

Two main sections:

**سوق البيع والشراء (Buy & Sell Marketplace)** — dark green palette:
- Categories: real-estate, livestock, birds, vegetables, clothes, home-appliances
- Listings include: price, condition images, WhatsApp contact

**دليل الخدمات (Services Directory)** — teal palette:
- Categories: technicians, restaurants, quran-teachers, local-shops, job-vacancies, transportation, education, doctors
- Listings include: service description, working hours, phone, WhatsApp, location

Pages:
- Home — hero search, marketplace section, services section, latest listings, dual CTA
- Category browsing (`/category/:slug`) — search/filter, works for both sections
- Listing detail — shows working hours badge for services, price for marketplace
- Add listing form — adapts fields dynamically based on selected category section
- Doctor appointments — `/doctors` (appointments booking, legacy system)
- Search page across all listings
- Admin dashboard with stats, listing approval/rejection, and category breakdown

## User preferences

- Arabic RTL layout throughout
- Dark green and white color palette
- WhatsApp contact button on every listing

## Database Architecture

- **Data storage**: Replit's built-in PostgreSQL (`DATABASE_URL`) — used by the API server for all CRUD via raw SQL in `artifacts/api-server/src/lib/db.ts`
- **Auth**: Supabase Auth — admin login at `/api/auth/login` uses `supabase.auth.signInWithPassword()`
- **Storage**: Supabase Storage bucket `listing-images` — image uploads go directly from frontend browser to Supabase via anon key
- The `lib/db` Drizzle package connects to the same DATABASE_URL (used for schema reference only — routes use raw SQL)
- `categories.section` column (`marketplace` | `services`) drives the two-section layout
- `listings.working_hours` column stores service working hours
- GET /listings supports `?section=marketplace|services` filter
- GET /categories supports `?section=marketplace|services` filter

## Admin Login

- First-run: visit `/admin/setup` to create the initial admin account (only works when no admins exist)
- After setup: log in at `/admin/login` with the credentials you chose
- To add more admins: use the **المسؤولون** section inside the admin dashboard (invite by email + password)
- To reset a forgotten password: use the "نسيت كلمة المرور؟" link on the login page — it generates a one-time Supabase recovery link
- `requireAdmin` middleware verifies Supabase JWT + checks `admin_users` table in local DB

## Gotchas

- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen`
- DB listing counts are updated on every INSERT in listings.ts route — recalculate if drift occurs:
  `UPDATE categories c SET listing_count = (SELECT COUNT(*) FROM listings l WHERE l.category_slug = c.slug AND l.status = 'approved');`
- Image uploads use Supabase Storage directly from the browser (requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`)
- Admin authentication uses Supabase Auth (JWT verification) + local `admin_users` table for authorization

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
