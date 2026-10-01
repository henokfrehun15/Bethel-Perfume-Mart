import { vi } from "vitest";
import jwt from "jsonwebtoken";

import { env } from "../config/env";

/** Minimal stand-in for an Express response, captured by controllers. */
export interface TestResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status: (code: number) => TestResponse;
  json: (body: unknown) => TestResponse;
  setHeader: (name: string, value: string) => TestResponse;
}

export function createResponse(): TestResponse {
  const res: TestResponse = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name.toLowerCase()] = value;
      return res;
    },
  };

  return res;
}

export function createRequest(
  overrides: Partial<{
    body: unknown;
    params: Record<string, string>;
    query: Record<string, string>;
    headers: Record<string, string>;
  }> = {}
) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    ...overrides,
  } as never;
}

type SqlRoute = {
  match: RegExp;
  /** Rows to return: a fixed array, or a function of the SQL + params. */
  rows?:
    | Record<string, unknown>[]
    | ((sql: string, params?: unknown[]) => Record<string, unknown>[]);
};

/**
 * Configure a mocked `pool.query` / `client.query` so it returns
 * rows based on which SQL statement it receives. Accepts either the
 * pool/client object or its `query` mock directly. The first
 * matching route wins; unmatched statements return an empty result.
 */
export function routeSql(
  target:
    | { query: ReturnType<typeof vi.fn> }
    | ReturnType<typeof vi.fn>,
  routes: SqlRoute[]
) {
  const mock = typeof target === "function" ? target : target.query;

  mock.mockImplementation(
    async (sql: string, params?: unknown[]) => {
      for (const route of routes) {
        if (route.match.test(sql)) {
          const rows =
            typeof route.rows === "function"
              ? route.rows(sql, params)
              : route.rows ?? [];

          return { rows, rowCount: rows.length };
        }
      }

      return { rows: [], rowCount: 0 };
    }
  );
}

/** All SQL statements a mocked query function received. */
export function sqlCalls(
  mock: ReturnType<typeof vi.fn>
): string[] {
  return mock.mock.calls.map((call) => String(call[0]));
}

/** Sign an admin JWT the same way authService does. */
export function signAdminToken(
  payload: { id: number; username: string } = {
    id: 1,
    username: "admin",
  }
): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "1h" });
}
