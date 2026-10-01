import { Request, Response } from "express";
import { pool } from "../config/database";
import { getDeliveryFee } from "../services/settingsService";
import { notifyNewOrder } from "../services/whatsappService";

interface CheckoutItem {
  productId: number;
  quantity: number;
}

interface CreateOrderBody {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  customerNotes?: string;
  items: CheckoutItem[];
}

function generateOrderNumber(id: number) {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `BETHEL-${year}${month}${day}-${String(
    id
  ).padStart(6, "0")}`;
}

// POST /api/orders
export const createOrder = async (
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
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      customerNotes,
      items,
    } = req.body as CreateOrderBody;

    // ---------------------------------------------------------
    // Basic validation
    // ---------------------------------------------------------

    if (
      !customerName?.trim() ||
      !customerPhone?.trim() ||
      !deliveryAddress?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name, phone number and delivery address are required.",
      });
    }

    if (
      customerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        customerEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // Normalize duplicate product IDs.
    const normalizedItems = new Map<
      number,
      number
    >();

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(productId) ||
        productId <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid cart item.",
        });
      }

      normalizedItems.set(
        productId,
        (normalizedItems.get(productId) || 0) +
          quantity
      );
    }

    await client.query("BEGIN");

    // ---------------------------------------------------------
    // Lock products while validating stock/prices.
    //
    // The client does NOT send prices.
    // Prices always come from the database.
    // ---------------------------------------------------------

    const productIds = Array.from(
      normalizedItems.keys()
    );

    const productResult = await client.query(
      `
      SELECT
        id,
        name,
        size,
        price,
        currency,
        stock_qty,
        stock_status,
        is_active,
        is_promotion,
        promotion_price

      FROM products

      WHERE id = ANY($1::int[])

      FOR UPDATE
      `,
      [productIds]
    );

    if (
      productResult.rows.length !==
      productIds.length
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message:
          "One or more products are no longer available.",
      });
    }

    let subtotal = 0;
    let currency = "ETB";

    const orderItems: Array<{
      productId: number;
      productName: string;
      productSize: string | null;
      quantity: number;
      unitPrice: number;
      itemSubtotal: number;
    }> = [];

    for (const product of productResult.rows) {
      const requestedQuantity =
        normalizedItems.get(product.id) || 0;

      // Hidden products can no longer be purchased, even when they are
      // still sitting in an old cart.
      if (!product.is_active) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: `${product.name} is no longer available.`,
        });
      }

      if (
        product.stock_status ===
          "OUT_OF_STOCK" ||
        Number(product.stock_qty) <
          requestedQuantity
      ) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: `${product.name} does not have enough stock.`,
        });
      }

      const regularPrice = Number(
        product.price
      );

      const promotionPrice =
        product.promotion_price !== null
          ? Number(product.promotion_price)
          : null;

      const unitPrice =
        product.is_promotion &&
        promotionPrice !== null &&
        promotionPrice >= 0
          ? promotionPrice
          : regularPrice;

      const itemSubtotal =
        unitPrice * requestedQuantity;

      subtotal += itemSubtotal;

      currency =
        product.currency || currency;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productSize: product.size,
        quantity: requestedQuantity,
        unitPrice,
        itemSubtotal,
      });
    }

    // Delivery fee is configured in the admin dashboard (store settings)
    // and falls back to 0 when unset.
    const deliveryFee = await getDeliveryFee();
    const total = subtotal + deliveryFee;

    // ---------------------------------------------------------
    // Create order
    // ---------------------------------------------------------

    const orderResult = await client.query(
      `
      INSERT INTO orders (
        customer_name,
        customer_phone,
        customer_email,
        delivery_address,
        customer_notes,
        currency,
        subtotal,
        delivery_fee,
        total,
        status
      )

      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        'PENDING'
      )

      RETURNING id
      `,
      [
        customerName.trim(),
        customerPhone.trim(),
        customerEmail?.trim() || null,
        deliveryAddress.trim(),
        customerNotes?.trim() || null,
        currency,
        subtotal,
        deliveryFee,
        total,
      ]
    );

    const orderId =
      orderResult.rows[0].id;

    const orderNumber =
      generateOrderNumber(orderId);

    await client.query(
      `
      UPDATE orders

      SET
        order_number = $1,
        updated_at = CURRENT_TIMESTAMP

      WHERE id = $2
      `,
      [orderNumber, orderId]
    );

    // ---------------------------------------------------------
    // Insert order items
    // ---------------------------------------------------------

    for (const item of orderItems) {
      await client.query(
        `
        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_size,
          quantity,
          unit_price,
          subtotal
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7
        )
        `,
        [
          orderId,
          item.productId,
          item.productName,
          item.productSize,
          item.quantity,
          item.unitPrice,
          item.itemSubtotal,
        ]
      );
    }

    // ---------------------------------------------------------
    // Reduce stock
    // ---------------------------------------------------------

    for (const item of orderItems) {
      const product = productResult.rows.find(
        (row) => row.id === item.productId
      );

      const newStockQty =
        Number(product.stock_qty) -
        item.quantity;

      let newStockStatus =
        product.stock_status;

      if (newStockQty <= 0) {
        newStockStatus = "OUT_OF_STOCK";
      } else if (newStockQty <= 5) {
        newStockStatus = "LOW_STOCK";
      } else {
        newStockStatus = "IN_STOCK";
      }

      await client.query(
        `
        UPDATE products

        SET
          stock_qty = $1,
          stock_status = $2,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $3
        `,
        [
          newStockQty,
          newStockStatus,
          item.productId,
        ]
      );
    }

    await client.query("COMMIT");

    // ---------------------------------------------------------
    // Notify the store owner over WhatsApp.
    // Fire-and-forget: never blocks or fails the order.
    // ---------------------------------------------------------
    void notifyNewOrder({
      order_number: orderNumber,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail?.trim() || null,
      delivery_address: deliveryAddress.trim(),
      customer_notes: customerNotes?.trim() || null,
      currency,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      items: orderItems.map((item) => ({
        product_name: item.productName,
        product_size: item.productSize,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.itemSubtotal,
      })),
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: {
        id: orderId,
        order_number: orderNumber,
        status: "PENDING",
        currency,
        subtotal,
        delivery_fee: deliveryFee,
        total,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create order.",
    });
  } finally {
    client.release();
  }
};

// ============================================================
// Admin: GET /api/orders
// List orders with pagination and optional status filter.
// ============================================================

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export const listOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const { status, search, limit = "20", offset = "0" } = req.query;

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (
      typeof status === "string" &&
      status &&
      (ORDER_STATUSES as readonly string[]).includes(status)
    ) {
      values.push(status);

      conditions.push(`o.status = $${values.length}`);
    }

    // Free-text search across the fields the admin searches by.
    if (typeof search === "string" && search.trim()) {
      values.push(`%${search.trim()}%`);

      const searchParameter = `$${values.length}`;

      conditions.push(`
        (
          o.order_number ILIKE ${searchParameter}
          OR o.customer_name ILIKE ${searchParameter}
          OR o.customer_phone ILIKE ${searchParameter}
        )
      `);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const parsedLimit = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const parsedOffset = Math.max(Number(offset) || 0, 0);

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM orders o
      ${whereClause}
      `,
      values
    );

    const total = countResult.rows[0].total;

    values.push(parsedLimit);
    const limitParameter = `$${values.length}`;

    values.push(parsedOffset);
    const offsetParameter = `$${values.length}`;

    const result = await pool.query(
      `
      SELECT
        o.id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.delivery_address,
        o.customer_notes,
        o.currency,
        o.subtotal,
        o.delivery_fee,
        o.total,
        o.status,
        o.created_at,
        o.updated_at,

        (
          SELECT COUNT(*)::int
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) AS item_count,

        (
          SELECT COALESCE(SUM(oi.quantity), 0)::int
          FROM order_items oi
          WHERE oi.order_id = o.id
        ) AS total_quantity

      FROM orders o
      ${whereClause}
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ${limitParameter} OFFSET ${offsetParameter}
      `,
      values
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      data: result.rows,
    });
  } catch (error) {
    console.error("List orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

// ============================================================
// Admin: GET /api/orders/stats
// Aggregated numbers for the dashboard overview.
// ============================================================

export const getOrderStats = async (
  _req: Request,
  res: Response
) => {
  try {
    const [
      statusResult,
      revenueResult,
      lowStockResult,
      recentResult,
    ] = await Promise.all([
      // Order counts grouped by status.
      pool.query(`
        SELECT status, COUNT(*)::int AS count
        FROM orders
        GROUP BY status
      `),

      // Revenue excludes cancelled orders, grouped by currency.
      pool.query(`
        SELECT
          currency,
          COALESCE(SUM(total), 0) AS revenue,
          COUNT(*)::int AS count
        FROM orders
        WHERE status != 'CANCELLED'
        GROUP BY currency
        ORDER BY SUM(total) DESC
      `),

      // Active products that need restocking (5 units or fewer).
      pool.query(`
        SELECT COUNT(*)::int AS count
        FROM products
        WHERE is_active = TRUE
          AND (stock_status = 'LOW_STOCK' OR stock_qty <= 5)
      `),

      // Five most recent orders for the dashboard preview.
      pool.query(`
        SELECT
          order_number,
          customer_name,
          currency,
          total,
          status,
          created_at
        FROM orders
        ORDER BY created_at DESC, id DESC
        LIMIT 5
      `),
    ]);

    const byStatus: Record<string, number> = {};
    let totalOrders = 0;

    for (const row of statusResult.rows) {
      byStatus[row.status] = row.count;
      totalOrders += row.count;
    }

    return res.status(200).json({
      success: true,
      data: {
        total_orders: totalOrders,
        pending_orders: byStatus.PENDING || 0,
        by_status: byStatus,
        revenue: revenueResult.rows,
        low_stock: lowStockResult.rows[0].count,
        recent_orders: recentResult.rows,
      },
    });
  } catch (error) {
    console.error("Order stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load order stats",
    });
  }
};

// ============================================================
// Admin: GET /api/orders/:orderNumber
// Full order detail including items.
// ============================================================

export const getOrderByNumber = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderNumber } = req.params;

    const orderResult = await pool.query(
      `
      SELECT
        id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        delivery_address,
        customer_notes,
        currency,
        subtotal,
        delivery_fee,
        total,
        status,
        created_at,
        updated_at
      FROM orders
      WHERE order_number = $1
      `,
      [orderNumber]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const itemsResult = await pool.query(
      `
      SELECT
        id,
        product_id,
        product_name,
        product_size,
        quantity,
        unit_price,
        subtotal
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
      `,
      [orderResult.rows[0].id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...orderResult.rows[0],
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

// ============================================================
// Public: POST /api/orders/track
// Guest order lookup. Requires the order number *and* the phone
// number used at checkout, so orders cannot be enumerated.
// ============================================================

function digitsOnly(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/\D/g, "")
    : "";
}

/**
 * Candidate spellings of a digits-only phone number for comparison:
 * the number as given, plus its Ethiopian local/international
 * equivalent ("09XXXXXXXX" <-> "2519XXXXXXXX").
 */
function phoneCandidates(digits: string): string[] {
  const candidates = [digits];

  if (digits.length === 12 && digits.startsWith("251")) {
    // 2519XXXXXXXX -> 09XXXXXXXX
    candidates.push(`0${digits.slice(3)}`);
  } else if (digits.length === 10 && digits.startsWith("0")) {
    // 09XXXXXXXX -> 2519XXXXXXXX
    candidates.push(`251${digits.slice(1)}`);
  }

  return candidates;
}

/**
 * Compare two phone numbers by their trailing digits so that local
 * (09XXXXXXXX) and international (+2519XXXXXXXX) formats both match.
 */
function phonesMatch(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }

  if (a === b) {
    return true;
  }

  const shortest = Math.min(a.length, b.length);

  if (shortest < 9) {
    return false;
  }

  for (const left of phoneCandidates(a)) {
    for (const right of phoneCandidates(b)) {
      if (
        left === right ||
        left.endsWith(right) ||
        right.endsWith(left)
      ) {
        return true;
      }
    }
  }

  return false;
}

export const trackOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { orderNumber, phone } = req.body as {
      orderNumber?: string;
      phone?: string;
    };

    if (!orderNumber?.trim() || !phone?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Order number and phone number are required.",
      });
    }

    const orderResult = await pool.query(
      `
      SELECT
        id,
        order_number,
        customer_phone,
        currency,
        subtotal,
        delivery_fee,
        total,
        status,
        created_at,
        updated_at
      FROM orders
      WHERE order_number = $1
      `,
      [orderNumber.trim().toUpperCase()]
    );

    const order = orderResult.rows[0];

    const matches =
      order &&
      phonesMatch(
        digitsOnly(order.customer_phone),
        digitsOnly(phone)
      );

    if (!matches) {
      // Identical response for "unknown order" and "wrong phone number"
      // so order numbers cannot be probed.
      return res.status(404).json({
        success: false,
        message:
          "We could not find an order with those details.",
      });
    }

    const itemsResult = await pool.query(
      `
      SELECT
        product_name,
        product_size,
        quantity,
        unit_price,
        subtotal
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
      `,
      [order.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        order_number: order.order_number,
        status: order.status,
        currency: order.currency,
        subtotal: order.subtotal,
        delivery_fee: order.delivery_fee,
        total: order.total,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: itemsResult.rows,
      },
    });
  } catch (error) {
    console.error("Track order error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to look up the order.",
    });
  }
};

// ============================================================
// Admin: PUT /api/orders/:orderNumber/status
// Update order status with transition validation.
// CANCELLED orders restock their items.
// ============================================================

export const updateOrderStatus = async (
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
    const { orderNumber } = req.params;

    const { status } = req.body as { status?: string };

    if (
      !status ||
      !(ORDER_STATUSES as readonly string[]).includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Must be one of: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED.",
      });
    }

    await client.query("BEGIN");

    // Lock the order row.
    const orderResult = await client.query(
      `
      SELECT id, status
      FROM orders
      WHERE order_number = $1
      FOR UPDATE
      `,
      [orderNumber]
    );

    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const order = orderResult.rows[0];

    const currentStatus: string = order.status;

    if (currentStatus === status) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `Order is already ${status}.`,
      });
    }

    // Terminal states cannot change.
    if (
      currentStatus === "DELIVERED" ||
      currentStatus === "CANCELLED"
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: `Order is ${currentStatus} and can no longer be updated.`,
      });
    }

    // Forward-only transitions along the pipeline.
    // Any status may move to CANCELLED.
    const currentIndex = ORDER_STATUSES.indexOf(
      currentStatus as (typeof ORDER_STATUSES)[number]
    );

    const nextIndex = ORDER_STATUSES.indexOf(
      status as (typeof ORDER_STATUSES)[number]
    );

    if (status !== "CANCELLED" && nextIndex <= currentIndex) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: `Cannot move order from ${currentStatus} back to ${status}.`,
      });
    }

    await client.query(
      `
      UPDATE orders
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      `,
      [status, order.id]
    );

    // Restock when cancelling: return quantities to products.
    if (status === "CANCELLED") {
      const itemsResult = await client.query(
        `
        SELECT product_id, quantity
        FROM order_items
        WHERE order_id = $1
        `,
        [order.id]
      );

      for (const item of itemsResult.rows) {
        await client.query(
          `
          UPDATE products
          SET
            stock_qty = stock_qty + $1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
          `,
          [item.quantity, item.product_id]
        );
      }

      // Recompute stock status for affected products.
      await client.query(
        `
        UPDATE products p
        SET stock_status = CASE
          WHEN p.stock_qty <= 0 THEN 'OUT_OF_STOCK'
          WHEN p.stock_qty <= 5 THEN 'LOW_STOCK'
          ELSE 'IN_STOCK'
        END,
        updated_at = CURRENT_TIMESTAMP
        WHERE p.id = ANY($1::int[])
        `,
        [
          itemsResult.rows.map(
            (item) => item.product_id
          ),
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}.`,
      data: {
        order_number: orderNumber,
        status,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update order status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  } finally {
    client.release();
  }
};