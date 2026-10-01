import { beforeEach, describe, expect, it, vi } from "vitest";

const { poolMock, clientMock } = vi.hoisted(() => {
  const client = {
    query: vi.fn(),
    release: vi.fn(),
  };

  const pool = {
    query: vi.fn(),
    connect: vi.fn(async () => client),
    end: vi.fn(),
  };

  return { poolMock: pool, clientMock: client };
});

vi.mock("../../config/database", () => ({ pool: poolMock }));

import { createOrder } from "../../controllers/orderController";
import {
  createRequest,
  createResponse,
  sqlCalls,
} from "../helpers";

interface ProductRow {
  id: number;
  name: string;
  size: string | null;
  price: number;
  currency: string;
  stock_qty: number;
  stock_status: string;
  is_active: boolean;
  is_promotion: boolean;
  promotion_price: number | null;
}

function defaultProduct(
  overrides: Partial<ProductRow> = {}
): ProductRow {
  return {
    id: 7,
    name: "Amber Perfume",
    size: "50ml",
    price: 1800,
    currency: "ETB",
    stock_qty: 10,
    stock_status: "IN_STOCK",
    is_active: true,
    is_promotion: false,
    promotion_price: null,
    ...overrides,
  };
}

function setupTransaction(product: ProductRow | null) {
  clientMock.query.mockReset();
  clientMock.release.mockReset();

  clientMock.query.mockImplementation(
    async (sql: string): Promise<{ rows: unknown[] }> => {
      if (/FROM products/.test(sql)) {
        return { rows: product ? [product] : [] };
      }

      if (/INSERT INTO orders/.test(sql)) {
        return { rows: [{ id: 42 }] };
      }

      return { rows: [] };
    }
  );

  // Settings (delivery fee) and WhatsApp lookups fall back safely
  // on empty results.
  poolMock.query.mockReset();
  poolMock.query.mockResolvedValue({ rows: [] });
  poolMock.connect.mockClear();
}

async function runOrder(body: unknown) {
  const res = createResponse();

  await createOrder(
    createRequest({ body }),
    res as unknown as never
  );

  return res;
}

const validBody = {
  customerName: "Henok",
  customerPhone: "0912345678",
  deliveryAddress: "Addis Ababa",
  items: [{ productId: 7, quantity: 2 }],
};

beforeEach(() => {
  setupTransaction(defaultProduct());
});

describe("POST /api/orders (createOrder)", () => {
  it("requires name, phone and address", async () => {
    const response = await runOrder({
      ...validBody,
      customerName: "",
    });

    expect(response.statusCode).toBe(400);
    expect((response.body as { message: string }).message).toContain(
      "required"
    );
  });

  it("rejects an empty cart", async () => {
    const response = await runOrder({
      ...validBody,
      items: [],
    });

    expect(response.statusCode).toBe(400);
    expect((response.body as { message: string }).message).toContain(
      "empty"
    );
  });

  it("rejects invalid quantities", async () => {
    const response = await runOrder({
      ...validBody,
      items: [{ productId: 7, quantity: 0 }],
    });

    expect(response.statusCode).toBe(400);
    expect((response.body as { message: string }).message).toContain(
      "Invalid cart item"
    );
  });

  it("rejects the order when a product no longer exists", async () => {
    setupTransaction(null);

    const response = await runOrder(validBody);

    expect(response.statusCode).toBe(400);
    expect((response.body as { message: string }).message).toContain(
      "no longer available"
    );
  });

  it("blocks checkout of a hidden product and rolls back", async () => {
    setupTransaction(defaultProduct({ is_active: false }));

    const response = await runOrder(validBody);

    expect(response.statusCode).toBe(409);
    expect((response.body as { message: string }).message).toContain(
      "is no longer available"
    );
    expect(sqlCalls(clientMock.query)).toContain("ROLLBACK");
    expect(clientMock.release).toHaveBeenCalled();
  });

  it("rejects quantities beyond available stock", async () => {
    setupTransaction(defaultProduct({ stock_qty: 1 }));

    const response = await runOrder(validBody);

    expect(response.statusCode).toBe(409);
    expect((response.body as { message: string }).message).toContain(
      "does not have enough stock"
    );
    expect(sqlCalls(clientMock.query)).toContain("ROLLBACK");
  });

  it("rejects out-of-stock products even when quantity looks available", async () => {
    setupTransaction(
      defaultProduct({ stock_status: "OUT_OF_STOCK", stock_qty: 5 })
    );

    const response = await runOrder(validBody);

    expect(response.statusCode).toBe(409);
  });

  it("creates the order with server-side prices and commits", async () => {
    const response = await runOrder(validBody);

    expect(response.statusCode).toBe(201);

    const body = response.body as {
      success: boolean;
      data: {
        order_number: string;
        status: string;
        subtotal: number;
        delivery_fee: number;
        total: number;
      };
    };

    expect(body.success).toBe(true);
    expect(body.data.status).toBe("PENDING");
    expect(body.data.order_number).toMatch(/^BETHEL-/);

    // Price always comes from the database: 1800 × 2.
    expect(body.data.subtotal).toBe(3600);
    expect(body.data.total).toBe(3600);

    const calls = sqlCalls(clientMock.query);
    expect(calls).toContain("BEGIN");
    expect(calls).toContain("COMMIT");

    // Stock is decremented server-side: 10 - 2 = 8, still IN_STOCK.
    const stockUpdate = clientMock.query.mock.calls.find(
      (call) =>
        /UPDATE products/.test(String(call[0])) &&
        /stock_qty = \$1/.test(String(call[0]))
    );

    expect(stockUpdate).toBeDefined();
    expect(stockUpdate![1]).toEqual([8, "IN_STOCK", 7]);
  });

  it("uses the promotion price when the product is promoted", async () => {
    setupTransaction(
      defaultProduct({
        is_promotion: true,
        promotion_price: 1500,
      })
    );

    const response = await runOrder(validBody);

    expect(response.statusCode).toBe(201);

    const body = response.body as { data: { subtotal: number } };

    expect(body.data.subtotal).toBe(3000);
  });

  it("recomputes LOW_STOCK after the sale", async () => {
    setupTransaction(
      defaultProduct({ stock_qty: 6, stock_status: "IN_STOCK" })
    );

    const response = await runOrder(validBody);

    expect(response.statusCode).toBe(201);

    const stockUpdate = clientMock.query.mock.calls.find(
      (call) =>
        /UPDATE products/.test(String(call[0])) &&
        /stock_qty = \$1/.test(String(call[0]))
    );

    // 6 - 2 = 4 -> LOW_STOCK
    expect(stockUpdate![1]).toEqual([4, "LOW_STOCK", 7]);
  });

  it("merges duplicate cart lines for the same product", async () => {
    const response = await runOrder({
      ...validBody,
      items: [
        { productId: 7, quantity: 1 },
        { productId: 7, quantity: 2 },
      ],
    });

    expect(response.statusCode).toBe(201);

    const itemInsert = clientMock.query.mock.calls.find((call) =>
      /INSERT INTO order_items/.test(String(call[0]))
    );

    expect(itemInsert).toBeDefined();

    // quantity is the 5th parameter of the item INSERT.
    expect(itemInsert![1][4]).toBe(3);
  });
});