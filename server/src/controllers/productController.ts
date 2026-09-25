import { Request, Response } from "express";
import { pool } from "../config/database";


// GET /api/products
// Supports search, category, stock, featured, promotion and pagination.
export const getProducts = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      search,
      category,
      inStock,
      featured,
      promotion,
      limit = "20",
      offset = "0",
    } = req.query;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (search) {
      values.push(`%${String(search)}%`);

      conditions.push(`
        (
          p.name ILIKE $${values.length}
          OR p.brand ILIKE $${values.length}
        )
      `);
    }

    if (category) {
      values.push(String(category));

      conditions.push(
        `c.slug = $${values.length}`
      );
    }

    if (inStock === "true") {
      conditions.push(
        `p.stock_status != 'OUT_OF_STOCK'`
      );
    }

    if (featured === "true") {
      conditions.push(
        `p.is_featured = TRUE`
      );
    }

    if (promotion === "true") {
      conditions.push(
        `p.is_promotion = TRUE`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const parsedLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const parsedOffset = Math.max(
      Number(offset) || 0,
      0
    );

    /*
     * First get the total number of products
     * matching the filters.
     */
    const countValues = [...values];

    const countQuery = `
      SELECT COUNT(*)::int AS total

      FROM products p

      INNER JOIN categories c
        ON c.id = p.category_id

      ${whereClause}
    `;

    const countResult = await pool.query(
      countQuery,
      countValues
    );

    const total = countResult.rows[0].total;

    /*
     * Add pagination values for the product query.
     */
    values.push(parsedLimit);

    const limitParameter =
      `$${values.length}`;

    values.push(parsedOffset);

    const offsetParameter =
      `$${values.length}`;

    const query = `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.currency,
        p.brand,
        p.size,
        p.stock_status,
        p.stock_qty,
        p.is_featured,
        p.is_promotion,
        p.promotion_price,
        p.promotion_text,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,

        (
          SELECT pi.url
          FROM product_images pi
          WHERE pi.product_id = p.id
          ORDER BY pi.sort_order ASC, pi.id ASC
          LIMIT 1
        ) AS image

      FROM products p

      INNER JOIN categories c
        ON c.id = p.category_id

      ${whereClause}

      ORDER BY p.created_at DESC

      LIMIT ${limitParameter}
      OFFSET ${offsetParameter}
    `;

    const result = await pool.query(
      query,
      values
    );

    res.status(200).json({
      success: true,

      count: result.rows.length,

      total,

      limit: parsedLimit,

      offset: parsedOffset,

      data: result.rows,
    });
  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

// GET /api/products/:slug
export const getProductBySlug = async (
  req: Request,
  res: Response
) => {
  try {
    const { slug } = req.params;

    const productResult = await pool.query(
      `
      SELECT
        p.*,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug

      FROM products p

      INNER JOIN categories c
        ON c.id = p.category_id

      WHERE p.slug = $1
      `,
      [slug]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const product = productResult.rows[0];

    const imagesResult = await pool.query(
      `
      SELECT
        id,
        url,
        alt_text,
        sort_order

      FROM product_images

      WHERE product_id = $1

      ORDER BY sort_order ASC, id ASC
      `,
      [product.id]
    );

    res.status(200).json({
      success: true,
      data: {
        ...product,
        images: imagesResult.rows,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};


// POST /api/products
export const createProduct = async (
  req: Request,
  res: Response
) => {
  const client = await pool
    .connect()
    .catch(() => null);

  if (!client) {
    return res.status(503).json({
      success: false,
      message:
        "The service is temporarily unavailable. Please try again.",
    });
  }

  try {
    const {
      name,
      slug,
      description,
      price,
      currency = "ETB",
      brand,
      size,
      stock_status = "IN_STOCK",
      stock_qty = 0,
      is_featured = false,
      is_promotion = false,
      promotion_price,
      promotion_text,
      category_id,
      images = [],
    } = req.body;

    if (!name || !slug || price === undefined || !category_id) {
      return res.status(400).json({
        success: false,
        message:
          "Name, slug, price and category_id are required",
      });
    }

    if (Number(price) < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative",
      });
    }

    if (
      !["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"].includes(
        stock_status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock status",
      });
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `
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

      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14
      )

      RETURNING *
      `,
      [
        name,
        slug,
        description || null,
        price,
        currency,
        brand || null,
        size || null,
        stock_status,
        stock_qty,
        is_featured,
        is_promotion,
        promotion_price || null,
        promotion_text || null,
        category_id,
      ]
    );

    const product = productResult.rows[0];

    // Add product images
    if (Array.isArray(images)) {
      for (let index = 0; index < images.length; index++) {
        const image = images[index];

        if (!image?.url) {
          continue;
        }

        await client.query(
          `
          INSERT INTO product_images (
            product_id,
            url,
            alt_text,
            sort_order
          )

          VALUES ($1, $2, $3, $4)
          `,
          [
            product.id,
            image.url,
            image.alt_text || null,
            index,
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("Create product error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Product slug already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Category does not exist",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  } finally {
    client.release();
  }
};


// PUT /api/products/:id
export const updateProduct = async (
  req: Request,
  res: Response
) => {
  const client = await pool
    .connect()
    .catch(() => null);

  if (!client) {
    return res.status(503).json({
      success: false,
      message:
        "The service is temporarily unavailable. Please try again.",
    });
  }

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid product id is required",
      });
    }

    const {
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
      category_id,
      images,
    } = req.body;

    await client.query("BEGIN");

    const productResult = await client.query(
      `
      UPDATE products

      SET
        name = CASE
          WHEN $1::text IS NULL THEN name
          ELSE $1
        END,

        slug = CASE
          WHEN $2::text IS NULL THEN slug
          ELSE $2
        END,

        description = CASE
          WHEN $3::boolean THEN $4
          ELSE description
        END,

        price = CASE
          WHEN $5::boolean THEN $6
          ELSE price
        END,

        currency = CASE
          WHEN $7::text IS NULL THEN currency
          ELSE $7
        END,

        brand = CASE
          WHEN $8::boolean THEN $9
          ELSE brand
        END,

        size = CASE
          WHEN $10::boolean THEN $11
          ELSE size
        END,

        stock_status = CASE
          WHEN $12::text IS NULL THEN stock_status
          ELSE $12
        END,

        stock_qty = CASE
          WHEN $13::boolean THEN $14
          ELSE stock_qty
        END,

        is_featured = CASE
          WHEN $15::boolean THEN $16
          ELSE is_featured
        END,

        is_promotion = CASE
          WHEN $17::boolean THEN $18
          ELSE is_promotion
        END,

        promotion_price = CASE
          WHEN $19::boolean THEN $20
          ELSE promotion_price
        END,

        promotion_text = CASE
          WHEN $21::boolean THEN $22
          ELSE promotion_text
        END,

        category_id = CASE
          WHEN $23::boolean THEN $24
          ELSE category_id
        END,

        updated_at = CURRENT_TIMESTAMP

      WHERE id = $25

      RETURNING *
      `,
      [
        name ?? null,
        slug ?? null,

        description !== undefined,
        description ?? null,

        price !== undefined,
        price ?? null,

        currency ?? null,

        brand !== undefined,
        brand ?? null,

        size !== undefined,
        size ?? null,

        stock_status ?? null,

        stock_qty !== undefined,
        stock_qty ?? null,

        is_featured !== undefined,
        is_featured ?? null,

        is_promotion !== undefined,
        is_promotion ?? null,

        promotion_price !== undefined,
        promotion_price ?? null,

        promotion_text !== undefined,
        promotion_text ?? null,

        category_id !== undefined,
        category_id ?? null,

        id,
      ]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (Array.isArray(images)) {
      await client.query(
        `
        DELETE FROM product_images
        WHERE product_id = $1
        `,
        [id]
      );

      for (
        let index = 0;
        index < images.length;
        index++
      ) {
        const image = images[index];

        if (!image?.url) {
          continue;
        }

        await client.query(
          `
          INSERT INTO product_images (
            product_id,
            url,
            alt_text,
            sort_order
          )

          VALUES ($1, $2, $3, $4)
          `,
          [
            id,
            image.url,
            image.alt_text ?? null,
            index,
          ]
        );
      }
    }

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: productResult.rows[0],
    });
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error(
      "Update product error:",
      error
    );

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Product slug already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Category does not exist",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  } finally {
    client.release();
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid product id is required",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM products
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete product error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This product is part of existing orders, so it cannot be deleted. Mark it OUT_OF_STOCK instead.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};
export const getProductById = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid product id is required",
      });
    }

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.currency,
        p.brand,
        p.size,
        p.stock_status,
        p.stock_qty,
        p.is_featured,
        p.is_promotion,
        p.promotion_price,
        p.promotion_text,

        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug

      FROM products p
      INNER JOIN categories c
        ON c.id = p.category_id
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const imagesResult = await pool.query(
      `
      SELECT
        id,
        url,
        alt_text,
        sort_order
      FROM product_images
      WHERE product_id = $1
      ORDER BY sort_order ASC, id ASC
      `,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...result.rows[0],
        images: imagesResult.rows,
      },
    });
  } catch (error) {
    console.error("Get product by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};