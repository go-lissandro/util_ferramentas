# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant SaaS platform with 10 apps running on a single Express gateway + PostgreSQL (Neon). Deployed on Render.

**Production URL:** https://util-ferramentas.onrender.com

## Commands

```bash
# Install all dependencies
npm run install:all

# Development (runs gateway + app1 + app2 concurrently)
npm run dev

# Run individually
npm run dev:gateway    # Express API on port 10000
npm run dev:app1       # React Admin Dashboard
npm run dev:app2       # URL Shortener frontend

# Build for production
npm run build

# Docker
npm run docker:up
npm run docker:down
npm run docker:logs

# Create admin user
cd gateway && node ../scripts/seed-admin.js
```

## Architecture

```
util_ferramentas/
├── gateway/                    # Express API (single Render service)
│   └── src/
│       ├── server.ts           # Entry point, registers all routes
│       ├── config/
│       │   ├── database.ts     # PostgreSQL + auto-migrations
│       │   └── middleware.ts   # CORS, rate limit, body parser
│       ├── middleware/
│       │   └── auth.ts         # JWT verify, requireRole, injectDbmTenant
│       ├── routes/             # Auth, checkout, users, licenses
│       ├── app2/               # URL Shortener (embedded backend)
│       ├── app7/               # Habits tracker
│       └── ddm/                # Dynamic Data Manager
├── apps/                       # Frontend React apps
│   ├── app1-dashboard/        # Admin panel (Zustand + React Query)
│   ├── app2-urlshortener/
│   ├── app7-habits/
│   └── ...
└── shared/                     # Shared types/utilities
```

## Key Patterns

- **Multi-tenant:** All queries filtered by `tenant_id` from JWT
- **Plan-based access:** Check user.plan before allowing Pro features (App2, App3)
- **Auto-migrations:** database.ts creates tables on startup if missing
- **Embedded frontends:** App2, App7 backends live in gateway/src, not separate services
- **JWT auth:** Token contains `{ id, email, role, plan, tenant_id }`

## Environment Variables

Required in gateway/.env:
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - 64 char random string
- `NODE_ENV=production` (production only)
- `ALLOWED_ORIGINS` (production only)

Optional: PIX config, Google Adsense, YouTube cookies path.
