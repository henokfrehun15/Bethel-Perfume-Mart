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
- `POST /api/auth/login` – rate limited; sets the admin session as an httpOnly cookie
- `POST /api/auth/logout` – clears the session cookie

Admin (authenticated via the httpOnly `admin_token` cookie; a Bearer
token in the `Authorization` header is also accepted for programmatic
API clients):

- `POST|PUT|DELETE /api/products`, `POST|PUT|DELETE /api/categories`
- `GET /api/orders`, `GET /api/orders/stats`, `GET /api/orders/:orderNumber`, `PUT /api/orders/:orderNumber/status`
- `PUT /api/settings`
- `PUT /api/auth/password` – change the signed-in admin's password (signs out other sessions, refreshes this one)
- `POST /api/uploads/images` – upload a product image (multipart field `file`, admin only)
- `DELETE /api/uploads/images` – delete a previously uploaded image by URL

Uploaded images are served from the API at `/uploads/<filename>`.

## Environment variables

`server/.env` (see `server/.env.example`): `DATABASE_URL`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `COOKIE_SAME_SITE`, `PORT`, `CLIENT_URL`, optional
`DATABASE_SSL`, `TRUST_PROXY`, `WHATSAPP_NUMBER`, `WHATSAPP_API_URL`,
`WHATSAPP_API_TOKEN`, plus the upload settings `UPLOAD_DIR`,
`UPLOAD_MAX_BYTES` and `PUBLIC_ASSET_URL`.

`client/.env.local` (see `client/.env.example`): `NEXT_PUBLIC_API_URL`,
`NEXT_PUBLIC_SITE_URL`.

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

## Product images

The admin product form uploads images straight to the API
(`POST /api/uploads/images`, multipart field `file`) and keeps the returned
URL, alongside any externally hosted image URLs. The server:

- accepts JPEG, PNG, WebP, AVIF and GIF up to `UPLOAD_MAX_BYTES`;
- verifies the file really is an image by reading its magic bytes **before**
  anything is stored, so a renamed text file is rejected;
- stores it under a generated filename via the configured storage driver
  (disk by default, S3/R2/MinIO when `STORAGE_DRIVER=s3`), so the original
  filename is never trusted;
- serves local files from `/uploads` with `Cross-Origin-Resource-Policy:
  cross-origin` (so the storefront can embed them) and long-lived caching,
  because filenames are unique;
- deletes stored files automatically once no product references their URL
  anymore (on product update or delete), so removing an image in the admin
  never leaves orphaned files behind.

Uploaded images are stored in the database as `/uploads/...` paths, not
absolute URLs — the storefront resolves them against the API origin at
render time, so images keep working when the API moves between hosts
(set `PUBLIC_ASSET_URL` only if uploads are served from a separate CDN).
Migration `0003` normalises any older absolute URLs the same way, and the
storefront falls back to a branded placeholder when an image is missing
or fails to load.

External image URLs (e.g. a CDN) still work and are not deleted by the app.

## Roadmap / known gaps

- Checkout is cash-on-delivery only — no online payment gateway yet.
- Product pages are server-rendered with per-product metadata; the home page
  and collection listing still render on the client.
- Products support soft-delete/hide via `is_active`: hard delete stays blocked
  for products that appear in orders, and the admin UI offers "Hide instead".
