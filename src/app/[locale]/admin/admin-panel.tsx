"use client";

import {
  callNumberAction,
  drawWinnersAction,
  logoutAction,
  resendEmailAction,
  resetBingoAction,
  scanTicketAction,
} from "@/server/admin";
import { BingoBall } from "@/components/bingo-ball";
import { formatEuro } from "@/lib/money";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type SharedTicket = {
  number: string;
  email: string;
  age: number;
  eventId: string;
  bingo: boolean;
  prizeWinner: boolean;
  bingoWinner: boolean;
};

type OrderCard = {
  id: string;
  email: string;
  status: "pending" | "paid";
  totalCents: number;
  createdAt: string;
  emailSent: boolean;
  tickets: SharedTicket[];
};

export function AdminPanel({
  eventId,
  eventTitle,
  numbers,
  orders,
}: {
  eventId: string;
  eventTitle: string;
  numbers: number[];
  orders: OrderCard[];
}) {
  const router = useRouter();
  const scanRef = useRef<HTMLInputElement>(null);
  const [called, setCalled] = useState<number[]>(numbers);
  const [latest, setLatest] = useState<number | null>(
    numbers.length > 0 ? numbers[numbers.length - 1] : null,
  );
  const [scan, setScan] = useState("");
  const [found, setFound] = useState<SharedTicket | null | undefined>(undefined);
  const [mailNote, setMailNote] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const winners = orders.flatMap((order) => order.tickets).filter((ticket) => ticket.prizeWinner);
  const bingoWinner = orders
    .flatMap((order) => order.tickets)
    .find((ticket) => ticket.bingoWinner);

  function callNumber() {
    startTransition(async () => {
      const result = await callNumberAction(eventId);
      setCalled(result.numbers);
      setLatest(result.called ?? (result.numbers.at(-1) ?? null));
      router.refresh();
    });
  }

  function resetNumbers() {
    if (!window.confirm("Alle omgeroepen nummers worden gewist.")) return;
    startTransition(async () => {
      await resetBingoAction(eventId);
      setCalled([]);
      setLatest(null);
      router.refresh();
    });
  }

  function draw() {
    if (
      (winners.length > 0 || bingoWinner) &&
      !window.confirm("Dit vervangt de vorige trekking.")
    ) {
      return;
    }
    startTransition(async () => {
      await drawWinnersAction(eventId);
      router.refresh();
    });
  }

  function scanTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = scan;
    startTransition(async () => {
      setFound(await scanTicketAction(value));
      setScan("");
      scanRef.current?.focus();
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl text-chapel">Beheer</h1>
          <p className="mt-2 text-xl">{eventTitle}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="min-h-12 rounded-full px-4 text-lg text-chapel underline">
            Afmelden
          </button>
        </form>
      </div>

      <section className="rounded-[2rem] bg-ivory px-5 py-6 shadow-md ring-1 ring-line">
        <h2 className="font-display text-3xl">Kaartje scannen</h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={scanTicket}>
          <input
            ref={scanRef}
            autoFocus
            value={scan}
            onChange={(event) => setScan(event.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Kaartnummer"
            className="min-h-14 flex-1 rounded-2xl bg-stone px-4 font-display text-3xl tracking-wide ring-1 ring-line"
          />
          <button type="submit" className="min-h-14 rounded-full bg-chapel px-5 text-xl text-ivory">
            Zoeken
          </button>
        </form>
        {found === null ? <p className="mt-4 text-xl">Dit nummer hoort niet bij een kaartje.</p> : null}
        {found ? (
          <div
            className={`mt-4 rounded-3xl px-4 py-4 text-xl ${
              found.prizeWinner || found.bingoWinner ? "bg-gold/25 ring-2 ring-gold" : "bg-stone"
            }`}
          >
            <p className="font-display text-4xl">{found.number}</p>
            <p className="mt-2">{found.email}</p>
            <p>{found.age} jaar{found.bingo ? " · bingokaart" : ""}</p>
            {found.prizeWinner ? <p className="mt-2 font-semibold">Winnaar van een van de vijf prijzen.</p> : null}
            {found.bingoWinner ? <p className="mt-2 font-semibold">Winnaar van de grote bingoprijs.</p> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] bg-chapel px-5 py-6 text-ivory shadow-md">
        <h2 className="font-display text-3xl">Bingo</h2>
        <div className="mt-4 flex justify-center">
          <BingoBall number={latest} label="Laatste nummer" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={callNumber}
            disabled={pending || called.length >= 75}
            className="min-h-14 rounded-full bg-ivory px-5 text-xl text-chapel disabled:opacity-60"
          >
            {called.length >= 75 ? "Alle nummers zijn geweest" : "Nieuw nummer"}
          </button>
          <button
            type="button"
            onClick={resetNumbers}
            className="min-h-14 rounded-full px-5 text-xl text-ivory ring-1 ring-ivory/60"
          >
            Nummers wissen
          </button>
        </div>
        <ol className="mt-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 75 }, (_, index) => index + 1).map((number) => {
            const hit = called.includes(number);
            return (
              <li
                key={number}
                className={`grid h-11 place-items-center rounded-full text-lg ${
                  hit ? "bg-gold text-ivory" : "bg-ivory/10 text-ivory"
                }`}
              >
                {number}
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-[2rem] bg-ivory px-5 py-6 shadow-md ring-1 ring-line">
        <h2 className="font-display text-3xl">Prijzen</h2>
        <p className="mt-2 text-xl">Vijf kaartjes voor de prijzen, en één bingokaart voor de grote prijs.</p>
        <button
          type="button"
          onClick={draw}
          disabled={pending}
          className="mt-4 min-h-14 rounded-full bg-chapel px-5 text-xl text-ivory disabled:opacity-60"
        >
          Winnaars trekken
        </button>
        <div className="mt-5 flex flex-col gap-3 text-xl">
          {winners.map((ticket, index) => (
            <p key={ticket.number}>
              Prijs {index + 1}: {ticket.number} · {ticket.email}
            </p>
          ))}
          {bingoWinner ? (
            <p>
              Bingo: {bingoWinner.number} · {bingoWinner.email}
            </p>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-3xl text-chapel">Aanmeldingen</h2>
        {orders.length === 0 ? <p className="text-xl">Nog niemand aangemeld.</p> : null}
        {orders.map((order) => (
          <article key={order.id} className="rounded-3xl bg-ivory px-5 py-5 shadow-md ring-1 ring-line">
            <p className="text-xl font-semibold">{order.email}</p>
            <p className="mt-1 text-lg">
              {order.status === "paid" ? "Betaald" : "Wacht op betaling"} · {formatEuro(order.totalCents, "nl")}
              {order.emailSent ? " · e-mail verstuurd" : ""}
            </p>
            <ul className="mt-3 flex flex-col gap-1 text-xl">
              {order.tickets.map((ticket) => (
                <li key={ticket.number}>
                  {ticket.number} · {ticket.age} jaar
                  {ticket.bingo ? " · bingo" : ""}
                  {ticket.prizeWinner ? " · prijs" : ""}
                  {ticket.bingoWinner ? " · bingoprijs" : ""}
                </li>
              ))}
            </ul>
            {order.status === "paid" ? (
              <button
                type="button"
                className="mt-4 min-h-12 text-lg text-chapel underline"
                onClick={() => {
                  startTransition(async () => {
                    const result = await resendEmailAction(order.id);
                    setMailNote((current) => ({
                      ...current,
                      [order.id]:
                        result === "sent"
                          ? "De e-mail is verstuurd."
                          : "E-mail is nog niet gekoppeld.",
                    }));
                    router.refresh();
                  });
                }}
              >
                E-mail opnieuw sturen
              </button>
            ) : null}
            {mailNote[order.id] ? <p className="mt-2 text-lg">{mailNote[order.id]}</p> : null}
          </article>
        ))}
      </section>
    </div>
  );
}
