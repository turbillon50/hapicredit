# HapiControl — CRM & Loan Portfolio Management PWA

## Overview

Premium mobile-first PWA CRM and loan portfolio management platform for Grupo CAFJA / HapiCredit. Built in Spanish. The app opens as a client-facing experience (HapiCredit brand) with a full credit application flow. Admin access via "Admin" tab (5th position in bottom nav, no password).

## Real Business Rules (CRITICAL)

- **Commission**: 10% ($100 per $1,000), deducted at disbursement
- **Term options**: ONLY 8 weeks ($175/semana por $1,000) or 13 weeks ($120/semana por $1,000)
- **Late fee**: $200 per day of delay
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
- Auto-calculates late fees ($200/day)
- Cash tracking via caja movements (only after admin validation)
- Daily client list, commitments, follow-up notes

### Stage 3: Administrator
- **Validate payments** (admin/validar-pagos): Approve/reject before balance update
- **Dashboard** (admin/dashboard): Portfolio KPIs, cash flow, pending validations alert
- **Cartera** (admin/cartera): Full portfolio with semaphore filters, progress bars
- **Morosos** (admin/morosos): Delinquent clients with $200/day fine calculation
- **Solicitudes** (admin/solicitudes): Public applications + internal pending credits
- **Financiero** (admin/financiero): Interest analysis, projections, utility
- **Asesores** (admin/asesores): Executive ranking, placement, collection, delinquency
- **Caja** (admin/caja): Cash control per executive
- **Expediente** (admin/expediente/:id): Full client record

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

## Frontend Routes (artifacts/hapicontrol/src/)

### Client Pages
- `/` — HapiCredit landing page with CTA
- `/solicitar` — 5-step credit application form (datos, crédito, aval, docs, enviar)
- `/mi-credito` — Active credit status, payment history, pending requests
- `/perfil` — Client profile, document upload/management

### Admin Pages
- `/admin` — Dashboard with portfolio KPIs, cash flow, pending validations
- `/admin/solicitudes` — Pending credit applications (public + internal), approve/reject
- `/admin/validar-pagos` — Payment validation (approve/reject before applying to balance)
- `/admin/cartera` — Active portfolio with semaphore status filters and executive filters
- `/admin/morosos` — Delinquent clients with $200/day fine calculation, severity tabs
- `/admin/asesores` — Executive performance ranking
- `/admin/financiero` — Financial overview, interest analysis
- `/admin/caja` — Cash control per executive
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

### Component Library (artifacts/hapicontrol/src/components/hapi/)
- `Avatar.tsx` — Initials avatar with deterministic color
- `Badge.tsx` — Status badges (success/warning/danger/info)
- `BottomSheet.tsx` — Modal bottom sheet
- `ProgressBar.tsx` — Animated progress bar
- `Skeleton.tsx` — Loading skeleton variants
- `EmptyState.tsx` — Empty state placeholder
- `StatCard.tsx` — Metric stat card

### Layout (artifacts/hapicontrol/src/components/layout/)
- `Layout.tsx` — Main layout with header, bottom nav, auto-admin auth
- `BottomNav.tsx` — Switchable bottom nav (client 5-tab vs admin 5-tab)

## Notes

- Commission rate: 10% at disbursement. Client requests $5,000 -> receives $4,500.
- Only 2 terms: 8 weeks ($175/week per $1,000) or 13 weeks ($120/week per $1,000)
- Late fee: $200/day, stops generating when payment for that week is received
- Payment flow: Executive registers -> pending_validation -> Admin approves -> balance updated + caja movement created
- Document storage: notesTable with noteType="document", content=JSON({filename, mimeType, base64, label, uploadedAt})
- Seed data: 8 realistic clients with active credits, 1 pending credit for approval demo
- DB column is `paymentStatus` not `status` for payments table
