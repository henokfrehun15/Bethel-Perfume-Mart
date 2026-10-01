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

import { updateOrderStatus } from "../../controllers/orderController";
import {
  createRequest,
  createResponse,
  sqlCalls,
} from "../helpers";

type OrderRow = { id: number; status: string } | null;
type ItemRow = { product_id: number; quantity: number };

function setupTransaction(
  order: OrderRow,
  items: ItemRow[] = []
) {
  clientMock.query.mockReset();
  clientMock.release.mockReset();

  clientMock.query.mockImplementation(
    async (sql: string): Promise<{ rows: unknown[] }> => {
      if (/FROM orders/.test(sql)) {
        return { rows: order ? [order] : [] };
      }

      if (/FROM order_items/.test(sql)) {
        return { rows: items };
      }

      return { rows: [] };
    }
  );

  poolMock.query.mockReset();
}

async function runStatusUpdate(
  orderNumber: string,
  status?: string
) {
  const res = createResponse();

  await updateOrderStatus(
    createRequest({
      params: { orderNumber },
      body: status === undefined ? {} : { status },
    }),
    res as unknown as never
  );

  return res;
}

beforeEach(() => {
  setupTransaction({ id: 1, status: "PENDING" });
});

describe("PUT /api/orders/:orderNumber/status", () => {
  it("rejects an unknown status value", async () => {
    const response = await runStatusUpdate(
      "BETHEL-20260101-000001",
      "TELEPORTED"
    );

    expect(response.statusCode).toBe(400);
  });

  it("rejects a missing status", async () => {
    const response = await runStatusUpdate(
      "BETHEL-20260101-000001"
    );

    expect(response.statusCode).toBe(400);
  });

  it("returns 404 for an unknown order", async () => {
    setupTransaction(null);

    const response = await runStatusUpdate(
      "BETHEL-00000000-000001",
      "CONFIRMED"
    );

    expect(response.statusCode).toBe(404);
    expect(sqlCalls(clientMock.query)).toContain("ROLLBACK");
  });

  it("rejects setting the same status twice", async () => {
    const response = await runStatusUpdate(
      "BETHEL-20260101-000001",
      "PENDING"
    );

    expect(response.statusCode).toBe(400);
    expect((response.body as { message: string }).message).toContain(
      "already"
    );
  });

  it("freezes terminal orders", async () => {
    setupTransaction({ id: 1, status: "DELIVERED" });

    const response = await runStatusUpdate(
      "BETHEL-20260101-000001",
      "CANCELLED"
    );

    expect(response.statusCode).toBe(409);
    expect((response.body as { message: string }).message).toContain(
      "no longer be updated"
    );
  });

  it("blocks moving backwards through the pipeline", async () => {
    setupTransaction({ id: 1, status: "CONFIRMED" });

    const response = await runStatusUpdate(
      "BETHEL-20260101-000001",
      "PENDING"
    );

    expect(response.statusCode).toBe(409);
    expect((response.body as { message: string }).message).toContain(
      "Cannot move"
    );
  });

  it("allows a forward transition and commits", async () => {
    const response = await runStatusUpdate(
      "BETHEL-20260101-000001",
      "CONFIRMED"
    );

    expect(response.statusCode).toBe(200);
    expect(
      (response.body as { data: { status: string } }).data.status
    ).toBe("CONFIRMED");

    const calls = sqlCalls(clientMock.query);
    expect(calls.some((sql) => /UPDATE orders/.test(sql))).toBe(
      true
    );
    expect(calls).toContain("COMMIT");
  });

  it("restocks inventory when an order is cancelled", async () => {
    setupTransaction({ id: 1, status: "PENDING" }, [
      { product_id: 9, quantity: 2 },
      { product_id: 10, quantity: 1 },
    ]);

    const response = await runStatusUpdate(
      "BETHEL-20260101-000001",
      "CANCELLED"
    );

    expect(response.statusCode).toBe(200);

    const calls = clientMock.query.mock.calls;

    const restockCalls = calls.filter((call) =>
      /stock_qty = stock_qty \+ \$1/.test(String(call[0]))
    );

    expect(restockCalls).toHaveLength(2);
    expect(restockCalls[0][1]).toEqual([2, 9]);
    expect(restockCalls[1][1]).toEqual([1, 10]);

    // Stock status is recomputed for the affected products.
    const recompute = calls.find((call) =>
      /stock_status = CASE/.test(String(call[0]))
    );

    expect(recompute).toBeDefined();
    expect(recompute![1]).toEqual([[9, 10]]);

    expect(sqlCalls(clientMock.query)).toContain("COMMIT");
  });

  it("does not restock on non-cancel transitions", async () => {
    setupTransaction({ id: 1, status: "PENDING" }, [
      { product_id: 9, quantity: 2 },
    ]);

    const response = await runStatusUpdate(
      "BETHEL-20260101-000001",
      "PROCESSING"
    );

    expect(response.statusCode).toBe(200);

    const restocks = clientMock.query.mock.calls.filter((call) =>
      /stock_qty = stock_qty \+ \$1/.test(String(call[0]))
    );

    expect(restocks).toHaveLength(0);
  });
});
