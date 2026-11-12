import { AdminPanel } from "@/app/[locale]/admin/admin-panel";
import { loginAction } from "@/server/admin";
import { isAdmin } from "@/lib/admin-auth";
import { events } from "@/content/events";
import { getVisibleEvents } from "@/lib/events";
import { attendanceStatus, getBingoNumbers, listAttendance } from "@/lib/orders";
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
  const [people, numbers] = await Promise.all([
    listAttendance(event.id),
    getBingoNumbers(event.id),
  ]);

  return (
    <main id="main" className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <AdminPanel
        eventId={event.id}
        eventTitle={event.title.nl}
        numbers={numbers}
        people={people.map((person) => ({
          number: person.number,
          name: person.name,
          email: person.email,
          phone: person.phone,
          age: person.age,
          bingo: person.bingo,
          source: person.source,
          status: attendanceStatus(person),
          prizeWinner: person.prizeWinner,
          bingoWinner: person.bingoWinner,
          orderId: person.orderId,
        }))}
      />
    </main>
  );
}
