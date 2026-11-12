import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "ichk_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

const failures = new Map<string, { count: number; resetAt: number }>();

function same(left: string, right: string) {
  const a = createHash("sha256").update(left).digest();
  const b = createHash("sha256").update(right).digest();
  return timingSafeEqual(a, b);
}

function adminEmail() {
  return (process.env.ADMIN_EMAIL ?? "mari03dawood@gmail.com").trim().toLowerCase();
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 32).toString("base64url");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "base64url");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function loginAllowed(ip: string) {
  const entry = failures.get(ip);
  if (!entry) return true;
  if (Date.now() > entry.resetAt) {
    failures.delete(ip);
    return true;
  }
  return entry.count < 8;
}

export function noteLoginFailure(ip: string) {
  const entry = failures.get(ip);
  const now = Date.now();
  if (!entry || now > entry.resetAt) {
    failures.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(ip: string) {
  failures.delete(ip);
}

export function checkCredentials(email: string, password: string) {
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash || password.length === 0 || password.length > 200) return false;
  const emailOk = same(email.trim().toLowerCase(), adminEmail());
  const passwordOk = verifyPassword(password, hash);
  return emailOk && passwordOk;
}

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return secret;
}

export async function createAdminSession() {
  const exp = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ exp, nonce: randomBytes(8).toString("base64url") })).toString(
    "base64url",
  );
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

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function isAdmin() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !process.env.ADMIN_PASSWORD_HASH) return false;

  const jar = await cookies();
  const value = jar.get(COOKIE)?.value;
  if (!value) return false;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Date.now();
  } catch {
    return false;
  }
}
