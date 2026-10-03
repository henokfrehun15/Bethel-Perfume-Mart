import { Response } from "express";

import { env, isProduction } from "../config/env";

/**
 * Name of the httpOnly cookie that carries the admin session token.
 *
 * The token is deliberately NOT exposed to JavaScript (no localStorage),
 * so an XSS injection cannot exfiltrate a valid session. The client
 * keeps only the admin's username around for display purposes.
 */
export const ADMIN_COOKIE = "admin_token";

const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/**
 * Cookie lifetime in milliseconds, aligned with JWT_EXPIRES_IN
 * ("1d", "12h", "30m", "45s"). Unparseable values fall back to one
 * day, matching the JWT default.
 */
export function sessionMaxAgeMs(): number {
  const match = /^(\d+)([smhd])$/.exec(
    env.jwtExpiresIn.trim()
  );

  if (!match) {
    return UNIT_MS.d;
  }

  return Number(match[1]) * UNIT_MS[match[2]];
}

function cookieOptions() {
  return {
    httpOnly: true,
    // Browsers refuse Secure cookies over plain http, which is fine:
    // production is always https and dev runs on localhost, which
    // modern browsers treat as a trustworthy origin.
    secure: isProduction,
    // "lax" keeps the cookie on same-site requests (the storefront
    // admin and the API share a registrable domain, differing only
    // by port in development) while blocking cross-site POSTs, which
    // is also the CSRF protection. Set COOKIE_SAME_SITE=none when the
    // API and the admin app are served from different registrable
    // domains in production.
    sameSite: env.cookieSameSite as "lax" | "strict" | "none",
    path: "/",
  };
}

/** Store a freshly issued admin token in the session cookie. */
export function setAdminCookie(
  res: Response,
  token: string
): void {
  res.cookie(ADMIN_COOKIE, token, {
    ...cookieOptions(),
    maxAge: sessionMaxAgeMs(),
  });
}

/** Clear the session cookie (logout). */
export function clearAdminCookie(res: Response): void {
  res.clearCookie(ADMIN_COOKIE, cookieOptions());
}
