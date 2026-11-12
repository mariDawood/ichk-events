import "server-only";
import { randomBytes } from "node:crypto";
import Stripe from "stripe";
import { getEvent } from "@/lib/events";
import {
  BINGO_CENTS,
  ENTRANCE_CENTS,
  orderTotal,
  parseGuests,
  type Guest,
} from "@/lib/pricing";
import { setAccountLocale } from "@/lib/accounts";
import { sendOrderEmail } from "@/lib/email";
import {
  attachStripeSession,
  createOrder,
  fulfillOrder,
  getTicket,
  type Order,
} from "@/lib/orders";
import { localePath, requestOrigin } from "@/lib/site";

export type SignupError = "account" | "name" | "age" | "event" | "payment" | "generic";

const lineNames = {
  nl: {
    entrance: "Toegang",
    bingo: "Bingokaart",
  },
  en: {
    entrance: "Entrance",
    bingo: "Bingo card",
  },
  ar: {
    entrance: "دخول",
    bingo: "بطاقة بنغو",
  },
} as const;

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function lineItems(guests: Guest[], locale: Order["locale"]) {
  let bingo = 0;
  for (const guest of guests) {
    if (guest.bingo) bingo += 1;
  }

  const names = lineNames[locale];
  const items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const add = (name: string, cents: number, quantity: number) => {
    if (quantity === 0) return;
    items.push({
      quantity,
      price_data: {
        currency: "eur",
        unit_amount: cents,
        product_data: { name },
      },
    });
  };

  if (ENTRANCE_CENTS > 0) add(names.entrance, ENTRANCE_CENTS, guests.length);
  add(names.bingo, BINGO_CENTS, bingo);
  return items;
}

export async function startCheckout(input: {
  eventId: string;
  account: { id: string; email: string };
  guests: unknown;
  company?: string;
  locale: string;
}): Promise<{ ok: false; error: SignupError } | { ok: true; url: string }> {
  if (typeof input.company === "string" && input.company.trim().length > 0) {
    const locale = input.locale === "en" || input.locale === "ar" ? input.locale : "nl";
    return { ok: true, url: localePath(locale, "/") };
  }

  const guests = parseGuests(input.guests);
  if (!guests) {
    const rows = Array.isArray(input.guests) ? input.guests : [];
    const namesMissing = rows.some((item) => {
      if (!item || typeof item !== "object") return true;
      const name = (item as { name?: unknown }).name;
      return typeof name !== "string" || name.trim().length === 0;
    });
    return { ok: false, error: namesMissing ? "name" : "age" };
  }

  const event = getEvent(input.eventId);
  if (!event || Date.now() >= new Date(event.end).getTime()) {
    return { ok: false, error: "event" };
  }

  const locale: Order["locale"] =
    input.locale === "en" || input.locale === "ar" ? input.locale : "nl";
  await setAccountLocale(input.account.id, locale);
  const totalCents = orderTotal(guests);
  const order = await createOrder({
    eventId: event.id,
    email: input.account.email,
    accountId: input.account.id,
    locale,
    totalCents,
    guests,
    accessToken: randomBytes(24).toString("base64url"),
  });

  if (totalCents === 0) {
    const paid = await fulfillOrder(order.id);
    if (!paid) return { ok: false, error: "generic" };
    const tickets = [];
    for (const number of paid.ticketNumbers) {
      const ticket = await getTicket(number);
      if (ticket) tickets.push(ticket);
    }
    await sendOrderEmail(paid, tickets);
    return {
      ok: true,
      url: localePath(locale, `/signup/complete?order=${order.accessToken}`),
    };
  }

  const stripe = stripeClient();
  const demo = process.env.PAYMENTS_DEMO === "1" || !stripe;
  if (demo) {
    if (process.env.NODE_ENV !== "development" && process.env.PAYMENTS_DEMO !== "1") {
      return { ok: false, error: "payment" };
    }
    const paid = await fulfillOrder(order.id);
    if (paid) {
      const tickets = [];
      for (const number of paid.ticketNumbers) {
        const ticket = await getTicket(number);
        if (ticket) tickets.push(ticket);
      }
      await sendOrderEmail(paid, tickets);
    }
    return {
      ok: true,
      url: `${localePath(locale, "/signup/complete")}?order=${order.accessToken}`,
    };
  }

  try {
    const origin = await requestOrigin();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.account.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      line_items: lineItems(guests, locale),
      success_url: `${origin}${localePath(locale, "/signup/complete")}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${localePath(locale, "/")}#aanmelden`,
      locale: locale === "ar" ? "auto" : locale,
    });
    if (!session.url) return { ok: false, error: "payment" };
    await attachStripeSession(order.id, session.id);
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("stripe checkout failed", error instanceof Error ? error.message : "unknown");
    return { ok: false, error: "payment" };
  }
}

export async function completeStripeSession(sessionId: string) {
  const stripe = stripeClient();
  if (!stripe) return null;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const orderId = session.metadata?.orderId;
  if (!orderId) return null;
  if (session.payment_status !== "paid") {
    return { paid: false as const, orderId };
  }
  const order = await fulfillOrder(orderId);
  if (!order) return null;
  const tickets = [];
  for (const number of order.ticketNumbers) {
    const ticket = await getTicket(number);
    if (ticket) tickets.push(ticket);
  }
  const emailed = await sendOrderEmail(order, tickets);
  return { paid: true as const, order, tickets, emailed };
}
