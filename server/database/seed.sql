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
    'A romantic eau de parfum that opens with bergamot and pink pepper, blooms into a heart of damask rose and peony, and settles into soft musk. Elegant enough for evenings, light enough for everyday wear. 100ml glass bottle.',
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
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description;


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
    'Bold and long-lasting, this 50ml eau de parfum blends rich agarwood with saffron, amber and a touch of vanilla. Warm, woody and unmistakably luxurious - perfect for evenings and special occasions.',
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
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description;


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
    'Fast-absorbing daily lotion with shea butter and vitamin E that softens dry skin without a greasy feel. Delicately scented with a light floral note. 250ml pump bottle.',
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
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description;


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
    'Concentrated laundry detergent that lifts everyday stains and leaves clothes smelling fresh and clean. Effective in both machine and hand wash. 1kg pack.',
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
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description;


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
    'A generous assortment of crisps, biscuits and sweets - perfect for sharing, lunchboxes or movie night. Contents vary by availability.',
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
ON CONFLICT (slug) DO UPDATE SET
    description = EXCLUDED.description;


-- Demo product images. The photo files ship with the API
-- (server/seed-images) and are served at /seed-images/<file>, so they
-- render in every environment regardless of the storage driver. Each
-- insert only fires when the product has no image yet, so re-seeding
-- never duplicates rows and never touches images managed from the
-- admin dashboard. The UPDATE statements below migrate databases that
-- were seeded when the demo images were SVG illustrations.
INSERT INTO product_images (product_id, url, alt_text, sort_order)
SELECT
    p.id,
    '/seed-images/rose-perfume.jpg',
    'Rose Perfume 100ml bottle',
    0
FROM products p
WHERE p.slug = 'rose-perfume-100ml'
AND NOT EXISTS (
    SELECT 1
    FROM product_images pi
    WHERE pi.product_id = p.id
)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, url, alt_text, sort_order)
SELECT
    p.id,
    '/seed-images/classic-oud.jpg',
    'Classic Oud 50ml bottle',
    0
FROM products p
WHERE p.slug = 'classic-oud-50ml'
AND NOT EXISTS (
    SELECT 1
    FROM product_images pi
    WHERE pi.product_id = p.id
)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, url, alt_text, sort_order)
SELECT
    p.id,
    '/seed-images/body-lotion.jpg',
    'Body Lotion 250ml pump bottle',
    0
FROM products p
WHERE p.slug = 'body-lotion-250ml'
AND NOT EXISTS (
    SELECT 1
    FROM product_images pi
    WHERE pi.product_id = p.id
)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, url, alt_text, sort_order)
SELECT
    p.id,
    '/seed-images/laundry-detergent.jpg',
    'Laundry Detergent 1kg jug',
    0
FROM products p
WHERE p.slug = 'laundry-detergent-1kg'
AND NOT EXISTS (
    SELECT 1
    FROM product_images pi
    WHERE pi.product_id = p.id
)
ON CONFLICT DO NOTHING;

INSERT INTO product_images (product_id, url, alt_text, sort_order)
SELECT
    p.id,
    '/seed-images/snack-pack.jpg',
    'Mixed Snack Pack pouch',
    0
FROM products p
WHERE p.slug = 'mixed-snack-pack'
AND NOT EXISTS (
    SELECT 1
    FROM product_images pi
    WHERE pi.product_id = p.id
)
ON CONFLICT DO NOTHING;


-- Migrate databases seeded with the earlier SVG illustrations to the
-- current JPEG photos. No-op on fresh databases.
UPDATE product_images
SET url = '/seed-images/rose-perfume.jpg'
WHERE url = '/seed-images/rose-perfume.svg';

UPDATE product_images
SET url = '/seed-images/classic-oud.jpg'
WHERE url = '/seed-images/classic-oud.svg';

UPDATE product_images
SET url = '/seed-images/body-lotion.jpg'
WHERE url = '/seed-images/body-lotion.svg';

UPDATE product_images
SET url = '/seed-images/laundry-detergent.jpg'
WHERE url = '/seed-images/laundry-detergent.svg';

UPDATE product_images
SET url = '/seed-images/snack-pack.jpg'
WHERE url = '/seed-images/snack-pack.svg';