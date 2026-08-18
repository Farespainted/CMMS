# CMMS — Computerized Maintenance Management System

A full-stack, web-based CMMS built to be integrated with other systems from day one via a
documented REST API, API keys, and outbound webhooks.

## What's included

**Core modules:** assets/equipment (with parent/child hierarchy), locations, work orders
(corrective, preventive, inspection, emergency, project), preventive maintenance schedules that
auto-generate work orders on a recurring cadence, parts & inventory with stock transactions,
vendors, purchase orders (with receiving), meters/condition monitoring, downtime logs (feeding
MTTR/MTBF reliability reports), users & role-based permissions, a dashboard with KPIs, and a
full audit log of who changed what (including changes made via the API).

**Built for integration:**
- A REST API covering every module, documented with interactive Swagger UI at `/api/docs`
  (and raw OpenAPI JSON at `/api/docs.json`).
- Two auth modes: JWT bearer tokens for logged-in people, and long-lived **API keys**
  (`X-API-Key` header) with granular, scoped permissions for external systems — manage these
  under **Administration → API Keys** in the app.
- **Outbound webhooks** so this CMMS can push real-time events (`work_order.created`,
  `work_order.completed`, `work_order.status_changed`, `asset.status_changed`,
  `part.low_stock`) to another system — manage these under **Administration → Webhooks**.
  Payloads are signed with HMAC-SHA256 (`X-CMMS-Signature` header) if you set a webhook secret.

## Stack

- **Backend:** Node.js + Express, Sequelize ORM (SQLite for zero-config local dev, PostgreSQL
  for production), JWT auth, bcrypt password hashing, node-cron for the PM scheduler.
- **Frontend:** React 18 + Vite + Tailwind CSS, React Router, Axios.
- **Deployment:** Dockerfiles for both apps plus a `docker-compose.yml` that wires up Postgres,
  the API, and an Nginx-served frontend build.

## A note on this delivery

This project was built and syntax-validated in a sandboxed environment that does not have
outbound access to the npm registry, so `npm install` could not be run here to produce a live
demo. Every backend file was checked with `node --check` and every frontend file was checked
with the TypeScript compiler in syntax-only mode — both passed clean — but you'll want to run
the app for real on a machine with normal internet access, following the steps below.

## Quick start (local development, no Docker/Postgres needed)

Requires Node.js 18+.

```bash
# 1. Backend
cd backend
cp .env.example .env        # defaults work out of the box (SQLite)
npm install
npm run seed                # creates the database, demo users, and a demo API key
npm run dev                 # starts the API on http://localhost:4000

# 2. Frontend (in a new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Open http://localhost:5173 and log in. The seed script prints login credentials and a demo
API key to the console — by default:

| Role | Email | Password |
|---|---|---|
| Admin | admin@cmms.local | Admin123! |
| Manager | manager@cmms.local | Manager123! |
| Technician | tech@cmms.local | Tech123! |

Change `SEED_ADMIN_PASSWORD` in `backend/.env` before running the seed in anything but a
throwaway environment, and change all demo passwords immediately in a shared environment.

API docs: http://localhost:4000/api/docs

## Running with Docker + PostgreSQL (production-style)

```bash
cp .env.example .env   # edit DB_PASSWORD and JWT_SECRET at minimum
docker compose up --build
```

This starts Postgres, the API (http://localhost:4000), and the built frontend served by Nginx
(http://localhost:8080, which proxies `/api` to the backend). Run the seed once against this
stack with:

```bash
docker compose exec backend npm run seed
```

For a real production rollout, put the API behind HTTPS (a reverse proxy / load balancer
terminating TLS), set a strong random `JWT_SECRET`, and consider replacing `sequelize.sync()`
(used here so the app works immediately) with proper Sequelize migrations.

## Integrating another system with this CMMS

1. Log in as an admin, go to **Administration → API Keys**, create a key, and choose the
   specific permissions that system needs (e.g. `work_orders:read`, `work_orders:write`).
   The raw key is shown once — store it in the other system's secrets.
2. Have that system call the API with the key in an `X-API-Key` header, e.g.:
   ```bash
   curl -H "X-API-Key: cmms_xxx..." http://localhost:4000/api/work-orders
   ```
3. Browse `/api/docs` for every available endpoint, request/response shape, and the full
   permission catalog.
4. If you want this CMMS to notify the other system instead (push, not pull), register a
   webhook under **Administration → Webhooks** pointing at that system's endpoint and pick
   which events to receive.

## Project structure

```
backend/
  src/
    config/       Sequelize database config (SQLite dev / Postgres prod)
    models/       Sequelize models + associations
    controllers/  Request handlers per module
    routes/       Express routers per module
    middleware/   JWT + API key auth, permission checks, audit logging, error handling
    services/     PM auto-scheduling (node-cron) and webhook dispatch
    docs/         Hand-written OpenAPI 3.0 spec served at /api/docs
  seed/           Demo data seed script
frontend/
  src/
    pages/        One file per screen (Dashboard, Assets, Work Orders, ...)
    components/   Shared UI (layout, modal, tables, badges)
    context/      Auth context (JWT storage, current user, permission checks)
    api/          Axios client
docker-compose.yml
```

## Permission model

Every user has a **role** (admin, manager, technician, requester by default — fully
customizable) whose permissions are strings like `work_orders:write` or `*` for everything.
API keys carry their own independent, scoped permission list, so an integration can be granted
exactly the access it needs — e.g. read-only access to assets and work orders, with no access
to users, API keys, or billing-adjacent data. See `backend/src/utils/permissions.js` for the
full catalog and default role mappings.
