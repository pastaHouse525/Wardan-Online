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

- Home page with hero search and 7 category cards (real estate, livestock, birds, vegetables, clothes, home appliances, doctor appointments)
- Category browsing with search/filter
- Listing detail page with WhatsApp contact button
- Add listing form (creates listings in pending status)
- Doctor appointments section with direct WhatsApp booking
- Search page across all listings
- Admin dashboard with stats, listing approval/rejection, and category breakdown

## User preferences

- Arabic RTL layout throughout
- Dark green and white color palette
- WhatsApp contact button on every listing

## Gotchas

- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen`
- DB listing counts are updated via a SQL trigger on insert — manually run the UPDATE if counts drift
- Admin dashboard has no authentication — add auth before production deployment

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
