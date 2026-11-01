"use server";

import { barcodeSvg } from "@/lib/barcode";
import { getOrderByToken, getTicket } from "@/lib/orders";
import { normalizeTicketNumber } from "@/lib/ticket-number";

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function lookupTicket(token: string, rawNumber: string) {
  const now = Date.now();
  const attempt = attempts.get(token);
  if (attempt && now < attempt.resetAt && attempt.count > 40) {
    return { ok: false as const };
  }
  if (!attempt || now >= attempt.resetAt) {
    attempts.set(token, { count: 1, resetAt: now + 10 * 60 * 1000 });
  } else {
    attempt.count += 1;
  }

  const number = normalizeTicketNumber(rawNumber);
  if (!number || token.length < 16) return { ok: false as const };

  const order = await getOrderByToken(token);
  if (!order || order.status !== "paid" || !order.ticketNumbers.includes(number)) {
    return { ok: false as const };
  }

  const ticket = await getTicket(number);
  if (!ticket) return { ok: false as const };

  return {
    ok: true as const,
    ticket: {
      number: ticket.number,
      age: ticket.age,
      barcode: barcodeSvg(ticket.number),
      bingoCard: ticket.bingoCard,
      prizeWinner: ticket.prizeWinner,
      bingoWinner: ticket.bingoWinner,
    },
  };
}
