import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

import { errorHandler } from "../../middleware/errorHandler";

/**
 * A minimal app that mirrors how server.ts uses the handler: a JSON
 * body parser in front, throwing routes, and the handler last.
 */
function makeApp() {
  const app = express();

  app.use(express.json());

  app.post("/json", (_req, res) => {
    res.json({ success: true });
  });

  app.get("/unexpected", () => {
    throw new Error("database exploded");
  });

  app.get("/exposed", () => {
    throw Object.assign(new Error("the kettle is short and stout"), {
      status: 418,
      expose: true,
    });
  });

  app.get("/unexposed", () => {
    throw Object.assign(new Error("secret details"), {
      status: 400,
    });
  });

  app.get("/bad-status", () => {
    throw Object.assign(new Error("nonsense"), {
      status: 999,
    });
  });

  app.use(errorHandler);

  return app;
}

describe("errorHandler", () => {
  it("keeps body-parser's 400 for a malformed JSON body", async () => {
    const response = await request(makeApp())
      .post("/json")
      .set("Content-Type", "application/json")
      .send('{"broken"');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).not.toBe(
      "Something went wrong. Please try again."
    );
  });

  it("returns the generic 500 for errors without a status", async () => {
    const response = await request(makeApp()).get("/unexpected");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  });

  it("surfaces the status and message of exposed client errors", async () => {
    const response = await request(makeApp()).get("/exposed");

    expect(response.status).toBe(418);
    expect(response.body.message).toBe(
      "the kettle is short and stout"
    );
  });

  it("keeps the status but hides the message of unexposed errors", async () => {
    const response = await request(makeApp()).get("/unexposed");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("falls back to 500 for statuses outside the HTTP range", async () => {
    const response = await request(makeApp()).get("/bad-status");

    expect(response.status).toBe(500);
  });
});
