# Specson Billing

An independent React, TypeScript, Vite, and Supabase billing application extracted from an audited reference implementation. It is designed to support a new shop through configuration and database data, not source-code renaming.

## Quick start

```bash
cp .env.example .env
npm install
npm run dev
```

For a production build:

```bash
npm run build
npm run lint
```

## Supabase setup

1. Create a new Supabase project owned by the new business.
2. Apply `supabase/migrations/0001_initial_schema.sql` to that project.
3. Create an owner in Supabase Authentication and set its profile role to `admin`.
4. Add only the new project URL and publishable/anonymous key to `.env`.
5. Add products, categories, variants, and images through the application or a separate seed script.

The migration includes products, variants, categories, customers/profiles, orders, order items, coupons, advance orders, invoice numbering, invoice storage, RPCs, indexes, and role-aware RLS. It contains no production credentials or business data.

## Business configuration

Business identity is centralized in `src/constants/business.ts` and can be supplied through `.env`: name, legal name, logo, favicon, phone, WhatsApp, email, address, locale, currency, tax settings, invoice prefix, document footers, and theme colors.

Product images are database-owned (`image_url` or Supabase Storage); there is no product-name image map or embedded catalog.

## Architecture map

`src/pages` contains workflows; `src/components` contains reusable UI; `src/services` contains Supabase-facing modules; `src/store` owns session/catalog/cart state; `src/lib` contains calculation, document, print, phone, and storage adapters; `src/constants/business.ts` is the business configuration seam; Supabase migrations define the data and security model.

## Security

Never add `.env` to source control. A browser-safe Supabase publishable/anonymous key is not an admin secret; database safety comes from RLS and server-side security-definer RPCs. Never put a service-role key or real passwords in this repository.

## Reference audit

The source repository is kept separately under `../reference-source` for audit traceability only. The running template has its own package name, environment variables, storage keys, logo placeholder, schema migration, and empty business-owned catalog/gallery.
