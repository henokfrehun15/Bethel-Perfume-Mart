INSERT INTO categories (name, slug, description)
VALUES
    (
        'Perfumes',
        'perfumes',
        'Men and women fragrances'
    ),
    (
        'Cosmetics',
        'cosmetics',
        'Beauty and cosmetic products'
    ),
    (
        'Household',
        'household',
        'Household essentials'
    ),
    (
        'Snacks',
        'snacks',
        'Food and snacks'
    )
ON CONFLICT (slug) DO NOTHING;


INSERT INTO products (
    name,
    slug,
    description,
    price,
    currency,
    brand,
    size,
    stock_status,
    stock_qty,
    is_featured,
    is_promotion,
    promotion_price,
    promotion_text,
    category_id
)
SELECT
    'Rose Perfume',
    'rose-perfume-100ml',
    'Elegant rose fragrance suitable for everyday use.',
    1500,
    'ETB',
    'Bethel',
    '100ml',
    'IN_STOCK',
    15,
    TRUE,
    FALSE,
    NULL,
    NULL,
    id
FROM categories
WHERE slug = 'perfumes'
ON CONFLICT (slug) DO NOTHING;


INSERT INTO products (
    name,
    slug,
    description,
    price,
    currency,
    brand,
    size,
    stock_status,
    stock_qty,
    is_featured,
    is_promotion,
    promotion_price,
    promotion_text,
    category_id
)
SELECT
    'Classic Oud',
    'classic-oud-50ml',
    'Warm oud fragrance with a rich and lasting scent.',
    2200,
    'ETB',
    'Bethel',
    '50ml',
    'LOW_STOCK',
    3,
    TRUE,
    TRUE,
    1900,
    'Special offer',
    id
FROM categories
WHERE slug = 'perfumes'
ON CONFLICT (slug) DO NOTHING;


INSERT INTO products (
    name,
    slug,
    description,
    price,
    currency,
    brand,
    size,
    stock_status,
    stock_qty,
    is_featured,
    is_promotion,
    promotion_price,
    promotion_text,
    category_id
)
SELECT
    'Body Lotion',
    'body-lotion-250ml',
    'Moisturizing body lotion for daily use.',
    850,
    'ETB',
    'Bethel',
    '250ml',
    'IN_STOCK',
    20,
    FALSE,
    FALSE,
    NULL,
    NULL,
    id
FROM categories
WHERE slug = 'cosmetics'
ON CONFLICT (slug) DO NOTHING;


INSERT INTO products (
    name,
    slug,
    description,
    price,
    currency,
    brand,
    size,
    stock_status,
    stock_qty,
    is_featured,
    is_promotion,
    promotion_price,
    promotion_text,
    category_id
)
SELECT
    'Laundry Detergent',
    'laundry-detergent-1kg',
    'Household laundry detergent.',
    450,
    'ETB',
    'Bethel',
    '1kg',
    'IN_STOCK',
    30,
    FALSE,
    FALSE,
    NULL,
    NULL,
    id
FROM categories
WHERE slug = 'household'
ON CONFLICT (slug) DO NOTHING;


INSERT INTO products (
    name,
    slug,
    description,
    price,
    currency,
    brand,
    size,
    stock_status,
    stock_qty,
    is_featured,
    is_promotion,
    promotion_price,
    promotion_text,
    category_id
)
SELECT
    'Mixed Snack Pack',
    'mixed-snack-pack',
    'Assorted snacks for everyday enjoyment.',
    300,
    'ETB',
    'Bethel',
    'Pack',
    'IN_STOCK',
    25,
    FALSE,
    TRUE,
    250,
    'Special offer',
    id
FROM categories
WHERE slug = 'snacks'
ON CONFLICT (slug) DO NOTHING;