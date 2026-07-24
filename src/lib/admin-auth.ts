import "server-only";
import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "gamtoo_admin_session";

// A fixed, deterministic signature derived from the shared admin password —
// simplest thing that works for a single shared secret with no per-user
// concept: unforgeable without knowing ADMIN_PASSWORD, no session store
// needed. The cookie's own maxAge handles expiry.
function computeSessionToken(password: string): string {
  return crypto.createHmac("sha256", password).update("gamtoo-admin").digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export function checkAdminPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return timingSafeStringEqual(input, password);
}

export function getAdminSessionToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return computeSessionToken(password);
}

export function isValidAdminSessionToken(token: string | undefined): boolean {
  const expected = getAdminSessionToken();
  if (!expected || !token) return false;
  return timingSafeStringEqual(token, expected);
}
