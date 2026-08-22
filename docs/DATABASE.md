# Database schema

All tables are managed via Sequelize models in [backend/src/models/](../backend/src/models/). UUID primary keys, `createdAt` / `updatedAt` on every row.

## Tables

| Table | Purpose |
| --- | --- |
| `users` | All accounts (admin, buyer, seller, agency, partnership). `publicId` is the human-facing User ID. |
| `wallets` | One per user; available / pending / bonus / referral balances. |
| `bank_accounts` | Withdrawal destinations. |
| `niches` | Master list of niches; created by admins or sellers during listing. |
| `listings` | Sites for sale. `status` ∈ pending/approved/rejected/paused. `premiumNiches[]` for sensitive verticals. |
| `wishlist_items` | Buyer ↔ listing. |
| `orders` | Buyer purchases. Holds anchor text, landing page, doc link, live link. |
| `order_messages` | Per-order chat (admin ↔ buyer; persisted, broadcast via socket.io). |
| `transactions` | Ledger: deposits, withdrawals, order payments, refunds, referral bonuses. |
| `withdrawal_requests` | Seller withdrawal queue. |
| `coupons` + `coupon_redemptions` | Discount codes + uniqueness enforcement. |
| `referrals` | Tracks who referred whom + earned bonus. |
| `projects` + `project_members` | Buyer-created collaboration spaces. |
| `invoices` | PDF-generated invoices per order. |

## Key relationships

```
users 1—1 wallets
users 1—n listings (seller)
users 1—n orders (buyer)
listings 1—n orders
orders 1—n order_messages
orders 1—1 invoices
users 1—n transactions
users 1—n withdrawal_requests
coupons 1—n coupon_redemptions
projects 1—n project_members
```

## Indexes worth noting

- `users(email)`, `users(role)`, `users(status)`, `users(referralCode)`
- `listings(status, placementType, language)`
- `orders(buyerId, status, paymentStatus)`
- `transactions(userId, type, status)`
- `(couponId, userId)` unique → one redemption per user per coupon

## Money fields

All money is `DECIMAL(10, 2)` (or `12, 2` for wallets/transactions). Default currency: `USD`.

## Going to production

In dev, `sequelize.sync({ alter: false })` materializes the schema. Before launch:

```bash
cd backend
npx sequelize-cli migration:generate --name 0001-init
```

Translate each model into a migration's `up` block. Never `sync` against prod.
