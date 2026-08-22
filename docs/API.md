# API

Base URL: `${VITE_API_URL}/api/v1`

All authenticated endpoints expect `Authorization: Bearer <accessToken>`. All responses follow:

```json
{ "success": true, "data": {} }
{ "success": false, "message": "...", "details": [...] }
```

## Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | Create account. Body: `email, password, firstName, lastName, role, referredByCode` |
| POST | `/auth/login` | — | Returns `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | — | Body: `{ refreshToken }` |
| POST | `/auth/logout` | yes | Revokes refresh tokens |
| GET  | `/auth/me` | yes | Current user |

## Listings

| Method | Path | Auth | Role | Description |
| --- | --- | --- | --- | --- |
| GET  | `/listings` | — | — | Cached marketplace. Query: `page, limit, niche, placementType, language, search, minDa, maxPrice` |
| GET  | `/listings/mine` | yes | seller/admin | Seller's own listings |
| GET  | `/listings/all` | yes | admin | Admin listing with seller info |
| GET  | `/listings/:id` | yes | — | Listing detail |
| POST | `/listings` | yes | seller/admin | Create single listing |
| PUT  | `/listings/:id` | yes | seller (own) / admin | Update |
| DELETE | `/listings/:id` | yes | seller (own) / admin | Delete |
| PATCH | `/listings/:id/status` | yes | admin | Moderate: `{ status, rejectionReason, commission, sellerPrice }` |
| POST | `/listings/bulk` | yes | seller/admin | xlsx bulk upload (multipart, field `file`) |
| GET  | `/listings/wishlist/me` | yes | — | Buyer wishlist |
| POST | `/listings/:id/wishlist` | yes | — | Add to wishlist |
| DELETE | `/listings/:id/wishlist` | yes | — | Remove from wishlist |

## Orders

| Method | Path | Auth | Role | Description |
| --- | --- | --- | --- | --- |
| POST | `/orders/checkout` | yes | buyer | Body: `{ items: [...], paymentMethod, couponCode }`. Creates one order per cart item, auto-generates invoices |
| GET  | `/orders/me` | yes | — | Buyer's own orders |
| GET  | `/orders/:id` | yes | buyer (own) / admin | Order detail + messages |
| GET  | `/orders/:id/messages` | yes | — | Chat history |
| POST | `/orders/:id/messages` | yes | — | Post chat message |
| GET  | `/orders/:id/invoice` | yes | — | Download invoice PDF |
| GET  | `/orders` | yes | admin | All orders |
| PATCH | `/orders/:id/status` | yes | admin | `{ status, liveLink, rejectionReason }`. On cancel/reject, auto-refunds wallet |
| DELETE | `/orders/:id` | yes | admin | Delete |

## Wallet

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET  | `/wallet` | yes | Balance summary |
| GET  | `/wallet/transactions` | yes | Filter: `type, from, to` |
| POST | `/wallet/deposits/intent` | yes | Create deposit intent |
| POST | `/wallet/deposits/confirm` | yes | Confirm deposit (gateway webhook) |
| POST | `/wallet/refunds` | yes | Request refund |
| POST | `/wallet/withdrawals` | yes | Request withdrawal |
| GET  | `/wallet/withdrawals/me` | yes | My requests |
| GET  | `/wallet/invoices` | yes | My invoices |
| GET  | `/wallet/invoices/:id/download` | yes | Download PDF |
| GET/POST/PUT/DELETE | `/wallet/bank-accounts[/:id]` | yes | Bank accounts CRUD |
| **Admin** | | | |
| GET  | `/wallet/admin/transactions` | admin | Filter: `userId, type, status, from, to, transactionId` |
| GET  | `/wallet/admin/withdrawals` | admin | Filter: `status, from, to` |
| POST | `/wallet/admin/withdrawals/:id/process` | admin | `{ action: approve|reject|complete, adminNote }` |
| POST | `/wallet/admin/refunds` | admin | `{ userId, amount, reason }` |

## Coupons

| Method | Path | Auth | Role | Description |
| --- | --- | --- | --- | --- |
| POST | `/coupons/validate` | yes | — | `{ code, orderAmount }` → `{ coupon, discount }` |
| GET / POST / PUT / DELETE | `/coupons[/:id]` | yes | admin | CRUD |
| POST | `/coupons/broadcast` | yes | admin | `{ couponId, message }` — emails active users |

## Referrals

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET  | `/referrals/me` | yes | `{ totalUsed, totalEarned, items }` |
| GET/POST/PATCH | `/referrals[/:id]` | admin | Admin CRUD |

## Projects

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET / POST / GET / PUT / DELETE | `/projects[/:id]` | yes | CRUD |
| POST | `/projects/:id/invites` | yes | `{ emails: [] }` — sends invite emails |
| POST | `/projects/invites/:token/accept` | yes | Accept invite |
| DELETE | `/projects/:id/members/:memberId` | yes | Owner removes member |

## Niches

| Method | Path | Auth | Role |
| --- | --- | --- | --- |
| GET | `/niches` | — | — |
| POST | `/niches` | yes | admin / seller |
| PATCH/DELETE | `/niches/:id` | yes | admin |

## Admin

| Method | Path | Description |
| --- | --- | --- |
| GET  | `/admin/dashboard` | Aggregates: users, listings, orders, earnings, universal commission |
| POST | `/admin/settings/commission` | `{ value }` — universal % |
| GET  | `/admin/users` | Filter: `role, status, search` |
| PATCH | `/admin/users/:id` | `{ status, role }` |
| DELETE | `/admin/users/:id` | — |

## Socket events

| Event | Direction | Payload |
| --- | --- | --- |
| `order:join` | client → | `orderId` |
| `order:leave` | client → | `orderId` |
| `order:message` | both ways | `{ orderId, senderId, message, attachmentUrl? }` |
| `order:status` | server → | `{ orderId, status, liveLink? }` |
| `order:notify` | server → | `{ orderId, preview }` |
| `admin:new-orders` | server → | `{ count }` (room: `role:admin`) |
