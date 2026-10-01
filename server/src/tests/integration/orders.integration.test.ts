import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import request from "supertest";

const TEST_URL = process.env.TEST_DATABASE_URL;

/**
 * Point the application's pool at a disposable test database.
 * DATABASE_URL is deliberately ignored here so tests can never
 * touch a real store — without TEST_DATABASE_URL this whole suite
 * is skipped and the stub pool is never used.
 */
vi.mock("../../config/database", async () => {
  const stub = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => ({
      query: async () => ({ rows: [], rowCount: 0 }),
      release: () => undefined,
    }),
    end: async () => undefined,
  };

  if (!process.env.TEST_DATABASE_URL) {
    return { pool: stub };
  }

  const pg = await import("pg");

  const PoolCtor =
    (pg as unknown as { Pool?: unknown }).Pool ??
    (pg as unknown as { default?: { Pool?: unknown } }).default
      ?.Pool;

  if (typeof PoolCtor !== "function") {
    throw new Error("Could not resolve the pg Pool constructor");
  }

  const pool = new (PoolCtor as new (config: object) => never)({
    connectionString: process.env.TEST_DATABASE_URL,
    ssl:
      process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
    max: 10,
  });

  return { pool };
});

import { pool } from "../../config/database";
import { runMigrations } from "../../scripts/migrations";
import app from "../app";
import { signAdminToken } from "../helpers";

const runIntegration = TEST_URL ? describe : describe.skip;

const CUSTOMER = "Integration Test";
const PHONE = "0912345678";
const suffix = Date.now().toString(36);

let categoryCounter = 0;
let productCounter = 0;
const createdProductIds: number[] = [];

async function createProduct(
  options: {
    stockQty?: number;
    isActive?: boolean;
    price?: number;
  } = {}
): Promise<{ id: number; slug: string }> {
  const {
    stockQty = 10,
    isActive = true,
    price = 1000,
  } = options;

  categoryCounter += 1;
  productCounter += 1;

  const categorySlug = `it-cat-${suffix}-${categoryCounter}`;
  const productSlug = `it-prod-${suffix}-${productCounter}`;

  const category = await pool.query(
    `INSERT INTO categories (name, slug)
     VALUES ($1, $2)
     RETURNING id`,
    [`Integration ${categoryCounter}`, categorySlug]
  );

  const product = await pool.query(
    `INSERT INTO products (
       name, slug, price, currency, stock_status, stock_qty,
       is_active, category_id
     )
     VALUES ($1, $2, $3, 'ETB', 'IN_STOCK', $4, $5, $6)
     RETURNING id`,
    [
      `Integration Product ${productCounter}`,
      productSlug,
      price,
      stockQty,
      isActive,
      category.rows[0].id,
    ]
  );

  const id = product.rows[0].id as number;

  createdProductIds.push(id);

  return { id, slug: productSlug };
}

async function stockOf(id: number): Promise<{
  qty: number;
  status: string;
}> {
  const result = await pool.query(
    `SELECT stock_qty, stock_status
     FROM products
     WHERE id = $1`,
    [id]
  );

  return {
    qty: Number(result.rows[0].stock_qty),
    status: result.rows[0].stock_status,
  };
}

function checkoutBody(productId: number, quantity: number) {
  return {
    customerName: CUSTOMER,
    customerPhone: PHONE,
    deliveryAddress: "Integration Street 1",
    items: [{ productId, quantity }],
  };
}

runIntegration(
  "orders integration (TEST_DATABASE_URL)",
  () => {
    beforeAll(async () => {
      await runMigrations(pool);
    });

    afterAll(async () => {
      await pool.query(
        `DELETE FROM orders WHERE customer_name = $1`,
        [CUSTOMER]
      );

      if (createdProductIds.length > 0) {
        await pool.query(
          `DELETE FROM products WHERE id = ANY($1::int[])`,
          [createdProductIds]
        );
      }

      await pool.query(
        `DELETE FROM categories WHERE slug LIKE $1`,
        [`it-cat-${suffix}%`]
      );

      await pool.end();
    });

    it("prevents two concurrent checkouts from overselling stock", async () => {
      const { id } = await createProduct({ stockQty: 2 });

      const [first, second] = await Promise.all([
        request(app)
          .post("/api/orders")
          .send(checkoutBody(id, 2)),
        request(app)
          .post("/api/orders")
          .send(checkoutBody(id, 2)),
      ]);

      const statuses = [first.status, second.status].sort();

      expect(statuses).toEqual([201, 409]);

      const stock = await stockOf(id);

      expect(stock.qty).toBe(0);
    });

    it("restores stock when an order is cancelled", async () => {
      const { id } = await createProduct({ stockQty: 7 });

      const created = await request(app)
        .post("/api/orders")
        .send(checkoutBody(id, 2));

      expect(created.status).toBe(201);

      const orderNumber = (
        created.body as { data: { order_number: string } }
      ).data.order_number;

      expect((await stockOf(id)).qty).toBe(5);

      const cancelled = await request(app)
        .put(
          `/api/orders/${encodeURIComponent(orderNumber)}/status`
        )
        .set("Authorization", `Bearer ${signAdminToken()}`)
        .send({ status: "CANCELLED" });

      expect(cancelled.status).toBe(200);

      const stock = await stockOf(id);

      // Cancelling returns the ordered units and recomputes the
      // stock status (7 > 5 -> IN_STOCK).
      expect(stock.qty).toBe(7);
      expect(stock.status).toBe("IN_STOCK");
    });

    it("tracks a created order by order number and phone", async () => {
      const { id } = await createProduct({ stockQty: 10 });

      const created = await request(app)
        .post("/api/orders")
        .send(checkoutBody(id, 1));

      expect(created.status).toBe(201);

      const orderNumber = (
        created.body as { data: { order_number: string } }
      ).data.order_number;

      const found = await request(app)
        .post("/api/orders/track")
        .send({ orderNumber, phone: PHONE });

      expect(found.status).toBe(200);
      expect(
        (found.body as { data: { status: string } }).data.status
      ).toBe("PENDING");

      const wrongPhone = await request(app)
        .post("/api/orders/track")
        .send({ orderNumber, phone: "0999999999" });

      expect(wrongPhone.status).toBe(404);
    });

    it("rejects checkout of a hidden product", async () => {
      const { id } = await createProduct({
        stockQty: 10,
        isActive: false,
      });

      const response = await request(app)
        .post("/api/orders")
        .send(checkoutBody(id, 1));

      expect(response.status).toBe(409);

      expect((await stockOf(id)).qty).toBe(10);
    });

    it("blocks hard delete of a product that appears in orders", async () => {
      const { id } = await createProduct({ stockQty: 10 });

      const created = await request(app)
        .post("/api/orders")
        .send(checkoutBody(id, 1));

      expect(created.status).toBe(201);

      const response = await request(app)
        .delete(`/api/products/${id}`)
        .set("Authorization", `Bearer ${signAdminToken()}`);

      expect(response.status).toBe(409);
      expect(
        (response.body as { message: string }).message
      ).toContain("Hide it from the store instead");
    });

    it("keeps hidden products out of the public listing", async () => {
      const { id, slug } = await createProduct({
        stockQty: 10,
        isActive: true,
      });

      const hide = await request(app)
        .put(`/api/products/${id}`)
        .set("Authorization", `Bearer ${signAdminToken()}`)
        .send({ is_active: false });

      expect(hide.status).toBe(200);

      // The partial update must not touch stock.
      expect((await stockOf(id)).qty).toBe(10);

      const publicList = await request(app).get(
        "/api/products?limit=100"
      );

      const publicSlugs = (
        publicList.body as { data: Array<{ slug: string }> }
      ).data.map((row) => row.slug);

      expect(publicSlugs).not.toContain(slug);

      const adminList = await request(app)
        .get("/api/products?limit=100&includeInactive=true")
        .set("Authorization", `Bearer ${signAdminToken()}`);

      const adminSlugs = (
        adminList.body as { data: Array<{ slug: string }> }
      ).data.map((row) => row.slug);

      expect(adminSlugs).toContain(slug);
    });

    it("reports order stats for the admin dashboard", async () => {
      const response = await request(app)
        .get("/api/orders/stats")
        .set("Authorization", `Bearer ${signAdminToken()}`);

      expect(response.status).toBe(200);

      const data = (
        response.body as {
          data: {
            total_orders: number;
            pending_orders: number;
            revenue: unknown[];
            low_stock: number;
            recent_orders: unknown[];
          };
        }
      ).data;

      expect(typeof data.total_orders).toBe("number");
      expect(typeof data.pending_orders).toBe("number");
      expect(Array.isArray(data.revenue)).toBe(true);
      expect(typeof data.low_stock).toBe("number");
      expect(Array.isArray(data.recent_orders)).toBe(true);
    });
  }
);