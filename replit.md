# HapiControl — CRM & Loan Portfolio Management PWA

## Overview

Premium mobile-first PWA CRM and loan portfolio management platform for Grupo CAFJA / HapiCredit. Built in Spanish. The app opens as a client-facing experience (HapiCredit brand) with a full credit application flow. A lock icon (top right) provides access to the admin panel without password or login.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `hapicontrol`, served at `/`)
- **API framework**: Express 5 (artifact: `api-server`, served at `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts
- **Icons**: react-icons (ri, fi, hi, md, bi families) — NO lucide-react
- **Auth**: Auto-admin token on mount (no login page). Token in localStorage key `hapi_token`.
- **UI**: Custom components in `src/components/hapi/`. NO Radix, NO shadcn.
- **Language**: All UI in Spanish. No emojis in UI.

## Application Flow

1. Client opens app at `/` — sees HapiCredit branded landing page
2. Bottom nav: Inicio / Solicitar / Mi Credito / Perfil
3. Lock icon (top right) navigates to `/admin` — no password required
4. Admin panel has its own bottom nav: Panel / Solicitudes / Cartera / Morosos / Asesores

## Frontend Routes (artifacts/hapicontrol/src/)

### Client Pages
- `/` — HapiCredit landing page with CTA
- `/solicitar` — 4-step credit application form (personal data, credit details, documents, review/submit)
- `/mi-credito` — Active credit status, payment history, pending requests
- `/perfil` — Client profile, document upload/management

### Admin Pages
- `/admin` — Dashboard with portfolio KPIs, collection progress, quick links
- `/admin/solicitudes` — Pending credit applications (public + internal), approve/reject
- `/admin/cartera` — Active portfolio detail with search and executive filter
- `/admin/morosos` — Delinquent clients by severity (critical/high/medium)
- `/admin/asesores` — Executive management
- `/admin/financiero` — Financial overview
- `/admin/expediente/:id` — Full client record (credits, payments, documents, notes)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/scripts run seed` — seed database with sample data

## Architecture

### Database Schema (lib/db/src/schema/)
- `users` — System users with roles (admin, executive, client, public)
- `sessions` — Auth sessions with token + expiry
- `clients` — Client registry with status semaforo
- `credits` — Loan records per client (status: active/pending/rejected/closed)
- `payments` — Payment history (paymentStatus column, not status)
- `commitments` — Payment promises with fulfillment tracking
- `notes` — Follow-up log + document storage (noteType="document" stores JSON with base64)
- `caja_movements` — Executive cash tracking
- `alerts` — Smart system alerts
- `public_requests` — Public credit application submissions

### API Routes (artifacts/api-server/src/routes/)
- `auth.ts` — Login, logout, /auth/me
- `clients.ts` — Client CRUD + GET/POST/DELETE documents endpoints
- `credits.ts` — Credit CRUD + PATCH /credits/:id/review (approve/reject)
- `payments.ts` — Payment registration (auto-updates balance + caja)
- `commitments.ts` — Payment commitment tracking
- `notes.ts` — Follow-up notes per client
- `dashboard.ts` — Dashboard data, rankings, portfolio aging
- `public.ts` — Public credit application endpoint (POST /api/public/apply)

### Component Library (artifacts/hapicontrol/src/components/hapi/)
- `Avatar.tsx` — Initials avatar with deterministic color
- `Badge.tsx` — Status badges (success/warning/danger/info)
- `ProgressBar.tsx` — Animated progress bar
- `Skeleton.tsx` — Loading skeleton variants
- `EmptyState.tsx` — Empty state placeholder

### Layout (artifacts/hapicontrol/src/components/layout/)
- `Layout.tsx` — Main layout with header, bottom nav, auto-admin auth
- `BottomNav.tsx` — Switchable bottom nav (client vs admin routes)

## Notes

- Commission rate: 5% at disbursement. Payments biweekly.
- Document storage: notesTable with noteType="document", content=JSON({filename, mimeType, base64, label, uploadedAt})
- Seed data: Multiple clients with active/pending credits for demo
- DB column is `paymentStatus` not `status` for payments table
