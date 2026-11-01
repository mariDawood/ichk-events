import { AdminPanel } from "@/app/[locale]/admin/admin-panel";
import { loginAction } from "@/server/admin";
import { isAdmin } from "@/lib/admin-auth";
import { events } from "@/content/events";
import { getVisibleEvents } from "@/lib/events";
import { getBingoNumbers, listOrders, listTickets } from "@/lib/orders";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beheer",
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; event?: string }>;
}) {
  const query = await searchParams;
  const signedIn = await isAdmin();

  if (!signedIn) {
    return (
      <main id="main" className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-16">
        <h1 className="font-display text-5xl text-chapel">Beheer</h1>
        <form action={loginAction} className="mt-8 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
            E-mailadres
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              className="min-h-12 rounded-2xl bg-ivory px-4 text-xl font-normal text-ink ring-1 ring-line"
            />
          </label>
          <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
            Wachtwoord
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="min-h-12 rounded-2xl bg-ivory px-4 text-xl font-normal text-ink ring-1 ring-line"
            />
          </label>
          {query.e === "1" ? (
            <p className="text-lg" role="alert">
              Dat klopt niet.
            </p>
          ) : null}
          <button type="submit" className="mt-2 min-h-14 rounded-full bg-chapel px-5 text-xl text-ivory">
            Openen
          </button>
        </form>
      </main>
    );
  }

  const visible = getVisibleEvents(new Date());
  const event =
    events.find((item) => item.id === query.event) ?? visible[0] ?? events[0];
  const [orders, tickets, numbers] = await Promise.all([
    listOrders(event.id),
    listTickets(event.id),
    getBingoNumbers(event.id),
  ]);
  const byNumber = new Map(tickets.map((ticket) => [ticket.number, ticket]));

  return (
    <main id="main" className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AdminPanel
        eventId={event.id}
        eventTitle={event.title.nl}
        numbers={numbers}
        orders={orders.map((order) => ({
          id: order.id,
          email: order.email,
          status: order.status,
          totalCents: order.totalCents,
          createdAt: order.createdAt,
          emailSent: order.emailSent,
          tickets: order.ticketNumbers.flatMap((number) => {
            const ticket = byNumber.get(number);
            if (!ticket) return [];
            return [
              {
                number: ticket.number,
                email: ticket.email,
                age: ticket.age,
                eventId: ticket.eventId,
                bingo: ticket.bingoCard != null,
                prizeWinner: ticket.prizeWinner,
                bingoWinner: ticket.bingoWinner,
              },
            ];
          }),
        }))}
      />
    </main>
  );
}
