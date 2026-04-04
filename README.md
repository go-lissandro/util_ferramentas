# 🚀 SaaS Platform — Modular Multi-App Architecture

> **Production-ready modular SaaS platform** that runs multiple apps under a single URL using a centralized gateway with reverse proxy, JWT authentication, multi-tenancy, and billing-ready infrastructure.

```
https://yourdomain.com/app1  →  Admin Dashboard
https://yourdomain.com/app2  →  URL Shortener
https://yourdomain.com/app3  →  Your next app
```

---

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start (Local)](#-quick-start-local)
- [How the Gateway Works](#-how-the-gateway-works)
- [Authentication Flow](#-authentication-flow)
- [Multi-Tenancy Model](#-multi-tenancy-model)
- [Monetization & Billing](#-monetization--billing)
- [Adding a New App](#-adding-a-new-app)
- [Deploy to Render](#-deploy-to-render)
- [Environment Variables](#-environment-variables)
- [Scaling Guide](#-scaling-guide)
- [Technical Decisions](#-technical-decisions)

---

## 🏗 Architecture Overview

```
                         ┌─────────────────────────────────────────┐
                         │              INTERNET                   │
                         └──────────────────┬──────────────────────┘
                                            │
                         ┌──────────────────▼──────────────────────┐
                         │           API GATEWAY :3000             │
                         │  ┌─────────────────────────────────┐   │
                         │  │  helmet · cors · rate-limiter   │   │
                         │  │  jwt-auth · request-logger      │   │
                         │  └─────────────────────────────────┘   │
                         │                                         │
                         │  /api/auth  → Auth routes (internal)    │
                         │  /api/users → Users routes (internal)   │
                         │  /app1/**   → proxy → App1 :5173        │
                         │  /app2/**   → proxy → App2 :4001        │
                         │  /appN/**   → proxy → AppN :PORT        │
                         └──────┬───────────────────┬─────────────┘
                                │                   │
               ┌────────────────▼─────┐   ┌─────────▼────────────────┐
               │  App1: Dashboard     │   │  App2: URL Shortener     │
               │  React + Vite :5173  │   │  Node API + React :4001  │
               └──────────────────────┘   └──────────────────────────┘
                                    │
                         ┌──────────▼──────────────┐
                         │  PostgreSQL  │  Redis    │
                         │  (shared DB) │  (cache)  │
                         └─────────────────────────┘
```

### Key Architectural Decisions

| Concern | Decision | Reason |
|---|---|---|
| **Routing** | Path-based (`/app1`, `/app2`) | Single domain, no subdomain DNS complexity |
| **Auth** | JWT in Gateway | Single source of truth, SSO across all apps |
| **Tenancy** | Row-level isolation | Simple, cost-effective at early stage |
| **Proxy** | `http-proxy-middleware` | Battle-tested, minimal overhead |
| **Database** | PostgreSQL | Multi-tenant queries, ACID, JSON support |
| **Frontend** | React + Vite | Fast DX, tree-shaking, modern bundling |
| **State** | Zustand + React Query | Lightweight, server + client state separation |

---

## 🧰 Tech Stack

### Backend / Gateway
- **Node.js 20** + **Express 4** — HTTP server & routing
- **http-proxy-middleware** — Reverse proxy to upstream apps
- **jsonwebtoken** — JWT creation & verification
- **bcryptjs** — Password hashing
- **zod** — Runtime schema validation
- **winston** — Structured logging
- **express-rate-limit** — Request throttling per tenant
- **helmet** — Security headers
- **pg** — PostgreSQL client

### Frontend (App1 Dashboard)
- **React 18** + **TypeScript** — UI layer
- **Vite 5** — Build tool & dev server
- **React Router v6** — Client-side routing
- **TanStack Query v5** — Server state, caching, mutations
- **Zustand** — Global auth state with persistence
- **React Hook Form** + **Zod** — Form validation
- **Recharts** — Usage analytics charts
- **Lucide React** — Icon system

### App2 (URL Shortener)
- **Node.js** + **Express** — REST API
- **nanoid** — URL-safe short ID generation
- **qrcode** — QR code generation
- **React 18** — Embedded SPA client

### Infrastructure
- **PostgreSQL 16** — Primary database
- **Redis 7** — Rate limiting & future caching
- **Docker Compose** — Local dev environment
- **Render** — Cloud deployment

---

## 📁 Project Structure

```
saas-platform/
│
├── gateway/                   # 🔀 Core gateway — auth, proxy, routing
│   ├── src/
│   │   ├── server.ts          # Bootstrap & entry point
│   │   ├── config/
│   │   │   ├── middleware.ts  # Global middleware setup
│   │   │   └── database.ts   # PostgreSQL pool + migrations
│   │   ├── middleware/
│   │   │   ├── auth.ts        # JWT verify, role guard, plan guard
│   │   │   ├── rateLimiter.ts # Per-tenant + per-plan rate limits
│   │   │   └── requestLogger.ts # Structured HTTP logging
│   │   ├── proxy/
│   │   │   └── proxyRouter.ts # App registry + proxy config
│   │   ├── routes/
│   │   │   ├── auth.routes.ts    # /api/auth/login|register|me
│   │   │   ├── users.routes.ts   # /api/users management
│   │   │   └── billing.routes.ts # /api/billing + Stripe webhook
│   │   └── utils/
│   │       ├── logger.ts      # Winston logger
│   │       └── AppError.ts    # Typed error class
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── apps/
│   ├── app1-dashboard/        # 🎛 Admin Dashboard (React SPA)
│   │   ├── src/
│   │   │   ├── main.tsx       # Entry point
│   │   │   ├── App.tsx        # Router setup
│   │   │   ├── store/
│   │   │   │   └── authStore.ts  # Zustand auth state
│   │   │   ├── services/
│   │   │   │   └── api.ts     # Axios + interceptors
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── AppsPage.tsx
│   │   │   │   ├── UsersPage.tsx
│   │   │   │   ├── BillingPage.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   ├── components/
│   │   │   │   └── layout/
│   │   │   │       └── DashboardLayout.tsx
│   │   │   └── index.css      # Design system tokens
│   │   ├── Dockerfile
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── app2-urlshortener/     # 🔗 URL Shortener (API + React)
│       ├── src/
│       │   └── server.ts      # Express API + redirect handler
│       ├── client/            # Embedded React SPA
│       │   └── src/
│       │       └── main.tsx   # Full UI in single file
│       ├── Dockerfile
│       └── package.json
│
├── shared/                    # 📦 Shared types & utilities
│   ├── types/index.ts         # TypeScript interfaces
│   └── auth/index.ts          # Gateway context helpers
│
├── scripts/
│   ├── setup.sh               # One-command local setup
│   └── add-app.sh             # Scaffold a new app
│
├── docker-compose.yml         # Local dev infrastructure
├── render.yaml                # Render deploy manifest
├── package.json               # Root monorepo scripts
└── README.md
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- npm 9+

### Option A — Automated setup (recommended)

```bash
git clone https://github.com/yourorg/saas-platform.git
cd saas-platform
chmod +x scripts/setup.sh
./scripts/setup.sh
npm run dev
```

### Option B — Manual setup

```bash
# 1. Clone and enter
git clone https://github.com/yourorg/saas-platform.git
cd saas-platform

# 2. Start PostgreSQL + Redis
docker compose up -d postgres redis

# 3. Configure gateway
cp gateway/.env.example gateway/.env
# Edit gateway/.env — review all values

# 4. Install all dependencies
npm run install:all

# 5. Start all services concurrently
npm run dev
```

### Access the platform

| Service | URL |
|---|---|
| **Gateway** | http://localhost:3000 |
| **App1 — Dashboard** | http://localhost:3000/app1 |
| **App2 — URL Shortener** | http://localhost:3000/app2 |
| **Health Check** | http://localhost:3000/health |
| **Auth API** | http://localhost:3000/api/auth/me |

---

## 🔀 How the Gateway Works

The gateway is the **only public-facing service**. All traffic enters through it.

### Request lifecycle

```
Browser → GET /app2/dashboard
          │
          ├─ 1. helmet()         → Security headers
          ├─ 2. cors()           → CORS validation
          ├─ 3. rateLimiter()    → Per-tenant request counting
          ├─ 4. requestLogger()  → Structured logging + request ID
          ├─ 5. authenticate()   → JWT validation (if route is protected)
          ├─ 6. requireAppAccess('app2') → DB check for app permission
          └─ 7. proxy()          → Forward to App2 :4001/dashboard
                                   with X-User-ID, X-Tenant-ID headers
```

### Adding a new app to the registry

Edit `gateway/src/proxy/proxyRouter.ts`:

```typescript
export const APP_REGISTRY: AppConfig[] = [
  // ... existing apps ...
  {
    key: 'app3',
    pathPrefix: '/app3',
    target: process.env.APP3_URL || 'http://localhost:4002',
    protected: true,
    requiredPlan: ['pro'],          // Pro-only app
    description: 'My New Feature',
  },
];
```

That's it. No other gateway config needed.

---

## 🔐 Authentication Flow

Authentication is **centralised in the gateway**. Individual apps never validate JWTs — they trust the headers forwarded by the gateway.

```
1. POST /api/auth/login  { email, password }
        ↓
2. Gateway validates credentials against DB
        ↓
3. Gateway returns: { accessToken, refreshToken, user, tenant }
        ↓
4. Client stores token (localStorage via Zustand persist)
        ↓
5. Client sends: Authorization: Bearer <token>
        ↓
6. Gateway verifies JWT on every protected request
        ↓
7. Gateway injects headers before proxying:
   X-User-ID:    uuid
   X-Tenant-ID:  uuid
   X-User-Role:  admin | member
   X-User-Plan:  free | pro
   X-User-Email: user@example.com
        ↓
8. Upstream app reads headers (no JWT needed)
```

### Reading context in an upstream service

```typescript
import { getGatewayContext } from '../../shared/auth';

app.get('/my-resource', (req, res) => {
  const ctx = getGatewayContext(req);
  if (!ctx) return res.status(401).json({ error: 'Unauthorized' });

  // ctx.tenantId — isolate data per tenant
  // ctx.userId   — who made the request
  // ctx.plan     — 'free' | 'pro' for feature gates
  // ctx.role     — 'admin' | 'member' for RBAC
});
```

---

## 🏢 Multi-Tenancy Model

Each user who registers gets their own **tenant** (workspace). This enables:
- Data isolation (every DB query filters by `tenant_id`)
- Per-tenant billing
- Per-tenant team management

### Database schema (key tables)

```sql
tenants           -- One per workspace
  id, name, slug, plan, stripe_customer_id

users             -- Belong to one tenant
  id, tenant_id, email, role (admin|member)

app_permissions   -- Controls which apps each user can access
  tenant_id, user_id, app_key, can_access

usage_events      -- Audit trail for billing/analytics
  tenant_id, user_id, app_key, event_type
```

### Adding a new tenant member

```
Admin invites user → User registers with same tenant ID
→ Admin grants app permissions via /api/users/apps/:appKey/permissions
```

---

## 💰 Monetization & Billing

### Plans

| Feature | Free | Pro ($29/mo) |
|---|---|---|
| Apps | 2 | Unlimited |
| URL Shortenings/month | 50 | Unlimited |
| API requests/day | 100 | 10,000 |
| Team members | 1 | 10 |
| Support | Community | Priority |

### Enabling Stripe

1. Create products & prices in your [Stripe Dashboard](https://dashboard.stripe.com)
2. Set environment variables:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRO_PRICE_ID=price_...
   ```
3. Uncomment the Stripe SDK code in `gateway/src/routes/billing.routes.ts`
4. Configure webhook endpoint in Stripe → `https://yourdomain.com/api/webhooks/stripe`

The webhook handler already processes `customer.subscription.created/updated/deleted` events and updates tenant plan in the database.

### Plan enforcement

```typescript
// Enforce plan at gateway level (route middleware)
app.use('/app2/premium-feature', requirePlan('pro'));

// Enforce within app (runtime check)
const ctx = getGatewayContext(req);
if (ctx.plan === 'free' && count >= 50) {
  return res.status(429).json({ code: 'PLAN_LIMIT_EXCEEDED' });
}
```

---

## ➕ Adding a New App

### Method 1 — Script (fastest)

```bash
./scripts/add-app.sh app3 "Analytics Dashboard" 4002
```

This scaffolds the directory and prints exact next steps.

### Method 2 — Manual

**Step 1** — Create your service in `apps/app3/`

**Step 2** — Register in gateway (`gateway/src/proxy/proxyRouter.ts`):
```typescript
{
  key: 'app3',
  pathPrefix: '/app3',
  target: process.env.APP3_URL || 'http://localhost:4002',
  protected: true,
  description: 'Analytics Dashboard',
}
```

**Step 3** — Add env var to `gateway/.env`:
```
APP3_URL=http://localhost:4002
```

**Step 4** — Add to `render.yaml` (for deploy):
```yaml
- type: web
  name: saas-app3
  rootDir: apps/app3
  buildCommand: npm install && npm run build
  startCommand: npm start
  envVars:
    - key: APP3_URL
      fromService:
        name: saas-app3
        type: web
        property: host
```

**Step 5** — Use the gateway context in your new service:
```typescript
import { requireGatewayContext } from '../../shared/auth';

app.use('/api', requireGatewayContext);
```

That's all. Your new app is live at `/app3` with auth, rate-limiting, and logging inherited from the gateway.

---

## 🌐 Deploy to Render

### Prerequisites
- [Render account](https://render.com) (free tier works)
- GitHub repository with the project

### Steps

**1. Push to GitHub**
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/yourorg/saas-platform.git
git push -u origin main
```

**2. Connect to Render**
- Go to [render.com/dashboard](https://dashboard.render.com)
- Click **New → Blueprint**
- Connect your GitHub repo
- Render reads `render.yaml` and provisions everything automatically

**3. Set secret environment variables** (not auto-generated)

In the Render dashboard for `saas-gateway`:
```
JWT_SECRET         → generate a 64-char random string
STRIPE_SECRET_KEY  → from Stripe dashboard (when ready)
STRIPE_WEBHOOK_SECRET → from Stripe dashboard
STRIPE_PRO_PRICE_ID   → from Stripe dashboard
```

**4. Your platform is live**

```
https://saas-gateway.onrender.com/app1   → Dashboard
https://saas-gateway.onrender.com/app2   → URL Shortener
https://saas-gateway.onrender.com/health → Health check
```

### Custom domain

In Render dashboard → `saas-gateway` service → Settings → Custom Domain:
```
yourdomain.com  →  saas-gateway.onrender.com
```

---

## 🔧 Environment Variables

### Gateway (`gateway/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | Yes | `development` or `production` |
| `JWT_SECRET` | ✅ | Secret for signing tokens — use 64+ random chars |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | No | Redis URL (optional, falls back to memory) |
| `APP1_DASHBOARD_URL` | ✅ | URL of the app1 service |
| `APP2_URLSHORTENER_URL` | ✅ | URL of the app2 service |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: 100) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | No | Stripe price ID for Pro plan |

---

## 📈 Scaling Guide

### Phase 1 — Current (MVP / 0–1,000 users)
- All services on Render free/starter tier
- Single PostgreSQL instance (shared)
- In-memory rate limiting (no Redis needed)
- **Cost: ~$0–20/month**

### Phase 2 — Growth (1,000–10,000 users)
```bash
# Upgrade services to Render Standard
# Enable Redis for distributed rate limiting
# Add read replica to PostgreSQL
# Enable Render autoscaling on gateway
```
- **Cost: ~$50–100/month**

### Phase 3 — Scale (10,000+ users)
```
# Move to dedicated PostgreSQL (Render Pro or Neon.tech)
# Add CDN (Cloudflare) in front of gateway
# Split hot apps to dedicated services
# Add background job queue (BullMQ + Redis)
# Implement per-tenant DB schemas or separate DBs
```

### Horizontal scaling considerations

The gateway is **stateless** — scale it freely:
```yaml
# render.yaml
- type: web
  name: saas-gateway
  scaling:
    minInstances: 1
    maxInstances: 5
    targetMemoryPercent: 80
    targetCPUPercent: 70
```

For **session/rate-limit state** to work across instances, enable Redis:
```
REDIS_URL=redis://your-redis-instance:6379
```

---

## 🧠 Technical Decisions

### Why a monorepo?
- Single `npm run dev` to start everything
- Shared TypeScript types prevent drift
- Atomic commits across services
- Easy to split into separate repos later

### Why path-based routing vs subdomain routing?
- **No DNS configuration** needed per environment
- Works on free Render tier (single domain)
- Single SSL certificate
- Easier local development

### Why not use a full API gateway (Kong, Traefik)?
- Zero ops overhead at this stage
- Full TypeScript control over auth logic
- Easy to migrate to a dedicated gateway later
- `http-proxy-middleware` handles 10,000+ req/sec easily

### Why PostgreSQL for everything?
- JSONB columns handle flexible metadata
- Row-level security can be added later
- Single admin interface
- Proven multi-tenant patterns

### Why Zustand over Redux?
- 80% less boilerplate
- Native TypeScript support
- Built-in persistence middleware
- Sufficient for auth state + UI state

---

## 🗺 Roadmap

- [ ] Email verification on registration
- [ ] Forgot password / reset password flow
- [ ] Team invitations via email
- [ ] Usage analytics dashboard per app
- [ ] API key management (machine-to-machine)
- [ ] Webhook delivery to tenant endpoints
- [ ] White-labeling support
- [ ] App marketplace / app store UI

---

## 📄 License

MIT — Use freely, build something great.

---

<p align="center">
  Built with ❤️ as a production-ready foundation for your SaaS
</p>
