# HapiControl — Internal Financial Operations Platform

## Overview

Premium mobile-first internal CRM and loan portfolio management app for a microcredit company. Built as a full-stack monorepo using React + Vite frontend and Express backend with PostgreSQL.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifact: `hapicontrol`, served at `/`)
- **API framework**: Express 5 (artifact: `api-server`, served at `/api`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts
- **Icons**: react-icons (ri, fi, bi families)
- **Auth**: Session-based (token stored in localStorage key `hapi_token`)

## Application Roles

1. **public** — Landing page, contact form, no internal access
2. **client** — Client portal: view own loan, balance, payment schedule
3. **executive** — Field executive: manage assigned portfolio, register payments, follow-ups
4. **admin** — Full system access: all executives, clients, reports, rankings

## Default Login Credentials

- Admin: `admin` / `admin123`
- Executive 1: `ejecutivo1` / `exec123`
- Executive 2: `ejecutivo2` / `exec123`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed` — seed the database with sample data

## Architecture

### Database Schema (lib/db/src/schema/)
- `users` — System users with roles (admin, executive, client, public)
- `sessions` — Auth sessions with token + expiry
- `clients` — Client registry with status semaforo
- `credits` — Loan records per client
- `payments` — Payment history, auto-updates credit balance
- `commitments` — Payment promises with fulfillment tracking
- `notes` — Follow-up log per client (call/visit/comment/promise/issue/other)
- `caja_movements` — Executive cash tracking (collection/delivery/adjustment)
- `alerts` — Smart system alerts (overdue, broken_promise, renewal_opportunity, etc.)
- `public_requests` — Public contact form submissions

### API Routes (artifacts/api-server/src/routes/)
- `auth.ts` — Login, logout, /auth/me
- `users.ts` — User management (admin only)
- `clients.ts` — Client CRUD + risk score calculation
- `credits.ts` — Credit record management
- `payments.ts` — Payment registration (auto-updates balance + caja)
- `commitments.ts` — Payment commitment tracking
- `notes.ts` — Follow-up notes per client
- `caja.ts` — Executive cash movements + summary
- `alerts.ts` — Alert list + resolve
- `dashboard.ts` — Executive dashboard, admin dashboard, executive ranking, portfolio aging, collection trend
- `public.ts` — Public contact form

### Frontend Routes (artifacts/hapicontrol/src/)
- `/` — Public landing page
- `/login` — Login
- `/portal` — Client portal
- `/dashboard` — Executive dashboard
- `/clients` — Client list (executive)
- `/clients/new` — New client form
- `/clients/:id` — Client detail
- `/payments/new` — Register payment
- `/commitments` — Payment commitments
- `/alerts` — Smart alerts
- `/admin` — Admin overview dashboard
- `/admin/clients` — All clients (admin)
- `/admin/executives` — Executive management
- `/admin/caja` — Caja control
- `/admin/reports` — Financial reports + charts

## Notes

- Auth middleware: `artifacts/api-server/src/middlewares/auth.ts`
- Password hashing: SHA256 + salt (upgrade to bcrypt for production)
- Risk score: internal behavioral score based on payment punctuality, delays, broken promises
- Executives only see their own assigned portfolio
- Payment registration automatically updates credit balance + creates caja movement
