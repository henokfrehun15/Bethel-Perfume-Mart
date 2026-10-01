# Bethel Perfume & Mart

Full-stack e-commerce application for **Bethel Perfume & Mart**: a Next.js
storefront (products, cart, checkout, order confirmation and tracking) plus an
Express + PostgreSQL API with a JWT-protected admin dashboard for products,
categories, orders and store settings.

## Tech stack

| Layer    | Technology                                                              |
| -------- | ----------------------------------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4          |
| Backend  | Node.js, Express 5, TypeScript, Zod validation, JWT auth, bcrypt        |
| Database | PostgreSQL (`pg`), plain SQL in `server/database`                        |
| Notify   | WhatsApp new-order notifications (`wa.me` deep link, optional webhook)   |

## Project structure

```
bethel-perfume-mart/
├── client/                 # Next.js storefront + admin dashboard
│   ├── src/app/            # App Router routes (/, /products, /cart, /checkout, /admin)
│   ├── src/components/     # Shared UI (storefront + admin)
│   └── src/lib/            # API client + cart storage helpers
└── server/                 # Express API
    ├── database/           # migrations/*.sql (versioned schema) + seed.sql
    └── src/                # server, routes, controllers, middleware, services, scripts
```

## Getting started

Prerequisites: Node.js 20+, a PostgreSQL database.

```bash
# 1. install dependencies for both apps
npm run install:all

# 2. configure the API
cd server
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET
npm run db:migrate        # apply pending migrations (db:setup is an alias)
npm run db:seed           # optional demo categories/products
npm run create-admin -- admin "a-strong-password"
cd ..

# 3. configure the web app
cd client
cp .env.example .env.local
cd ..

# 4. run both apps (two terminals)
npm run dev:server        # http://localhost:5000
npm run dev:client        # http://localhost:3000
```

Storefront: <http://localhost:3000> · Admin: <http://localhost:3000/admin/login>

## Root scripts

| Script                        | Description                                      |
| ----------------------------- | ------------------------------------------------ |
| `npm run install:all`         | Install server + client dependencies             |
| `npm run dev:server`          | Start the API with watch mode (`tsx watch`)      |
| `npm run dev:client`          | Start the Next.js dev server                     |
| `npm run build`               | Type-check/build the API then build the client   |
| `npm run typecheck`           | `tsc --noEmit` for both apps                     |
| `npm run lint`                | ESLint for the client                            |
| `npm run db:migrate`         | Apply pending SQL migrations (alias: `db:setup`)   |
| `npm run db:seed`            | Apply migrations + `server/database/seed.sql`      |
| `npm test`                   | Vitest suites for the API and the storefront        |
| `npm run create-admin -- <username> <password>` | Create/update an admin user     |

## API overview

Public:

- `GET /api/health` – service + database health
- `GET /api/products` – search (`search`, `category`, `inStock`, `featured`, `promotion`), pagination (`limit`, `offset`); inactive products are hidden unless an admin requests `includeInactive=true`
- `GET /api/products/:slug`, `GET /api/products/id/:id`
- `GET /api/categories`, `GET /api/categories/:slug`
- `GET /api/settings`
- `POST /api/orders` – guest checkout (prices/stock always resolved server-side), rate limited
- `POST /api/orders/track` – look up an order by number + phone, rate limited
- `POST /api/auth/login` – rate limited

Admin (requires `Authorization: Bearer <token>`):

- `POST|PUT|DELETE /api/products`, `POST|PUT|DELETE /api/categories`
- `GET /api/orders`, `GET /api/orders/stats`, `GET /api/orders/:orderNumber`, `PUT /api/orders/:orderNumber/status`
- `PUT /api/settings`

## Environment variables

`server/.env` (see `server/.env.example`): `DATABASE_URL`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `PORT`, `CLIENT_URL`, optional `DATABASE_SSL`, `TRUST_PROXY`,
`WHATSAPP_NUMBER`, `WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`.

`client/.env.local` (see `client/.env.example`): `NEXT_PUBLIC_API_URL`.

## Database migrations

The schema is versioned in `server/database/migrations` and applied in
filename order. Each file runs exactly once inside its own transaction and is
recorded in the `schema_migrations` table, so `npm run db:migrate` is safe to
re-run on any environment.

To change the schema, **add a new numbered file** (never edit one that has
already been applied anywhere):

```
server/database/migrations/
├── 0001_initial_schema.sql
└── 0002_add_something.sql   # your new change
```

## Tests

```bash
npm test                        # API + storefront unit tests
npm test --prefix server        # API only
npm run test:watch --prefix server
```

**Unit tests** (`server/src/tests/unit`, `client/src/lib/*.test.ts`) mock the
database pool and always run.

**Integration tests** (`server/src/tests/integration`) exercise real SQL —
oversell protection, stock restocking, order tracking, visibility rules — and
are skipped unless `TEST_DATABASE_URL` points at a disposable database. They
never read `DATABASE_URL`, so they cannot touch a real store:

```bash
docker run -d --name bethel-test-db \
  -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test -e POSTGRES_DB=bethel_test \
  -p 55432:5432 postgres:16-alpine

TEST_DATABASE_URL=postgresql://test:test@localhost:55432/bethel_test \
  DATABASE_SSL=false npm test --prefix server
```

Tests apply migrations to that database themselves and clean up their own
fixtures.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request: API typecheck +
tests (with a PostgreSQL service container) and storefront lint, typecheck,
tests and production build.

## Roadmap / known gaps

- Product images are stored as external URLs (no upload pipeline).
- Products support soft-delete/hide via `is_active`: hard delete stays blocked
  for products that appear in orders, and the admin UI offers "Hide instead".
