# PRD & Technical Architecture
## POS + Inventory Hybrid System

**Document Owner:** Product/Engineering
**Stack:** Node.js/Express · React + Tailwind · PostgreSQL
**Status:** Draft v1.0

---

## 1. Product Overview & User Roles

### 1.1 Problem Statement
Small-to-mid retail stores run their point-of-sale and inventory tracking as two disconnected systems (or a paper ledger + a standalone cash register). This causes stock discrepancies, overselling, and no real-time visibility into what's actually on the shelf. This product unifies **checkout** and **stock management** into one transactional system so that every sale immediately and safely reflects in inventory.

### 1.2 Goals
- Real-time, accurate stock levels visible to both roles.
- Checkout flow that cannot oversell (stock cannot go negative even under concurrent transactions).
- Clear audit trail: every stock change is traceable to a cause (sale, manual adjustment, restock).
- Portfolio-grade: demonstrates transactional integrity, role-based access, and clean architecture — not just CRUD.

### 1.3 User Roles

| Role | Description | Primary Goals |
|---|---|---|
| **Cashier** | Front-of-house staff operating the POS terminal | Fast checkout, accurate cart totals, minimal training needed |
| **Admin / Manager** | Back-office staff managing catalog & stock | Full product CRUD, stock adjustments, sales reporting, user management |

### 1.4 Permission Matrix

| Action | Cashier | Admin/Manager |
|---|:---:|:---:|
| Scan/add item to cart | ✅ | ✅ |
| Apply discount (predefined) | ✅ | ✅ |
| Void/cancel own transaction (pre-payment) | ✅ | ✅ |
| Void a *completed* transaction (refund) | ❌ | ✅ |
| Create/edit/delete products | ❌ | ✅ |
| Manual stock adjustment (restock, damage, correction) | ❌ | ✅ |
| View sales reports/analytics | ❌ (own shift only, optional) | ✅ (all) |
| Manage users | ❌ | ✅ |
| View low-stock alerts | View-only | Full |

Auth: JWT-based session with `role` claim; middleware enforces role-based access control (RBAC) per route.

---

## 2. Core Features (Epics & User Stories)

### Epic A — POS / Cashier Module

**A1. Barcode Scanning Simulation**
- *As a Cashier*, I want to scan (or manually enter) a product's barcode/SKU so it's instantly added to the cart.
- Acceptance Criteria:
  - Input field auto-focuses and accepts keyboard-wedge scanner input (rapid keystrokes + Enter, indistinguishable from typing in software terms).
  - On `Enter`, frontend fires a lookup (`GET /api/products/barcode/:code`); on success, item added to cart; on 404, toast error + input cleared for retry.
  - Debounce/guard against duplicate rapid-fire scans of the same code within 300ms.

**A2. Cart State Management**
- *As a Cashier*, I want to see live-updating cart contents (item, qty, unit price, subtotal, tax, total).
- Acceptance Criteria:
  - Cart held in frontend state (React Context or Zustand) until checkout is confirmed — **no DB writes until payment is confirmed** (cart is ephemeral).
  - Quantity can be incremented/decremented/removed inline.
  - Frontend validates requested qty against the *last known* `stock_quantity` returned by the product lookup (soft check — real enforcement happens server-side at checkout, see §4).
  - Cart persists to `localStorage`/`sessionStorage` per open shift to survive accidental refresh (not architecturally relied upon — just UX).

**A3. Checkout & Payment**
- *As a Cashier*, I want to finalize a sale, choose a payment method, and get a printable/viewable receipt.
- Acceptance Criteria:
  - Single `POST /api/sales/checkout` request sends the full cart payload (product_id + qty list) — server re-validates prices and stock, never trusts client-side totals.
  - Server response includes final `order_id`, itemized receipt, computed totals (server-computed, not client-computed, to prevent tampering).
  - If **any** line item is insufficient in stock at the moment of commit, the **entire transaction fails atomically** — nothing is partially sold (see §4).
  - Supports `cash`, `card`, `qris`/e-wallet as payment method enum (extensible).

**A4. Void / Refund**
- *As a Cashier*, I can cancel a transaction before payment is confirmed (cart is just cleared, nothing to undo).
- *As an Admin*, I can refund a completed sale, which reverses the stock deduction and logs a `refund` movement.

---

### Epic B — Inventory Module

**B1. Product CRUD**
- *As an Admin*, I can create/edit/delete/deactivate products (SKU, name, category, price, cost, stock, barcode, low-stock threshold, image).
- Soft-delete via `is_active` flag — never hard-delete a product referenced by historical sales (referential integrity).

**B2. Dynamic Stock Adjustment**
- *As an Admin*, I can manually adjust stock (restock delivery, damage write-off, stock count correction) with a required reason/note.
- Every adjustment — whether from a sale, refund, or manual action — writes an immutable row to a `stock_movements` ledger table. Current `stock_quantity` on `products` is a **derived/cached** value kept in sync transactionally, but the ledger is the source of truth for auditing.

**B3. Low-Stock Alerts**
- *As an Admin*, I want to see a dashboard badge/list of products at or below their `low_stock_threshold`.
- Implementation: simple query `WHERE stock_quantity <= low_stock_threshold AND is_active = true`, indexed (see §3). No polling needed for MVP — computed on dashboard load; optionally add a websocket push later.

**B4. Sales/Inventory Reporting (stretch)**
- Daily sales totals, best-sellers, stock turnover — powered by aggregate queries over `sales_orders`/`order_items`/`stock_movements`.

---

## 3. Database Schema Design (PostgreSQL)

### 3.1 Entity Overview
```
users            (1) ── (M) sales_orders
products         (1) ── (M) order_items ── (M) sales_orders
products         (1) ── (M) stock_movements
sales_orders     (1) ── (M) order_items
sales_orders     (1) ── (M) stock_movements  (via reference)
```

### 3.2 SQL DDL

```sql
-- ============================================
-- USERS
-- ============================================
CREATE TYPE user_role AS ENUM ('cashier', 'admin');

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'cashier',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CATEGORIES (optional but recommended)
-- ============================================
CREATE TABLE categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE products (
    id                  SERIAL PRIMARY KEY,
    sku                 VARCHAR(50) UNIQUE NOT NULL,
    barcode             VARCHAR(64) UNIQUE,           -- nullable: not all products barcoded
    name                VARCHAR(150) NOT NULL,
    category_id         INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    cost_price          NUMERIC(12,2) NOT NULL DEFAULT 0,
    sell_price          NUMERIC(12,2) NOT NULL CHECK (sell_price >= 0),
    stock_quantity      INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    image_url           TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SALES ORDERS
-- ============================================
CREATE TYPE order_status AS ENUM ('completed', 'refunded', 'voided');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'qris', 'other');

CREATE TABLE sales_orders (
    id              SERIAL PRIMARY KEY,
    order_number    VARCHAR(30) UNIQUE NOT NULL,      -- e.g. INV-20260808-0001
    cashier_id      INTEGER NOT NULL REFERENCES users(id),
    subtotal        NUMERIC(14,2) NOT NULL,
    discount_total  NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_total       NUMERIC(14,2) NOT NULL DEFAULT 0,
    grand_total     NUMERIC(14,2) NOT NULL,
    payment_method  payment_method NOT NULL,
    status          order_status NOT NULL DEFAULT 'completed',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- ORDER ITEMS (line items, price snapshot at time of sale)
-- ============================================
CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    product_name    VARCHAR(150) NOT NULL,   -- snapshot, survives product renames
    unit_price      NUMERIC(12,2) NOT NULL,  -- snapshot, survives price changes
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    line_total      NUMERIC(14,2) NOT NULL
);

-- ============================================
-- STOCK MOVEMENTS (immutable audit ledger)
-- ============================================
CREATE TYPE movement_type AS ENUM ('sale', 'refund', 'restock', 'adjustment_add', 'adjustment_remove');

CREATE TABLE stock_movements (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    movement_type   movement_type NOT NULL,
    quantity_change INTEGER NOT NULL,           -- negative for deductions, positive for additions
    reference_order_id INTEGER REFERENCES sales_orders(id), -- nullable, only for sale/refund
    performed_by    INTEGER NOT NULL REFERENCES users(id),
    note            TEXT,                        -- required for manual adjustments (enforced in app layer)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_low_stock ON products(stock_quantity) WHERE is_active = true;
CREATE INDEX idx_products_category ON products(category_id);

CREATE INDEX idx_orders_cashier ON sales_orders(cashier_id);
CREATE INDEX idx_orders_created_at ON sales_orders(created_at DESC);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_order ref ON stock_movements(reference_order_id);
```

> **Design notes:**
> - `order_items.product_name` / `unit_price` are **denormalized snapshots** — this is intentional. A receipt from 6 months ago must show the price *as it was sold*, not today's price.
> - `stock_movements` is append-only. `products.stock_quantity` is a fast-read cache that is always updated in the *same transaction* as the movement row, so they never drift.
> - The `CHECK (stock_quantity >= 0)` constraint on `products` is a **last line of defense** at the database level — even if application logic has a bug, Postgres itself refuses to let stock go negative.

---

## 4. Concurrency & Data Integrity Strategy

This is the core engineering challenge of the app: **two cashiers checking out the last unit of the same product at the same millisecond must not both succeed.**

### 4.1 The Race Condition
Naive flow (broken):
```
1. SELECT stock_quantity FROM products WHERE id = 5;   -- reads 1
2. App checks: 1 >= requested_qty (1)? Yes, proceed.
3. UPDATE products SET stock_quantity = stock_quantity - 1 WHERE id = 5;
```
If two requests both execute step 1 before either executes step 3, both pass the check, and stock goes to **-1**. Under load this is not a theoretical edge case — it's guaranteed to happen eventually.

### 4.2 Solution: Row-Level Locking + Atomic Transaction

Use `SELECT ... FOR UPDATE` inside a database transaction to lock the specific product rows being sold **before** checking stock. This forces concurrent checkout requests touching the same product to serialize at the database level — the second transaction simply blocks until the first commits or rolls back.

```javascript
// services/checkout.service.js
const db = require('../config/db'); // pg Pool

async function processCheckout({ cashierId, cartItems, paymentMethod }) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    let subtotal = 0;
    const orderItemRows = [];

    // Lock rows in a DETERMINISTIC order (sort by product_id) to avoid deadlocks
    // when two carts share overlapping products in different orders.
    const sortedItems = [...cartItems].sort((a, b) => a.productId - b.productId);

    for (const item of sortedItems) {
      // Lock this product row until COMMIT/ROLLBACK — blocks other
      // concurrent transactions from reading/writing it in the meantime.
      const { rows } = await client.query(
        `SELECT id, sell_price, stock_quantity, name
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [item.productId]
      );

      if (rows.length === 0) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const product = rows[0];

      if (product.stock_quantity < item.quantity) {
        // Triggers the CATCH block -> ROLLBACK -> nothing committed
        throw new Error(
          `Insufficient stock for "${product.name}" (have ${product.stock_quantity}, need ${item.quantity})`
        );
      }

      const lineTotal = Number(product.sell_price) * item.quantity;
      subtotal += lineTotal;

      orderItemRows.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.sell_price,
        quantity: item.quantity,
        lineTotal
      });

      // Deduct stock — safe, because we hold the row lock from FOR UPDATE above.
      // DB-level CHECK (stock_quantity >= 0) is a secondary safety net.
      await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1, updated_at = now()
         WHERE id = $2`,
        [item.quantity, product.id]
      );
    }

    const grandTotal = subtotal; // + tax/discount logic as needed

    const orderNumber = `INV-${Date.now()}`;
    const { rows: orderRows } = await client.query(
      `INSERT INTO sales_orders
         (order_number, cashier_id, subtotal, grand_total, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, 'completed')
       RETURNING id`,
      [orderNumber, cashierId, subtotal, grandTotal, paymentMethod]
    );
    const orderId = orderRows[0].id;

    for (const item of orderItemRows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.productId, item.name, item.unitPrice, item.quantity, item.lineTotal]
      );

      await client.query(
        `INSERT INTO stock_movements
           (product_id, movement_type, quantity_change, reference_order_id, performed_by, note)
         VALUES ($1, 'sale', $2, $3, $4, 'POS checkout')`,
        [item.productId, -item.quantity, orderId, cashierId]
      );
    }

    await client.query('COMMIT');
    return { orderId, orderNumber, grandTotal, items: orderItemRows };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err; // bubble up to controller -> 409/400 response
  } finally {
    client.release();
  }
}

module.exports = { processCheckout };
```

### 4.3 Why This Works

| Mechanism | Purpose |
|---|---|
| `BEGIN ... COMMIT/ROLLBACK` | Atomicity — either the *entire* sale (all line items + order + ledger) succeeds, or none of it does. No partial checkouts. |
| `SELECT ... FOR UPDATE` | Row-level lock — a concurrent transaction trying to read the same product row with `FOR UPDATE` will **block** until this transaction finishes, eliminating the read-then-write race. |
| Sorting products by `id` before locking | Prevents **deadlocks**: if Cart A locks products [3, 7] and Cart B locks products [7, 3], without a consistent order they can deadlock waiting on each other. Sorting ensures all transactions acquire locks in the same global order. |
| `CHECK (stock_quantity >= 0)` at DB schema level | Defense in depth — even a future code bug that skips the lock logic cannot push stock negative; Postgres rejects the UPDATE outright. |
| Stock update + ledger insert in the same transaction | `products.stock_quantity` and `stock_movements` can never drift out of sync — they commit or roll back together. |

### 4.4 Alternative/Complementary Approaches (worth mentioning in interviews)
- **Optimistic locking** (`version` column + `WHERE version = $x`, retry on conflict) — better for low-contention scenarios, avoids holding locks, but requires retry logic. `FOR UPDATE` is preferred here since checkout contention on hot-selling items is exactly the case we must guarantee correctness for.
- **`SELECT ... FOR UPDATE SKIP LOCKED`** — useful for queue-like workloads (not applicable for checkout since we *want* the second request to wait and re-check, not skip).
- **Serializable isolation level** (`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`) — stronger guarantee but requires the app to catch serialization failure errors (`40001`) and retry; `FOR UPDATE` is simpler to reason about for this specific access pattern and sufficient for correctness.

### 4.5 API Error Contract
```
POST /api/sales/checkout
→ 201 Created           { orderId, orderNumber, receipt }
→ 409 Conflict           { error: "INSUFFICIENT_STOCK", productId, available, requested }
→ 400 Bad Request        { error: "INVALID_CART" }
```
Frontend on `409`: show a toast naming the exact product/quantity conflict, remove/adjust that line from the cart, let the cashier retry — never a silent failure.

---

## 5. Backend Directory Structure (Layered / Clean Architecture)

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # pg Pool instance, connection config
│   │   └── env.js                 # centralized env var loading/validation
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   ├── auth.routes.js
│   │   │   └── auth.validation.js # Joi/Zod schemas
│   │   │
│   │   ├── users/
│   │   │   ├── user.controller.js
│   │   │   ├── user.service.js
│   │   │   ├── user.repository.js # raw SQL / query builder layer
│   │   │   └── user.routes.js
│   │   │
│   │   ├── products/
│   │   │   ├── product.controller.js
│   │   │   ├── product.service.js
│   │   │   ├── product.repository.js
│   │   │   ├── product.routes.js
│   │   │   └── product.validation.js
│   │   │
│   │   ├── sales/
│   │   │   ├── sales.controller.js
│   │   │   ├── checkout.service.js    # the concurrency-critical logic from §4
│   │   │   ├── sales.repository.js
│   │   │   ├── sales.routes.js
│   │   │   └── sales.validation.js
│   │   │
│   │   └── inventory/
│   │       ├── inventory.controller.js
│   │       ├── inventory.service.js   # stock adjustments, low-stock queries
│   │       ├── inventory.repository.js
│   │       └── inventory.routes.js
│   │
│   ├── middlewares/
│   │   ├── authenticate.js        # verifies JWT
│   │   ├── authorize.js           # role-based access control (RBAC)
│   │   ├── errorHandler.js        # centralized error -> HTTP response mapping
│   │   └── validateRequest.js     # generic Joi/Zod validation middleware
│   │
│   ├── utils/
│   │   ├── ApiError.js            # custom error class w/ statusCode
│   │   ├── asyncHandler.js        # wraps async controllers, forwards errors
│   │   └── generateOrderNumber.js
│   │
│   ├── database/
│   │   ├── migrations/            # node-pg-migrate or knex migration files
│   │   └── seeds/                 # sample products/users for dev
│   │
│   ├── app.js                     # Express app setup, middleware mounting
│   └── server.js                  # entry point, starts HTTP server
│
├── tests/
│   ├── unit/
│   └── integration/                # e.g. concurrent-checkout race condition test
│
├── .env.example
├── package.json
└── README.md
```

**Layering principle:**
`routes` → `controller` (HTTP concerns only: parse req, call service, format res) → `service` (business logic — this is where `checkout.service.js` from §4 lives) → `repository` (raw SQL queries, isolated from business logic so it's swappable/testable).

This keeps `checkout.service.js` framework-agnostic and independently unit-testable — you can write an integration test that fires two concurrent checkout requests at the same product and assert stock never goes negative, which is a great portfolio talking point.

### Frontend Structure (brief companion)
```
frontend/
├── src/
│   ├── features/
│   │   ├── pos/          # cart state, barcode input, checkout UI
│   │   ├── inventory/    # product CRUD, stock adjustment UI
│   │   ├── auth/
│   │   └── dashboard/    # low-stock alerts, reports
│   ├── components/       # shared UI (Button, Modal, Table, Toast)
│   ├── context/          # CartContext, AuthContext
│   ├── services/         # axios API clients per module
│   ├── hooks/
│   └── App.jsx
```

---

## Suggested Build Order (portfolio pacing)
1. DB schema + migrations + seed data
2. Auth + RBAC middleware
3. Product CRUD (Admin)
4. Checkout service with `FOR UPDATE` transaction + integration test proving no oversell
5. POS frontend (cart, barcode input, checkout)
6. Stock movements ledger + low-stock dashboard
7. Reporting/analytics (stretch)

Good place to write a README section specifically demonstrating the race-condition test — that's the single detail most likely to stand out to a technical reviewer.
