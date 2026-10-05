import { afterEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

function stubFetch() {
  const fetchMock = vi.fn<FetchLike>(
    async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
  );

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function sentHeaders(
  fetchMock: ReturnType<typeof stubFetch>
): Headers {
  const [url, init] = fetchMock.mock.calls[0];

  expect(url).toContain("/api");

  return new Headers(init?.headers);
}

describe("apiRequest content type", () => {
  it("does not override the multipart content type for FormData bodies", async () => {
    // Regression: the upload in ProductForm sends a FormData body
    // without a Content-Type header so the browser can add the
    // multipart boundary. Forcing application/json here made the
    // API's JSON body parser reject the multipart bytes, so every
    // image upload failed with a generic 500.
    const fetchMock = stubFetch();

    const body = new FormData();

    body.append(
      "file",
      new Blob(["image-bytes"], { type: "image/png" }),
      "photo.png"
    );

    await apiRequest("/uploads/images", {
      method: "POST",
      body,
    });

    expect(sentHeaders(fetchMock).has("Content-Type")).toBe(
      false
    );
  });

  it("sends a JSON content type for string bodies", async () => {
    const fetchMock = stubFetch();

    await apiRequest("/products", {
      method: "POST",
      body: JSON.stringify({ name: "Rose Perfume" }),
    });

    expect(
      sentHeaders(fetchMock).get("Content-Type")
    ).toBe("application/json");
  });

  it("keeps a caller-supplied content type", async () => {
    const fetchMock = stubFetch();

    await apiRequest("/settings", {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: "plain",
    });

    expect(
      sentHeaders(fetchMock).get("Content-Type")
    ).toBe("text/plain");
  });
});
