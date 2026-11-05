"use server";

import {
  checkCredentials,
  clearAdminSession,
  clearLoginFailures,
  createAdminSession,
  isAdmin,
  loginAllowed,
  noteLoginFailure,
} from "@/lib/admin-auth";
import { sendOrderEmail } from "@/lib/email";
import { getEvent } from "@/lib/events";
import {
  callBingoNumber,
  drawWinners,
  getOrder,
  getTicket,
  resetBingo,
  type Ticket,
} from "@/lib/orders";
import { normalizeTicketNumber } from "@/lib/ticket-number";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

export async function loginAction(formData: FormData) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!loginAllowed(ip)) redirect("/admin?e=1");

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!checkCredentials(email, password)) {
    noteLoginFailure(ip);
    redirect("/admin?e=1");
  }

  clearLoginFailures(ip);
  await createAdminSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearAdminSession();
  redirect("/admin");
}

export async function callNumberAction(eventId: string) {
  await requireAdmin();
  if (!getEvent(eventId)) return { called: null as number | null, numbers: [] as number[] };
  return callBingoNumber(eventId);
}

export async function resetBingoAction(eventId: string) {
  await requireAdmin();
  if (!getEvent(eventId)) return;
  await resetBingo(eventId);
}

export async function drawWinnersAction(eventId: string) {
  await requireAdmin();
  if (!getEvent(eventId)) return { prize: [], bingo: [] };
  const result = await drawWinners(eventId);
  return {
    prize: result.prize.map(shareTicket),
    bingo: result.bingo.map(shareTicket),
  };
}

export async function scanTicketAction(rawNumber: string) {
  await requireAdmin();
  const number = normalizeTicketNumber(rawNumber);
  if (!number) return null;
  const ticket = await getTicket(number);
  return ticket ? shareTicket(ticket) : null;
}

export async function resendEmailAction(orderId: string) {
  await requireAdmin();
  const order = await getOrder(orderId);
  if (!order) return "missing" as const;
  const tickets: Ticket[] = [];
  for (const number of order.ticketNumbers) {
    const ticket = await getTicket(number);
    if (ticket) tickets.push(ticket);
  }
  const sent = await sendOrderEmail(order, tickets, true);
  return sent ? ("sent" as const) : ("unavailable" as const);
}

function shareTicket(ticket: Ticket) {
  return {
    number: ticket.number,
    email: ticket.email,
    age: ticket.age,
    eventId: ticket.eventId,
    bingo: ticket.bingoCard != null,
    prizeWinner: ticket.prizeWinner,
    bingoWinner: ticket.bingoWinner,
  };
}
