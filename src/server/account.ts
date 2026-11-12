"use server";

import {
  accountAttemptAllowed,
  clearAccountAttempt,
  clearAccountSession,
  createAccountSession,
  noteAccountAttempt,
} from "@/lib/account-auth";
import {
  consumePasswordReset,
  createAccount,
  createPasswordReset,
  getAccountByEmail,
  getCurrentAccount,
  isUniqueViolation,
  updateAccount,
} from "@/lib/accounts";
import { hashPassword, verifyPassword } from "@/lib/admin-auth";
import { sendCancellationEmail, sendPasswordResetEmail } from "@/lib/email";
import { getEvent } from "@/lib/events";
import { safeNextPath } from "@/lib/next-path";
import { cancelTickets, getOrder } from "@/lib/orders";
import { parseEmail, parsePassword, parsePersonName, parsePhone } from "@/lib/pricing";
import { localePath, requestOrigin } from "@/lib/site";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function localeOf(value: string) {
  return value === "en" || value === "ar" ? value : "nl";
}

export async function registerAccount(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordAgain: string;
  nextPath: string;
}): Promise<{ ok: false; error: "name" | "email" | "phone" | "password" | "match" | "taken" | "rate" | "generic" }> {
  const ip = await clientIp();
  if (!accountAttemptAllowed(`register:${ip}`)) return { ok: false, error: "rate" };

  const name = parsePersonName(input.name);
  const email = parseEmail(input.email);
  const phone = parsePhone(input.phone);
  const password = parsePassword(input.password);
  if (!name) return { ok: false, error: "name" };
  if (!email) return { ok: false, error: "email" };
  if (!phone) return { ok: false, error: "phone" };
  if (!password) return { ok: false, error: "password" };
  if (input.password !== input.passwordAgain) return { ok: false, error: "match" };

  const locale = localeOf(await getLocale());
  try {
    const account = await createAccount({
      name,
      email,
      phone,
      passwordHash: hashPassword(password),
      locale,
    });
    clearAccountAttempt(`register:${ip}`);
    await createAccountSession(account.id);
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "taken" };
    console.error("register failed");
    return { ok: false, error: "generic" };
  }

  redirect(safeNextPath(input.nextPath, localePath(locale, "/account")));
}

export async function loginAccount(input: {
  email: string;
  password: string;
  nextPath: string;
}): Promise<{ ok: false; error: "credentials" | "rate" | "generic" }> {
  const ip = await clientIp();
  const key = `login:${ip}`;
  if (!accountAttemptAllowed(key)) return { ok: false, error: "rate" };

  const email = parseEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || password.length === 0 || password.length > 200) {
    noteAccountAttempt(key);
    return { ok: false, error: "credentials" };
  }

  const account = await getAccountByEmail(email);
  if (!account || !verifyPassword(password, account.passwordHash)) {
    noteAccountAttempt(key);
    return { ok: false, error: "credentials" };
  }

  clearAccountAttempt(key);
  await createAccountSession(account.id);
  const locale = localeOf(await getLocale());
  redirect(safeNextPath(input.nextPath, localePath(locale, "/account")));
}

export async function logoutAccount() {
  await clearAccountSession();
  const locale = localeOf(await getLocale());
  redirect(localePath(locale, "/"));
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<{ ok: true } | { ok: false; error: "rate" | "generic" }> {
  const ip = await clientIp();
  const key = `forgot:${ip}`;
  if (!accountAttemptAllowed(key)) return { ok: false, error: "rate" };
  noteAccountAttempt(key);

  const email = parseEmail(input.email);
  if (!email) return { ok: true };

  try {
    const account = await getAccountByEmail(email);
    if (!account) return { ok: true };
    const token = await createPasswordReset(account.id);
    const locale = localeOf(await getLocale());
    const origin = await requestOrigin();
    const link = `${origin}${localePath(locale, "/account/reset")}?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail({ email: account.email, locale: account.locale, link });
  } catch (error) {
    console.error("password reset failed", error instanceof Error ? error.message : "unknown");
    return { ok: false, error: "generic" };
  }

  return { ok: true };
}

export async function resetPassword(input: {
  token: string;
  password: string;
  passwordAgain: string;
}): Promise<{ ok: false; error: "password" | "match" | "invalid" | "generic" }> {
  const password = parsePassword(input.password);
  if (!password) return { ok: false, error: "password" };
  if (input.password !== input.passwordAgain) return { ok: false, error: "match" };
  if (typeof input.token !== "string" || input.token.length < 20) {
    return { ok: false, error: "invalid" };
  }

  try {
    const accountId = await consumePasswordReset(input.token, hashPassword(password));
    if (!accountId) return { ok: false, error: "invalid" };
    await createAccountSession(accountId);
  } catch (error) {
    console.error("password reset save failed", error instanceof Error ? error.message : "unknown");
    return { ok: false, error: "generic" };
  }

  const locale = localeOf(await getLocale());
  redirect(localePath(locale, "/account"));
}

export async function updateProfile(input: {
  name: string;
  email: string;
  phone: string;
}): Promise<{ ok: true } | { ok: false; error: "account" | "name" | "email" | "phone" | "taken" | "generic" }> {
  const account = await getCurrentAccount();
  if (!account) return { ok: false, error: "account" };

  const name = parsePersonName(input.name);
  const email = parseEmail(input.email);
  const phone = parsePhone(input.phone);
  if (!name) return { ok: false, error: "name" };
  if (!email) return { ok: false, error: "email" };
  if (!phone) return { ok: false, error: "phone" };

  const taken = await getAccountByEmail(email);
  if (taken && taken.id !== account.id) return { ok: false, error: "taken" };

  try {
    await updateAccount(account.id, { name, email, phone });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "taken" };
    console.error("profile update failed");
    return { ok: false, error: "generic" };
  }

  return { ok: true };
}

export async function cancelRegistration(input: {
  orderId: string;
  number: string | null;
}): Promise<{ ok: true } | { ok: false; error: "account" | "closed" | "generic" }> {
  const account = await getCurrentAccount();
  if (!account) return { ok: false, error: "account" };
  if (typeof input.orderId !== "string" || input.orderId.length < 10) {
    return { ok: false, error: "closed" };
  }

  const order = await getOrder(input.orderId);
  if (!order || order.accountId !== account.id || order.status !== "paid") {
    return { ok: false, error: "closed" };
  }

  const event = getEvent(order.eventId);
  if (!event || Date.now() >= new Date(event.end).getTime()) {
    return { ok: false, error: "closed" };
  }

  const number = typeof input.number === "string" && input.number.length > 0 ? input.number : null;
  try {
    const tickets = await cancelTickets({ orderId: order.id, number });
    if (tickets.length === 0) return { ok: false, error: "closed" };
    await sendCancellationEmail(order, tickets);
    return { ok: true };
  } catch (error) {
    console.error("cancel failed", error instanceof Error ? error.message : "unknown");
    return { ok: false, error: "generic" };
  }
}
