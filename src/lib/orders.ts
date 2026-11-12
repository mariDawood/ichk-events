import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { createBingoCard } from "@/lib/bingo-card";
import { sql } from "@/lib/db";
import { BINGO_CENTS, ENTRANCE_CENTS, type Guest } from "@/lib/pricing";
import { generateTicketNumber } from "@/lib/ticket-number";

export type Order = {
  id: string;
  eventId: string;
  email: string | null;
  accountId: string | null;
  locale: "nl" | "en" | "ar";
  accessToken: string;
  stripeSessionId: string | null;
  status: "pending" | "paid";
  totalCents: number;
  guests: Guest[];
  ticketNumbers: string[];
  emailSent: boolean;
  reminderSentAt: string | null;
  createdAt: string;
};

export type Ticket = {
  number: string;
  orderId: string;
  slot: number;
  eventId: string;
  email: string;
  name: string;
  age: number;
  entranceCents: number;
  bingoCents: number;
  bingoCard: (number | null)[][] | null;
  prizeWinner: boolean;
  bingoWinner: boolean;
  checkedInAt: string | null;
  cancelledAt: string | null;
  source: "signup" | "door";
};

export type Attendance = {
  number: string;
  name: string;
  age: number;
  email: string;
  phone: string;
  bingo: boolean;
  source: "signup" | "door";
  checkedInAt: string | null;
  cancelledAt: string | null;
  prizeWinner: boolean;
  bingoWinner: boolean;
  eventId: string;
  orderId: string;
};

type OrderRow = {
  id: string;
  event_id: string;
  email: string | null;
  account_id: string | null;
  locale: "nl" | "en" | "ar";
  access_token: string;
  stripe_session_id: string | null;
  status: "pending" | "paid";
  total_cents: number;
  guests: { name?: string; age: number; bingo: boolean }[];
  ticket_numbers: string[] | null;
  email_sent: boolean;
  reminder_sent_at: Date | string | null;
  created_at: Date | string;
};

type TicketRow = {
  number: string;
  order_id: string;
  slot: number;
  event_id: string;
  email: string;
  name: string | null;
  age: number;
  entrance_cents: number;
  bingo_cents: number;
  bingo_card: (number | null)[][] | null;
  prize_winner: boolean;
  bingo_winner: boolean;
  checked_in_at: Date | string | null;
  cancelled_at: Date | string | null;
  source: string | null;
};

type AttendanceRow = {
  number: string;
  name: string | null;
  age: number;
  ticket_email: string | null;
  bingo_card: (number | null)[][] | null;
  checked_in_at: Date | string | null;
  cancelled_at: Date | string | null;
  source: string | null;
  prize_winner: boolean;
  bingo_winner: boolean;
  event_id: string;
  order_id: string;
  order_email: string | null;
  account_email: string | null;
  account_phone: string | null;
};

function stamp(value: Date | string | null) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    eventId: row.event_id,
    email: row.email,
    accountId: row.account_id,
    locale: row.locale,
    accessToken: row.access_token,
    stripeSessionId: row.stripe_session_id,
    status: row.status,
    totalCents: row.total_cents,
    guests: row.guests.map((guest) => ({
      name: typeof guest.name === "string" ? guest.name : "",
      age: guest.age,
      bingo: guest.bingo,
    })),
    ticketNumbers: row.ticket_numbers ?? [],
    emailSent: row.email_sent,
    reminderSentAt: stamp(row.reminder_sent_at),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapTicket(row: TicketRow): Ticket {
  return {
    number: row.number,
    orderId: row.order_id,
    slot: row.slot,
    eventId: row.event_id,
    email: row.email,
    name: row.name ?? "",
    age: row.age,
    entranceCents: row.entrance_cents,
    bingoCents: row.bingo_cents,
    bingoCard: row.bingo_card,
    prizeWinner: row.prize_winner,
    bingoWinner: row.bingo_winner,
    checkedInAt: stamp(row.checked_in_at),
    cancelledAt: stamp(row.cancelled_at),
    source: row.source === "door" ? "door" : "signup",
  };
}

function mapAttendance(row: AttendanceRow): Attendance {
  return {
    number: row.number,
    name: row.name ?? "",
    age: row.age,
    email: row.account_email || row.order_email || row.ticket_email || "",
    phone: row.account_phone ?? "",
    bingo: row.bingo_card != null,
    source: row.source === "door" ? "door" : "signup",
    checkedInAt: stamp(row.checked_in_at),
    cancelledAt: stamp(row.cancelled_at),
    prizeWinner: row.prize_winner,
    bingoWinner: row.bingo_winner,
    eventId: row.event_id,
    orderId: row.order_id,
  };
}

export function attendanceStatus(row: Attendance): "in" | "expected" | "cancelled" | "door" {
  if (row.cancelledAt) return "cancelled";
  if (row.source === "door") return "door";
  if (row.checkedInAt) return "in";
  return "expected";
}

export async function createOrder(input: {
  eventId: string;
  email: string | null;
  accountId: string | null;
  locale: Order["locale"];
  totalCents: number;
  guests: Guest[];
  accessToken: string;
}) {
  const rows = await sql<OrderRow[]>`
    insert into event_signup.orders (
      event_id, email, account_id, locale, access_token, total_cents, guests
    ) values (
      ${input.eventId},
      ${input.email},
      ${input.accountId},
      ${input.locale},
      ${input.accessToken},
      ${input.totalCents},
      ${sql.json(input.guests)}
    )
    returning *
  `;
  return mapOrder(rows[0]);
}

export async function attachStripeSession(orderId: string, sessionId: string) {
  await sql`
    update event_signup.orders
    set stripe_session_id = ${sessionId}
    where id = ${orderId}
  `;
}

export async function getOrder(id: string) {
  const rows = await sql<OrderRow[]>`
    select * from event_signup.orders where id = ${id}
  `;
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function getOrderByToken(token: string) {
  const rows = await sql<OrderRow[]>`
    select * from event_signup.orders where access_token = ${token}
  `;
  return rows[0] ? mapOrder(rows[0]) : null;
}

export async function listOrders(eventId: string) {
  const rows = await sql<OrderRow[]>`
    select * from event_signup.orders
    where event_id = ${eventId}
    order by created_at desc
  `;
  return rows.map(mapOrder);
}

export async function getTicket(number: string) {
  const rows = await sql<TicketRow[]>`
    select * from event_signup.tickets where number = ${number}
  `;
  return rows[0] ? mapTicket(rows[0]) : null;
}

export async function listTickets(eventId: string) {
  const rows = await sql<TicketRow[]>`
    select * from event_signup.tickets
    where event_id = ${eventId}
    order by number
  `;
  return rows.map(mapTicket);
}

async function issueTickets(order: Order) {
  const issued: string[] = [];

  for (let slot = 0; slot < order.guests.length; slot += 1) {
    const existing = await sql<{ number: string }[]>`
      select number from event_signup.tickets
      where order_id = ${order.id} and slot = ${slot}
    `;
    if (existing[0]) {
      issued.push(existing[0].number);
      continue;
    }

    const guest = order.guests[slot];
    let saved = false;

    for (let attempt = 0; attempt < 8 && !saved; attempt += 1) {
      const number = generateTicketNumber();
      try {
        await sql`
          insert into event_signup.tickets (
            number, order_id, slot, event_id, email, name, age,
            entrance_cents, bingo_cents, bingo_card, source
          ) values (
            ${number},
            ${order.id},
            ${slot},
            ${order.eventId},
            ${order.email ?? ""},
            ${guest.name || ""},
            ${guest.age},
            ${ENTRANCE_CENTS},
            ${guest.bingo ? BINGO_CENTS : 0},
            ${guest.bingo ? sql.json(createBingoCard()) : null},
            'signup'
          )
        `;
        issued.push(number);
        saved = true;
      } catch (error) {
        const raced = await sql<{ number: string }[]>`
          select number from event_signup.tickets
          where order_id = ${order.id} and slot = ${slot}
        `;
        if (raced[0]) {
          issued.push(raced[0].number);
          saved = true;
        } else if (attempt === 7) {
          throw error;
        }
      }
    }
  }

  await sql`
    update event_signup.orders
    set ticket_numbers = ${issued}
    where id = ${order.id}
  `;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fulfillOrder(orderId: string): Promise<Order | null> {
  const existing = await getOrder(orderId);
  if (!existing) return null;
  if (
    existing.status === "paid" &&
    existing.ticketNumbers.length === existing.guests.length
  ) {
    return existing;
  }

  if (existing.status === "pending") {
    const updated = await sql`
      update event_signup.orders
      set status = 'paid'
      where id = ${orderId} and status = 'pending'
      returning id
    `;

    if (updated.length === 0) {
      for (let attempt = 0; attempt < 15; attempt += 1) {
        const ready = await getOrder(orderId);
        if (
          ready &&
          ready.status === "paid" &&
          ready.ticketNumbers.length === ready.guests.length
        ) {
          return ready;
        }
        await sleep(200);
      }
    }
  }

  const order = await getOrder(orderId);
  if (!order || order.status !== "paid") return order;
  if (order.ticketNumbers.length === order.guests.length) return order;

  await issueTickets(order);
  return getOrder(orderId);
}

export async function markEmailSent(orderId: string) {
  await sql`
    update event_signup.orders
    set email_sent = true
    where id = ${orderId}
  `;
}

export async function getBingoNumbers(eventId: string) {
  const rows = await sql<{ number: number }[]>`
    select number from event_signup.bingo_calls
    where event_id = ${eventId}
    order by called_at asc, number asc
  `;
  return rows.map((row) => row.number);
}

export async function callBingoNumber(eventId: string) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const numbers = await getBingoNumbers(eventId);
    const used = new Set(numbers);
    const open: number[] = [];
    for (let number = 1; number <= 75; number += 1) {
      if (!used.has(number)) open.push(number);
    }
    if (open.length === 0) return { numbers, called: null as number | null };

    const called = open[randomInt(open.length)];
    const inserted = await sql<{ number: number }[]>`
      insert into event_signup.bingo_calls (event_id, number)
      values (${eventId}, ${called})
      on conflict do nothing
      returning number
    `;
    if (inserted.length > 0) {
      return { numbers: await getBingoNumbers(eventId), called };
    }
  }

  return { numbers: await getBingoNumbers(eventId), called: null as number | null };
}

export async function resetBingo(eventId: string) {
  await sql`
    delete from event_signup.bingo_calls where event_id = ${eventId}
  `;
}

function pickMany<T>(items: T[], count: number) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy.slice(0, count);
}

export async function drawWinners(eventId: string) {
  const tickets = (await listTickets(eventId)).filter((ticket) => !ticket.cancelledAt);
  const bingoPool = tickets.filter((ticket) => ticket.bingoCard);
  const bingoPicks = pickMany(bingoPool, Math.min(5, bingoPool.length));
  const bingoNumbers = new Set(bingoPicks.map((ticket) => ticket.number));
  let prizePool = tickets.filter((ticket) => !bingoNumbers.has(ticket.number));
  if (prizePool.length < Math.min(5, tickets.length)) prizePool = tickets;
  const prize = pickMany(prizePool, Math.min(5, prizePool.length));

  await sql`
    update event_signup.tickets
    set prize_winner = false, bingo_winner = false
    where event_id = ${eventId}
  `;

  if (prize.length > 0) {
    await sql`
      update event_signup.tickets
      set prize_winner = true
      where event_id = ${eventId}
        and number in ${sql(prize.map((ticket) => ticket.number))}
    `;
  }

  if (bingoPicks.length > 0) {
    await sql`
      update event_signup.tickets
      set bingo_winner = true
      where event_id = ${eventId}
        and number in ${sql(bingoPicks.map((ticket) => ticket.number))}
    `;
  }

  const updated = await listTickets(eventId);
  return {
    prize: updated.filter((ticket) => ticket.prizeWinner),
    bingo: updated.filter((ticket) => ticket.bingoWinner),
  };
}

export async function listAccountRegistrations(accountId: string) {
  const orders = await sql<OrderRow[]>`
    select * from event_signup.orders
    where account_id = ${accountId} and status = 'paid'
    order by created_at desc
  `;
  if (orders.length === 0) return [];

  const tickets = await sql<TicketRow[]>`
    select * from event_signup.tickets
    where order_id in ${sql(orders.map((order) => order.id))}
    order by slot
  `;

  return orders.map((order) => ({
    order: mapOrder(order),
    tickets: tickets.filter((ticket) => ticket.order_id === order.id).map(mapTicket),
  }));
}

export async function listAttendance(eventId: string) {
  const rows = await sql<AttendanceRow[]>`
    select
      t.number,
      t.name,
      t.age,
      t.email as ticket_email,
      t.bingo_card,
      t.checked_in_at,
      t.cancelled_at,
      t.source,
      t.prize_winner,
      t.bingo_winner,
      t.event_id,
      t.order_id,
      o.email as order_email,
      a.email as account_email,
      a.phone as account_phone
    from event_signup.tickets t
    join event_signup.orders o on o.id = t.order_id
    left join event_signup.accounts a on a.id = o.account_id
    where t.event_id = ${eventId}
      and o.status = 'paid'
    order by o.created_at desc, t.slot asc
  `;
  return rows.map(mapAttendance);
}

export async function getAttendanceByNumber(number: string) {
  const rows = await sql<AttendanceRow[]>`
    select
      t.number,
      t.name,
      t.age,
      t.email as ticket_email,
      t.bingo_card,
      t.checked_in_at,
      t.cancelled_at,
      t.source,
      t.prize_winner,
      t.bingo_winner,
      t.event_id,
      t.order_id,
      o.email as order_email,
      a.email as account_email,
      a.phone as account_phone
    from event_signup.tickets t
    join event_signup.orders o on o.id = t.order_id
    left join event_signup.accounts a on a.id = o.account_id
    where t.number = ${number}
      and o.status = 'paid'
  `;
  return rows[0] ? mapAttendance(rows[0]) : null;
}

export async function checkInTicket(number: string) {
  const current = await getTicket(number);
  if (!current) return null;
  if (current.cancelledAt) return { ticket: current, result: "cancelled" as const };
  if (current.checkedInAt) return { ticket: current, result: "already" as const };

  const rows = await sql<TicketRow[]>`
    update event_signup.tickets
    set checked_in_at = now()
    where number = ${number}
      and cancelled_at is null
      and checked_in_at is null
    returning *
  `;
  if (rows[0]) return { ticket: mapTicket(rows[0]), result: "in" as const };

  const again = await getTicket(number);
  if (!again) return null;
  if (again.cancelledAt) return { ticket: again, result: "cancelled" as const };
  return { ticket: again, result: "already" as const };
}

export async function cancelTickets(input: { orderId: string; number: string | null }) {
  const rows = await sql<TicketRow[]>`
    update event_signup.tickets
    set cancelled_at = now()
    where order_id = ${input.orderId}
      and cancelled_at is null
      and checked_in_at is null
      ${input.number ? sql`and number = ${input.number}` : sql``}
    returning *
  `;
  return rows.map(mapTicket);
}

export async function adminCancelTicket(number: string) {
  const rows = await sql<TicketRow[]>`
    update event_signup.tickets
    set cancelled_at = now()
    where number = ${number}
      and cancelled_at is null
      and checked_in_at is null
    returning *
  `;
  return rows[0] ? mapTicket(rows[0]) : null;
}

export async function createDoorTicket(input: {
  eventId: string;
  name: string;
  age: number;
  bingo: boolean;
}) {
  const order = await createOrder({
    eventId: input.eventId,
    email: null,
    accountId: null,
    locale: "nl",
    totalCents: input.bingo ? BINGO_CENTS : 0,
    guests: [{ name: input.name, age: input.age, bingo: input.bingo }],
    accessToken: randomBytes(24).toString("base64url"),
  });

  let number = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateTicketNumber();
    try {
      await sql`
        insert into event_signup.tickets (
          number, order_id, slot, event_id, email, name, age,
          entrance_cents, bingo_cents, bingo_card, source, checked_in_at
        ) values (
          ${candidate},
          ${order.id},
          0,
          ${input.eventId},
          '',
          ${input.name},
          ${input.age},
          0,
          ${input.bingo ? BINGO_CENTS : 0},
          ${input.bingo ? sql.json(createBingoCard()) : null},
          'door',
          now()
        )
      `;
      number = candidate;
      break;
    } catch (error) {
      const unique =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === "23505";
      if (!unique || attempt === 7) throw error;
    }
  }

  await sql`
    update event_signup.orders
    set status = 'paid', ticket_numbers = ${[number]}
    where id = ${order.id}
  `;

  return number;
}

export async function listReminderOrders(eventId: string) {
  const rows = await sql<OrderRow[]>`
    select o.*
    from event_signup.orders o
    where o.event_id = ${eventId}
      and o.status = 'paid'
      and o.reminder_sent_at is null
      and o.email is not null
      and exists (
        select 1 from event_signup.tickets t
        where t.order_id = o.id
          and t.cancelled_at is null
          and t.source = 'signup'
      )
  `;
  return rows.map(mapOrder);
}

export async function markReminderSent(orderId: string) {
  await sql`
    update event_signup.orders
    set reminder_sent_at = now()
    where id = ${orderId} and reminder_sent_at is null
  `;
}

export async function listActiveEmails(eventId: string) {
  const rows = await sql<{ email: string }[]>`
    select distinct o.email
    from event_signup.orders o
    where o.event_id = ${eventId}
      and o.status = 'paid'
      and o.email is not null
      and exists (
        select 1 from event_signup.tickets t
        where t.order_id = o.id
          and t.cancelled_at is null
          and t.source = 'signup'
      )
  `;
  return rows.map((row) => row.email);
}
