# Bethel Perfume — Client

Next.js 16 (App Router) storefront and admin dashboard for Bethel Perfume &
Mart. The API lives in `../server`.

## Setup

```bash
npm install
cp .env.example .env.local   # set NEXT_PUBLIC_API_URL / NEXT_PUBLIC_SITE_URL
npm run dev                  # http://localhost:3000
```

## Scripts

| Script              | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Production build                  |
| `npm run start`     | Serve the production build        |
| `npm run lint`      | ESLint (Next.js core-web-vitals)  |
| `npm run typecheck` | `tsc --noEmit`                    |

## Routes

- `/` – homepage: hero, categories, featured products, promotions
- `/products` – catalogue with search, category/stock/promotion filters and pagination
- `/products/[slug]` – product detail with image gallery and add-to-cart
- `/cart`, `/checkout`, `/order/success/[orderNumber]` – cart and guest checkout flow
- `/admin/login`, `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders`, `/admin/settings` – JWT-protected dashboard

## Layout

```
src/app        # routes (App Router)
src/components # storefront + admin components
src/lib        # api client (src/lib/api.ts), cart storage, site constants
```

Cart state is kept in `localStorage` (`src/lib/cart.ts`) and broadcast through
the `bethel-cart-updated` window event. Admin authentication is an httpOnly
session cookie set by the API — JavaScript never sees the token, so XSS cannot
exfiltrate a session; `apiRequest` sends the cookie with every call and clears
the session when the API answers 401. Only the admin's display username is
kept in `localStorage` under `admin_user`.

