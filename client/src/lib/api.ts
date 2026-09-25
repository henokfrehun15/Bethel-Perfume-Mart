const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

/** Abort requests that take longer than this. */
const REQUEST_TIMEOUT_MS = 20_000;

const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";

/** Error thrown for any failed API call, including network/timeout failures. */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function clearAdminSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function readErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("message" in data)) {
    return null;
  }

  const message = (data as { message?: unknown }).message;

  return typeof message === "string" && message.trim()
    ? message
    : null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();

  const headers = new Headers(options.headers);
  const hasBody =
    options.body !== undefined && options.body !== null;

  // Only send a JSON content type when there is actually a body.
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  // Respect a caller supplied signal as well.
  const callerSignal = options.signal;

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener(
        "abort",
        () => controller.abort(),
        { once: true }
      );
    }
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      controller.signal.aborted
        ? "The request took too long. Please check your connection and try again."
        : "Unable to reach the server. Please try again.",
      0
    );
  } finally {
    clearTimeout(timeout);
  }

  // 204 / empty responses are valid (for example DELETE).
  const rawBody = await response.text();

  let data: unknown = null;

  if (rawBody) {
    try {
      data = JSON.parse(rawBody);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // An expired or invalid admin session should send the user back to login.
    if (response.status === 401 && typeof window !== "undefined") {
      clearAdminSession();

      if (
        window.location.pathname.startsWith("/admin") &&
        window.location.pathname !== "/admin/login"
      ) {
        window.location.replace("/admin/login");
      }
    }

    throw new ApiError(
      readErrorMessage(data) ||
        `Request failed with status ${response.status}`,
      response.status
    );
  }

  return data as T;
}
