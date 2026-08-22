# Architecture

## High-level

```
                          ┌─────────────┐
                Internet →│   Nginx     │  (TLS, gzip, rate-limit, static files)
                          └─────┬───────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
            backend #1      backend #2      backend #N      (Node + Express, stateless)
                └───────────────┼───────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
            PostgreSQL                       Redis
       (durable, normalized)         (cache, sessions, rate-limit,
                                      socket.io adapter, refresh tokens)
```

## Why this shape

- **Stateless backend** — sessions/refresh tokens live in Redis, so any backend pod can serve any request. Lets nginx round-robin freely and lets us autoscale.
- **Single nginx** in front — TLS termination, caching of public marketplace listings, rate limiting at the edge before requests hit Node.
- **Socket.io with Redis adapter** — when multiple backend replicas are live, broadcasts to `order:{id}` rooms still reach the right buyer/admin regardless of which pod they connected to.
- **Postgres with Sequelize** — schema is enforced via models; before production, switch from `sequelize.sync` to versioned migrations.

## Caching strategy

| Data | Cache | TTL | Invalidation |
| --- | --- | --- | --- |
| Marketplace listing queries | Redis | 60s | On listing create/update/status change (key pattern `listings:*`) |
| User profile (`/auth/me`) | client (React Query) | 60s | On profile update |
| Coupon validation | Redis | 5m | On coupon edit |
| Niche list | Redis | 1h | On niche add |

## Auth

- Access token: short-lived JWT (15m), sent as `Authorization: Bearer`.
- Refresh token: long-lived JWT (7d), stored client-side, validated against `refresh:{userId}:{token}` in Redis. Rotated on use.
- Logout clears every refresh key for the user (`refresh:{userId}:*`).
- Role check happens via `requireRole(...)` middleware on protected routes.

## Realtime

`/socket.io` — JWT-authed on handshake. Rooms:
- `user:{userId}` — direct notifications.
- `order:{orderId}` — buyer ↔ admin chat per order.
- `role:admin` — admin-wide broadcasts (new orders, new listings).

## Scaling guide

| Stage | Action |
| --- | --- |
| First traffic spike | `docker compose ... up -d --scale backend=3` |
| Heavier load | Move Postgres + Redis off the app box; add read replica for Postgres |
| Hot listings | Increase `listings:*` TTL; pre-warm cache for top filters |
| Many concurrent sockets | Move socket.io to its own service; reuse Redis adapter |
| Global users | Put CloudFront/Cloudflare in front of nginx; serve `/assets/*` from CDN |

## Mobile responsiveness

- Tailwind breakpoints (`sm` 640, `md` 768, `lg` 1024, `xl` 1280) used throughout.
- DashboardLayout sidebar collapses < `lg` into a slide-over.
- Tables wrap inside `overflow-x-auto` containers (add when implementing data).

## SEO

- `react-helmet-async` provides per-page `<title>`, meta, canonical, OG, Twitter, JSON-LD.
- Lazy-loaded routes keep initial bundle small.
- `index.html` ships a JSON-LD `WebSite` block + search action.
- `noindex` is set explicitly on auth + dashboard pages.
- Sitemap can be generated at build time via `vite-plugin-sitemap`.

## CI/CD

1. **CI** — `ci.yml` runs lint + tests for backend (with Postgres + Redis services) and frontend; uploads `frontend/dist`.
2. **Docker build** — `docker-build.yml` builds + pushes `ghcr.io/<owner>/link-bajar-{backend,frontend}` on main + tags.
3. **Deploy** — `deploy.yml` SSHs into the prod box, pulls images, runs `docker compose up -d`. Requires secrets: `PROD_HOST`, `PROD_USER`, `PROD_SSH_KEY`.
