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
-- CATEGORIES
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
    barcode             VARCHAR(64) UNIQUE,
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
    order_number    VARCHAR(30) UNIQUE NOT NULL,
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
-- ORDER ITEMS
-- ============================================
CREATE TABLE order_items (
    id              SERIAL PRIMARY KEY,
    order_id        INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    product_name    VARCHAR(150) NOT NULL,
    unit_price      NUMERIC(12,2) NOT NULL,
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    line_total      NUMERIC(14,2) NOT NULL
);

-- ============================================
-- STOCK MOVEMENTS
-- ============================================
CREATE TYPE movement_type AS ENUM ('sale', 'refund', 'restock', 'adjustment_add', 'adjustment_remove');

CREATE TABLE stock_movements (
    id              SERIAL PRIMARY KEY,
    product_id      INTEGER NOT NULL REFERENCES products(id),
    movement_type   movement_type NOT NULL,
    quantity_change INTEGER NOT NULL,
    reference_order_id INTEGER REFERENCES sales_orders(id),
    performed_by    INTEGER NOT NULL REFERENCES users(id),
    note            TEXT,
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
CREATE INDEX idx_stock_movements_order_ref ON stock_movements(reference_order_id);
