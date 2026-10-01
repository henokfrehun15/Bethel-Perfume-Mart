import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { poolMock } = vi.hoisted(() => ({
  poolMock: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}));

vi.mock("../../config/database", () => ({ pool: poolMock }));

import app from "../app";
import { routeSql } from "../helpers";

const orderRow = {
  id: 1,
  order_number: "BETHEL-20260101-000001",
  customer_phone: "0912345678",
  currency: "ETB",
  subtotal: "1800.00",
  delivery_fee: "0.00",
  total: "1800.00",
  status: "PENDING",
  created_at: "2026-01-01T10:00:00.000Z",
  updated_at: "2026-01-01T10:00:00.000Z",
};

beforeEach(() => {
  poolMock.query.mockReset();

  routeSql(poolMock, [
    {
      match: /FROM orders/,
      rows: (_sql, params) =>
        params?.[0] === orderRow.order_number ? [orderRow] : [],
    },
    {
      match: /FROM order_items/,
      rows: [
        {
          product_name: "Amber Perfume",
          product_size: "50ml",
          quantity: 2,
          unit_price: "900.00",
          subtotal: "1800.00",
        },
      ],
    },
  ]);
});

function track(body: Record<string, unknown>) {
  return request(app)
    .post("/api/orders/track")
    .send(body);
}

describe("POST /api/orders/track", () => {
  it("returns the order for the matching phone number", async () => {
    const response = await track({
      orderNumber: orderRow.order_number,
      phone: "0912345678",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.order_number).toBe(
      orderRow.order_number
    );
    expect(response.body.data.status).toBe("PENDING");
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].product_name).toBe(
      "Amber Perfume"
    );
  });

  it("matches an international phone against a local checkout number", async () => {
    const response = await track({
      orderNumber: orderRow.order_number,
      phone: "+251912345678",
    });

    expect(response.status).toBe(200);
  });

  it("matches a country-code number without the plus sign", async () => {
    const response = await track({
      orderNumber: orderRow.order_number,
      phone: "251912345678",
    });

    expect(response.status).toBe(200);
  });

  it("rejects a wrong phone number with the generic 404", async () => {
    const wrongPhone = await track({
      orderNumber: orderRow.order_number,
      phone: "0999999999",
    });

    expect(wrongPhone.status).toBe(404);

    // An unknown order number must be indistinguishable from a
    // wrong phone number, so orders cannot be probed.
    const unknownOrder = await track({
      orderNumber: "BETHEL-00000000-000001",
      phone: "0912345678",
    });

    expect(unknownOrder.status).toBe(404);
    expect(unknownOrder.body.message).toBe(
      wrongPhone.body.message
    );
  });

  it("requires both the order number and the phone", async () => {
    const response = await track({
      orderNumber: orderRow.order_number,
    });

    expect(response.status).toBe(400);
  });
});
