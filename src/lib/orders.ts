import "server-only";
import { randomInt } from "node:crypto";
import { createBingoCard } from "@/lib/bingo-card";
import { sql } from "@/lib/db";
import { BINGO_CENTS, priceForAge, type Guest } from "@/lib/pricing";
import { generateTicketNumber } from "@/lib/ticket-number";

export type Order = {
  id: string;
  eventId: string;
  email: string;
  locale: "nl" | "en" | "ar";
  accessToken: string;
  stripeSessionId: string | null;
  status: "pending" | "paid";
  totalCents: number;
  guests: Guest[];
  ticketNumbers: string[];
  emailSent: boolean;
  createdAt: string;
};

export type Ticket = {
  number: string;
  orderId: string;
  slot: number;
  eventId: string;
  email: string;
  age: number;
  entranceCents: number;
  bingoCents: number;
  bingoCard: (number | null)[][] | null;
  prizeWinner: boolean;
  bingoWinner: boolean;
};

type OrderRow = {
  id: string;
  event_id: string;
  email: string;
  locale: "nl" | "en" | "ar";
  access_token: string;
  stripe_session_id: string | null;
  status: "pending" | "paid";
  total_cents: number;
  guests: Guest[];
  ticket_numbers: string[] | null;
  email_sent: boolean;
  created_at: Date | string;
};

type TicketRow = {
  number: string;
  order_id: string;
  slot: number;
  event_id: string;
  email: string;
  age: number;
  entrance_cents: number;
  bingo_cents: number;
  bingo_card: (number | null)[][] | null;
  prize_winner: boolean;
  bingo_winner: boolean;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    eventId: row.event_id,
    email: row.email,
    locale: row.locale,
    accessToken: row.access_token,
    stripeSessionId: row.stripe_session_id,
    status: row.status,
    totalCents: row.total_cents,
    guests: row.guests,
    ticketNumbers: row.ticket_numbers ?? [],
    emailSent: row.email_sent,
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
    age: row.age,
    entranceCents: row.entrance_cents,
    bingoCents: row.bingo_cents,
    bingoCard: row.bingo_card,
    prizeWinner: row.prize_winner,
    bingoWinner: row.bingo_winner,
  };
}

export async function createOrder(input: {
  eventId: string;
  email: string;
  locale: Order["locale"];
  totalCents: number;
  guests: Guest[];
  accessToken: string;
}) {
  const rows = await sql<OrderRow[]>`
    insert into event_signup.orders (
      event_id, email, locale, access_token, total_cents, guests
    ) values (
      ${input.eventId},
      ${input.email},
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
            number, order_id, slot, event_id, email, age,
            entrance_cents, bingo_cents, bingo_card
          ) values (
            ${number},
            ${order.id},
            ${slot},
            ${order.eventId},
            ${order.email},
            ${guest.age},
            ${priceForAge(guest.age)},
            ${guest.bingo ? BINGO_CENTS : 0},
            ${guest.bingo ? sql.json(createBingoCard()) : null}
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
  const tickets = await listTickets(eventId);
  const bingoPool = tickets.filter((ticket) => ticket.bingoCard);
  const bingoPick = bingoPool.length ? pickMany(bingoPool, 1)[0] : null;
  let prizePool = tickets.filter((ticket) => ticket.number !== bingoPick?.number);
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

  if (bingoPick) {
    await sql`
      update event_signup.tickets
      set bingo_winner = true
      where number = ${bingoPick.number}
    `;
  }

  const updated = await listTickets(eventId);
  return {
    prize: updated.filter((ticket) => ticket.prizeWinner),
    bingo: updated.find((ticket) => ticket.bingoWinner) ?? null,
  };
}
