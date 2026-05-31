# Crede-Ti — CRM & Loan Portfolio Management PWA

> **Creemos en ti** — *Más que un crédito, una forma distinta de vivir.*

Premium mobile-first PWA CRM and loan portfolio management platform.
Built in Spanish. The app uses role-based authentication with invite-code
registration. Three areas: public landing, client portal, admin/executive panel.

## Deploy to Vercel

This repo is configured for one-click Vercel deployment.

1. **Import on Vercel** — point it at this repo. Vercel auto-detects pnpm and
   reads `vercel.json` (build command, output dir, function config).
2. **Provision Postgres** — any Postgres works (Neon, Supabase, Vercel
   Postgres, Render…). Copy the connection string.
3. **Push the schema** — locally, with the production `DATABASE_URL`:
   ```sh
   pnpm --filter @workspace/db run push
   ```
4. **Set env vars in Vercel project settings**. Keep `.env.example` in sync
   with this table and never commit real secrets:

   | Variable | Required | Example | Notes |
   |---|---|---|---|
   | `DATABASE_URL` | ✓ | `postgres://user:pw@host/db?sslmode=require` | Pooled connection recommended |
   | `STAFF_MASTER_CODE` | ✓ | `<your-long-random-secret>` | Master password for first admin setup and `/perfil` "Modo administrador" elevation. In production/Vercel, no hardcoded fallback is accepted if this is missing. |
   | `RESEND_API_KEY` |   | `re_…` | Optional. Welcome/invite/payment emails fail silently if absent. |
   | `RESEND_FROM` |   | `Crede-Ti <noreply@your-domain.com>` | Must be a verified Resend sender |
   | `VITE_CLERK_PUBLISHABLE_KEY` |   | `pk_test_…` | Optional. Enables Clerk-based Google/passkey login |
   | `CLERK_SECRET_KEY` |   | `sk_test_…` | Required if `VITE_CLERK_PUBLISHABLE_KEY` is set |
   | `CLERK_WEBHOOK_SECRET` |   | `whsec_…` | Required if the Clerk webhook route is configured |
   | `BLOB_READ_WRITE_TOKEN` |   | `vercel_blob_rw_…` | Optional. Required only for Vercel Blob uploads |
   | `VITE_APP_URL` |   | `https://crede-ti.info` | Optional public app URL exposed to the Vite build |
   | `VITE_BRAND_NAME` |   | `Crede-Ti` | Optional brand label exposed to the Vite build |
   | `BASE_PATH` |   | `/` | Optional. Use only when deploying under a subpath |
   | `DEMO_MODE_ENABLED` |   | `false` | Keep false/missing in production |
   | `LOG_LEVEL` |   | `info` | `info` (default) / `debug` / `warn` |

5. **Click Deploy.** Vercel builds the Vite SPA into
   `artifacts/crede-ti/dist/public/` and exposes the Express API as a
   single serverless function at `/api/*`.
6. **First admin** — supported production paths:

   **a) Recommended (Clerk-native):** sign up normally via `/sign-up`. Then
   in https://dashboard.clerk.com → Users → your user → **Public metadata** →
   `{ "role": "admin" }`. Sign out, sign back in, you land in `/admin`.

   **b) Master-code staff registration/elevation:** set `STAFF_MASTER_CODE`
   in Vercel first. Then create/elevate an account with that code through the
   staff registration or `/perfil` "Modo administrador" flow. The flow updates
   the DB row to `role = 'admin'`, sets `treeId` to the user's own id, issues a
   fresh session token, and redirects to `/admin`.

   **c) Direct DB promotion:** after a normal sign-up, run a controlled SQL
   update against production Postgres:
   ```sql
   update users
   set role = 'admin', parent_id = null, tree_id = id, updated_at = now()
   where email = 'owner@example.com';
   ```
   Sign out and sign in again after the update.

### Local development

```sh
pnpm install
# In two terminals:
pnpm run dev:web        # http://localhost:3000
pnpm run dev:api        # http://localhost:3001 (proxied to /api by Vite)
```

The frontend expects the API on the same origin via `/api/*`. For local
dev, either set up a Vite proxy or run the api on the same port via
`vercel dev` (Vercel CLI) which mirrors the production routing.

## Overview

Premium mobile-first PWA CRM and loan portfolio management platform for Crede-Ti. Built in Spanish. The app uses role-based authentication with invite code registration. Three areas: public landing, client portal, admin/executive panel.

## Auth System

- **3 roles**: `admin`, `executive` (asesor), `client` (acreditado)
- **Registration**: via invite code (`/registro?inv=CODE`) OR master password for staff
- **Master password**: `STAFF_MASTER_CODE` — required in production for admin/executive registration and admin elevation. Local dev accepts `credite` / `credeti` only when no env code is configured.
- **Sucursal hierarchy** (3 levels): Crede-Ti root (superadmin, parentId=null) → Branch admins (parentId=superadmin's id) → Executives (treeId=branch admin's id)
- **Tree isolation**: admin with `parentId != null` (branch admin) → sees only their tree's clients/credits. admin with `parentId = null` (superadmin) → sees all trees.
- **Admin invite**: sets `parentId = creatorId` (not null) — branch admin belongs to creator's hierarchy
- **Admin treeId**: Always set to their own userId (each admin is root of their own branch tree)
- **Login**: `/login` redirects into Clerk at `/sign-in` when Clerk is configured; DB username/password endpoints remain available for legacy/native sessions.
- **Sessions**: JWT stored in `localStorage` (`credeti_token`, `credeti_role`, `credeti_user`). Sessions are persistent (30 days).
- **Logout**: Server-side session invalidation + localStorage.clear() + hard redirect to /login.
- **Google OAuth**: Clerk handles sign-in at `/sign-in`. The app mirrors the Clerk JWT into the legacy localStorage session shape, and the API verifies Clerk JWTs when `CLERK_SECRET_KEY` is configured.
- **Route protection**: Layout.tsx redirects to `/login` for protected routes.
- **Genealogical tree**: `parentId` = who invited this user. `treeId` = root admin's user ID. `/users/my-tree` returns role-filtered tree.
- **Invite code API**: `POST /invite-codes/generate`, `GET /invite-codes/mine`, `DELETE /invite-codes/:id`, `GET /invite-codes/validate/:code` (public)
- **WhatsApp sharing**: Perfil page generates invite links `{appBase}/registro?inv={CODE}` and opens WhatsApp with pre-written message
- **DB Seed**: DISABLED — database starts completely empty. No demo data.
- **Auth middleware**: Exposes `req.userId`, `req.userRole`, `req.userTreeId`, `req.userParentId` on all authenticated routes.

## Real Business Rules (CRITICAL)

- **Commission**: 10% ($100 per $1,000), deducted at disbursement
- **Term options**: ONLY 8 weeks ($175/semana por $1,000) or 13 weeks ($120/semana por $1,000)
- **Late fee**: $500 per day of delay
- **Aval (guarantor)**: MANDATORY for every credit
- **Payment validation**: Executive registers payment -> status "pending_validation" -> Admin validates -> balance updated
- **Client classification (semaphore)**: Green (al corriente) / Yellow (atraso leve 1-15d) / Red (atraso critico 16-30d) / Black (cartera vencida 31d+)
- **Prospection sources**: Facebook, WhatsApp directo, Recomendación, Referido de otro cliente

## 3-Stage Business Flow

### Stage 1: Client (solicitar.tsx)
- 5-step form: Datos personales -> Crédito -> Aval -> Documentos -> Enviar
- Real rate calculator with commission, disbursement amount
- Business info, references, prospection source
- Document upload (INE front/back, selfie with INE, proof of address)

### Stage 2: Executive (API payments.ts)
- Payment registration creates status "pending_validation" (NOT directly applied)
- Auto-calculates late fees ($500/day)
- Cash tracking via caja movements (only after admin validation)
- Daily client list, commitments, follow-up notes

### Stage 3: Administrator
- **Validate payments** (admin/validar-pagos): Approve/reject before balance update
- **Dashboard** (admin/dashboard): Portfolio KPIs, cash flow, pending validations alert
- **Cartera** (admin/cartera): Full portfolio with semaphore filters, progress bars
- **Morosos** (admin/morosos): Delinquent clients with $500/day fine calculation
- **Solicitudes** (admin/solicitudes): Public applications + internal pending credits
- **Financiero** (admin/financiero): Interest analysis, projections, utility
- **Asesores** (admin/asesores): Executive ranking, placement, collection, delinquency
- **Caja** (admin/caja): Cash control per executive, clickable cards navigate to ledger
- **Movimientos** (admin/movimientos/:id): Per-executive financial ledger ("libro de movimientos") showing all income (client payments), disbursements, payroll (nomina), capital, expenses with running balance. Admin can add gastos (payroll, capital, other expenses). Movement types: collection, delivery, adjustment, payroll, expense, capital.
- **Expediente** (admin/expediente/:id): Full client record

## Branding

- **Brand**: Crede-Ti
- **Slogan**: "Creemos en ti"
- **Tagline**: "Más que un crédito, una forma distinta de vivir."
- **Logo**: Royal blue square with white "C·T" monogram inside a gold oval frame, gold underline swoosh. SVG sources: `public/favicon.svg`, `public/pwa-icon.svg`, `public/logo-credeti.svg`.
- **Colors**:
  - Brand blue `#1B5FBC` (primary CTAs, headlines, brand surfaces)
  - Brand gold `#E6A82E` (kicker labels, decorative underlines, "-Ti" accent)
  - Deep blue `#0A1F4A` (hero gradients, dark surfaces)
- **CSS vars**: `--brand-blue`, `--brand-gold`, `--brand-blue-deep`, `--brand-blue-mid`, plus legacy aliases `--accent`, `--navy`, `--coral` mapped to brand colors.
- **Favicon/PWA icons**: Royal-blue tile + white "C·T" inside gold oval. PNGs at 180/192/512px generated from SVG.
- **Splash screen**: Full logo on royal-blue gradient, 2.8s per session (sessionStorage).
- **Header**: "Crede" in default text color + gold "-Ti" accent + slogan.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 22.x on Vercel (`package.json` engines)
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `crede-ti`, served at `/`)
- **API framework**: Express 5 (artifact: `api-server`, served at `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts
- **Icons**: react-icons (ri, fi, hi, md, bi families) — NO lucide-react
- **Auth**: Clerk JWT or DB session token stored in localStorage key `credeti_token`.
- **UI**: Custom components in `src/components/hapi/`. NO Radix, NO shadcn.
- **Language**: All UI in Spanish. No emojis in UI.

## Frontend Routes (artifacts/crede-ti/src/)

### Client Pages
- `/` — Crede-Ti landing page with CTA
- `/solicitar` — 5-step credit application form (datos, crédito, aval, docs, enviar)
- `/mi-credito` — Active credit status, payment history, pending requests
- `/perfil` — Client profile, document upload/management

### Admin Pages
- `/admin` — Dashboard with portfolio KPIs, cash flow, pending validations
- `/admin/solicitudes` — Pending credit applications (public + internal), approve/reject
- `/admin/validar-pagos` — Payment validation (approve/reject before applying to balance)
- `/admin/cartera` — Active portfolio with semaphore status filters and executive filters
- `/admin/morosos` — Delinquent clients with $500/day fine calculation, severity tabs
- `/admin/asesores` — Executive performance ranking
- `/admin/financiero` — Financial overview, interest analysis
- `/admin/caja` — Cash control per executive
- `/admin/expediente/:id` — Full client record (credits, payments, documents, notes)
- `/admin/arbol` — Genealogical tree of executives
- `/admin/codigos` — Invite code management
- `/admin/movimientos/:id` — Per-executive financial ledger

### Executive Pages (all at /dashboard/* paths)
- `/dashboard` or `/executive` — Executive dashboard with today's KPIs
- `/dashboard/clientes` — Executive's client list with search and status filter
- `/dashboard/expediente/:id` — Client detail with active credit info
- `/dashboard/cobrar` — Register client payment (auto-loads active credit, requires creditId)
- `/dashboard/alta-cliente` — 4-step new client registration with document upload
- `/dashboard/comisiones` — Commission breakdown by credit
- `/dashboard/alertas` — Alerts for at-risk clients
- `/dashboard/compromisos` — Payment commitments tracker

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/crede-ti run dev` — run web app

## Architecture

### Database Schema (lib/db/src/schema/)
- `users` — System users with roles (admin, executive, client, public)
- `sessions` — Auth sessions with token + expiry
- `clients` — Client registry with status semaforo (current/at_risk/overdue/defaulted/inactive)
- `credits` — Loan records (8 or 13 weeks, openingFee=10%, rates $175/$120 per $1000)
- `payments` — paymentStatus: on_time/partial/late/missed/pending_validation/rejected
- `commitments` — Payment promises with fulfillment tracking
- `notes` — Follow-up log + document storage (noteType="document" stores JSON with base64)
- `caja_movements` — Executive cash tracking (only after admin validates payment)
- `alerts` — Smart system alerts
- `public_requests` — Public credit application submissions

### API Routes (artifacts/api-server/src/routes/)
- `auth.ts` — Login, logout, /auth/me
- `clients.ts` — Client CRUD + GET/POST/DELETE documents endpoints
- `credits.ts` — Credit CRUD + PATCH /credits/:id/review (approve/reject)
- `payments.ts` — Payment registration (pending_validation), GET /payments/pending-validation, PATCH /payments/:id/validate
- `commitments.ts` — Payment commitment tracking
- `notes.ts` — Follow-up notes per client
- `dashboard.ts` — Dashboard data, rankings, portfolio aging, portfolio-detail, financial-summary
- `caja.ts` — Cash control and summary per executive
- `public.ts` — Public credit application endpoint (POST /api/public/apply)

### Component Library (artifacts/crede-ti/src/components/hapi/)
- `Avatar.tsx` — Initials avatar with deterministic color
- `Badge.tsx` — Status badges (success/warning/danger/info)
- `BottomSheet.tsx` — Modal bottom sheet
- `ProgressBar.tsx` — Animated progress bar
- `Skeleton.tsx` — Loading skeleton variants
- `EmptyState.tsx` — Empty state placeholder
- `StatCard.tsx` — Metric stat card

### Layout (artifacts/crede-ti/src/components/layout/)
- `Layout.tsx` — Main layout with header, bottom nav, auto-admin auth
- `BottomNav.tsx` — Switchable bottom nav (client 5-tab vs admin 5-tab)

## Notes

- Commission rate: 10% at disbursement. Client requests $5,000 -> receives $4,500.
- Only 2 terms: 8 weeks ($175/week per $1,000) or 13 weeks ($120/week per $1,000)
- Late fee: $500/day, stops generating when payment for that week is received
- Payment flow: Executive registers -> pending_validation -> Admin approves -> balance updated + caja movement created
- Document storage: notesTable with noteType="document", content=JSON({filename, mimeType, base64, label, uploadedAt})
- DB column is `paymentStatus` not `status` for payments table
- Production domain: `crede-ti.info` (alias: `www.crede-ti.info`)

## Phase-0 Production Foundations (Part A)

This repo is mid-transition from "demo with bypass" to production-real auth + storage.
Part A landed in branch `claude/crede-ti-production-v1`:

### Schema additions (additive, does NOT replace ops tables)

| Table | Purpose |
|---|---|
| `user_profiles` | KYC + portal profile per user (full name, dob, CURP, RFC, address, occupation, monthly income, kyc_status, reviewer) |
| `documents` | File uploads (INE, comprobante, etc.) — `blob_url` pointing at Vercel Blob, with status pending/approved/rejected |
| `applications` | Self-service credit applications from `/aplicar`. Linked back to the operational `credits` table via `converted_credit_id` once approved |
| `application_history` | Append-only state-transition log per application |
| `audit_log` | Append-only security/business audit trail (who, what, when, IP, user-agent) |
| `users` (modified) | Added `phone`, `clerk_id` (unique), `last_login`, `deleted_at` (soft delete) |

Push the schema to your Neon DB:
```sh
pnpm --filter @workspace/db run push
```

### Health endpoints

- `GET /api/healthz` — cheap liveness, no DB
- `GET /api/health` — readiness, runs `SELECT 1` against Postgres, reports latency + commit SHA + demo mode flag

### Demo mode — now behind a feature flag

The legacy demo-token bypass that any caller could trigger is now closed in
production. The mechanism only activates when `DEMO_MODE_ENABLED=true`:

- `GET /api/demo/status` → `{ enabled: boolean }`
- `POST /api/demo/login` with `{ role: "admin" | "executive" | "client" }` → returns a session token
- `requireAuth` middleware ignores `demo-token-*` headers unless the flag is on

To enable for a showcase deploy: set `DEMO_MODE_ENABLED=true` in Vercel env vars.
Default (no var set) = closed.

### Env vars expected by the production deploy

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | ✓ | Neon pooled |
| `STAFF_MASTER_CODE` | ✓ in prod | Required for `/users/me/elevate`, `/auth/master-login`, and staff registration. Production/Vercel accepts no hardcoded fallback. |
| `VITE_CLERK_PUBLISHABLE_KEY` | (rec.) | Vite injects this into the bundle. The `NEXT_PUBLIC_*` variant does NOT work in Vite. |
| `CLERK_SECRET_KEY` | (rec.) | Server-only |
| `CLERK_WEBHOOK_SECRET` | Part B | For `svix` verification of `/api/webhooks/clerk` |
| `BLOB_READ_WRITE_TOKEN` | Part B | For `@vercel/blob` signed uploads |
| `DEMO_MODE_ENABLED` | optional | `true` opens the demo endpoints + token bypass. Leave unset in prod. |
| `RESEND_API_KEY` / `RESEND_FROM` | optional | Welcome / invite / payment emails |
| `LOG_LEVEL` | optional | `info` (default) / `debug` / `warn` |

### Part B (next iteration)

- `/api/webhooks/clerk` with svix signature verification + raw-body mount + idempotent `user.created` / `user.updated` / `user.deleted` handling
- `/api/uploads/sign` issuing Vercel Blob signed URLs via `@vercel/blob` (deps already installed)
- Extending `requireAuth` to validate Clerk JWTs (`sessionClaims.publicMetadata.role`) alongside the existing DB-session tokens
- Customer / reviewer / admin panels wired to the new tables with real CRUD
