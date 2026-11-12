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
import { mailConfigured, sendAdminMessage, sendOrderEmail } from "@/lib/email";
import { getEvent } from "@/lib/events";
import {
  adminCancelTicket,
  callBingoNumber,
  checkInTicket,
  createDoorTicket,
  drawWinners,
  getAttendanceByNumber,
  getOrder,
  getTicket,
  listActiveEmails,
  resetBingo,
  type Attendance,
  type Ticket,
} from "@/lib/orders";
import { parsePersonName } from "@/lib/pricing";
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
  const checked = await checkInTicket(number);
  if (!checked) return null;
  const row = await getAttendanceByNumber(number);
  if (!row) return null;
  return { ...sharePerson(row), result: checked.result };
}

export async function createDoorAction(input: { eventId: string; name: string; age: number; bingo: boolean }) {
  await requireAdmin();
  if (!getEvent(input.eventId)) return { ok: false as const };
  const name = parsePersonName(input.name);
  if (!name) return { ok: false as const };
  if (!Number.isInteger(input.age) || input.age < 0 || input.age > 120) return { ok: false as const };
  const number = await createDoorTicket({
    eventId: input.eventId,
    name,
    age: input.age,
    bingo: input.bingo === true,
  });
  return { ok: true as const, number };
}

export async function adminCancelAction(number: string) {
  await requireAdmin();
  const normalized = normalizeTicketNumber(number);
  if (!normalized) return false;
  const ticket = await adminCancelTicket(normalized);
  return Boolean(ticket);
}

export async function sendMessageAction(eventId: string, message: string) {
  await requireAdmin();
  const event = getEvent(eventId);
  const text = message.trim();
  if (!event || text.length < 1 || text.length > 2000) return "missing" as const;
  if (!mailConfigured()) return "unavailable" as const;
  const emails = await listActiveEmails(eventId);
  if (emails.length === 0) return "empty" as const;
  const sent = await sendAdminMessage(emails, `Bericht: ${event.title.nl}`, text);
  return sent > 0 ? `sent:${sent}` : "unavailable";
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
    name: ticket.name,
    email: ticket.email,
    age: ticket.age,
    eventId: ticket.eventId,
    bingo: ticket.bingoCard != null,
    prizeWinner: ticket.prizeWinner,
    bingoWinner: ticket.bingoWinner,
  };
}

function sharePerson(row: Attendance) {
  return {
    number: row.number,
    name: row.name,
    email: row.email,
    phone: row.phone,
    age: row.age,
    bingo: row.bingo,
    source: row.source,
    prizeWinner: row.prizeWinner,
    bingoWinner: row.bingoWinner,
    orderId: row.orderId,
    checkedIn: Boolean(row.checkedInAt),
    cancelled: Boolean(row.cancelledAt),
  };
}
