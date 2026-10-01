CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(260) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ETB',
    brand VARCHAR(100),
    size VARCHAR(50),

    stock_status VARCHAR(20) DEFAULT 'IN_STOCK'
        CHECK (stock_status IN (
            'IN_STOCK',
            'LOW_STOCK',
            'OUT_OF_STOCK'
        )),

    stock_qty INTEGER DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    is_featured BOOLEAN DEFAULT FALSE,

    is_promotion BOOLEAN DEFAULT FALSE,
    promotion_price DECIMAL(10, 2),
    promotion_text VARCHAR(255),

    category_id INTEGER NOT NULL
        REFERENCES categories(id)
        ON DELETE RESTRICT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category
ON products(category_id);

CREATE INDEX IF NOT EXISTS idx_products_stock
ON products(stock_status);

CREATE INDEX IF NOT EXISTS idx_products_featured
ON products(is_featured);

CREATE INDEX IF NOT EXISTS idx_products_promotion
ON products(is_promotion);

CREATE INDEX IF NOT EXISTS idx_product_images_product
ON product_images(product_id);

-- Existing databases created before the visibility flag was introduced
-- pick it up here (idempotent; fresh installs already have the column).
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================
-- Orders
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,

    order_number VARCHAR(50) UNIQUE,

    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),

    delivery_address TEXT NOT NULL,
    customer_notes TEXT,

    currency VARCHAR(3) NOT NULL DEFAULT 'ETB',

    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN (
            'PENDING',
            'CONFIRMED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
            'CANCELLED'
        )),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,

    order_id INTEGER NOT NULL
        REFERENCES orders(id)
        ON DELETE CASCADE,

    product_id INTEGER NOT NULL
        REFERENCES products(id)
        ON DELETE RESTRICT,

    product_name VARCHAR(255) NOT NULL,
    product_size VARCHAR(50),

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_status
ON orders(status);

CREATE INDEX IF NOT EXISTS idx_orders_created_at
ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order
ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product
ON order_items(product_id);