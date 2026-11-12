import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "ichk_account";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const attempts = new Map<string, { count: number; resetAt: number }>();

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return secret;
}

export function accountAttemptAllowed(key: string) {
  const entry = attempts.get(key);
  if (!entry) return true;
  if (Date.now() > entry.resetAt) {
    attempts.delete(key);
    return true;
  }
  return entry.count < 8;
}

export function noteAccountAttempt(key: string) {
  const entry = attempts.get(key);
  const now = Date.now();
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  entry.count += 1;
}

export function clearAccountAttempt(key: string) {
  attempts.delete(key);
}

export async function createAccountSession(accountId: string) {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(
    JSON.stringify({ id: accountId, exp, nonce: randomBytes(8).toString("base64url") }),
  ).toString("base64url");
  const signature = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAccountSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function readAccountId() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;

  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      id?: unknown;
      exp?: unknown;
    };
    if (typeof parsed.id !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= Date.now()) return null;
    return parsed.id;
  } catch {
    return null;
  }
}
