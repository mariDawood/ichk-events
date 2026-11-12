import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { readAccountId } from "@/lib/account-auth";
import { sql } from "@/lib/db";

export type Account = {
  id: string;
  email: string;
  phone: string;
  name: string;
  passwordHash: string;
  locale: "nl" | "en" | "ar";
};

type AccountRow = {
  id: string;
  email: string;
  phone: string;
  name: string;
  password_hash: string;
  locale: "nl" | "en" | "ar";
};

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    passwordHash: row.password_hash,
    locale: row.locale,
  };
}

export async function getAccountById(id: string) {
  const rows = await sql<AccountRow[]>`
    select id, email, phone, name, password_hash, locale
    from event_signup.accounts
    where id = ${id}
  `;
  return rows[0] ? mapAccount(rows[0]) : null;
}

export async function getAccountByEmail(email: string) {
  const rows = await sql<AccountRow[]>`
    select id, email, phone, name, password_hash, locale
    from event_signup.accounts
    where email = ${email}
  `;
  return rows[0] ? mapAccount(rows[0]) : null;
}

export async function getCurrentAccount() {
  const id = await readAccountId();
  if (!id) return null;
  return getAccountById(id);
}

export async function createAccount(input: {
  email: string;
  phone: string;
  name: string;
  passwordHash: string;
  locale: Account["locale"];
}) {
  const rows = await sql<AccountRow[]>`
    insert into event_signup.accounts (email, phone, name, password_hash, locale)
    values (
      ${input.email},
      ${input.phone},
      ${input.name},
      ${input.passwordHash},
      ${input.locale}
    )
    returning id, email, phone, name, password_hash, locale
  `;
  return mapAccount(rows[0]);
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

export async function updateAccount(
  id: string,
  input: { email: string; phone: string; name: string },
) {
  const rows = await sql<AccountRow[]>`
    update event_signup.accounts
    set email = ${input.email}, phone = ${input.phone}, name = ${input.name}
    where id = ${id}
    returning id, email, phone, name, password_hash, locale
  `;
  return rows[0] ? mapAccount(rows[0]) : null;
}

export async function setAccountLocale(id: string, locale: Account["locale"]) {
  await sql`
    update event_signup.accounts
    set locale = ${locale}
    where id = ${id}
  `;
}

export async function createPasswordReset(accountId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("base64url");
  await sql`
    update event_signup.password_resets
    set used_at = now()
    where account_id = ${accountId} and used_at is null
  `;
  await sql`
    insert into event_signup.password_resets (account_id, token_hash, expires_at)
    values (${accountId}, ${tokenHash}, now() + interval '1 hour')
  `;
  return token;
}

export async function consumePasswordReset(token: string, passwordHash: string) {
  const tokenHash = createHash("sha256").update(token).digest("base64url");
  const rows = await sql<{ account_id: string }[]>`
    update event_signup.password_resets
    set used_at = now()
    where token_hash = ${tokenHash}
      and used_at is null
      and expires_at > now()
    returning account_id
  `;
  const accountId = rows[0]?.account_id;
  if (!accountId) return null;
  await sql`
    update event_signup.accounts
    set password_hash = ${passwordHash}
    where id = ${accountId}
  `;
  return accountId;
}
