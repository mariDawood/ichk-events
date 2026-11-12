"use client";

import {
  adminCancelAction,
  callNumberAction,
  createDoorAction,
  drawWinnersAction,
  logoutAction,
  resendEmailAction,
  resetBingoAction,
  scanTicketAction,
  sendMessageAction,
} from "@/server/admin";
import { BingoBall } from "@/components/bingo-ball";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Person = {
  number: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  bingo: boolean;
  source: "signup" | "door";
  status: "in" | "expected" | "cancelled" | "door";
  prizeWinner: boolean;
  bingoWinner: boolean;
  orderId: string;
};

type ScanHit = {
  number: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  bingo: boolean;
  source: "signup" | "door";
  prizeWinner: boolean;
  bingoWinner: boolean;
  result: "in" | "already" | "cancelled";
};

const statusLabel = {
  in: "Aangemeld en binnen",
  expected: "Aangemeld, niet binnen, niet afgemeld",
  cancelled: "Afgemeld",
  door: "Aan de deur binnengekomen",
} as const;

export function AdminPanel({
  eventId,
  eventTitle,
  numbers,
  people,
}: {
  eventId: string;
  eventTitle: string;
  numbers: number[];
  people: Person[];
}) {
  const router = useRouter();
  const scanRef = useRef<HTMLInputElement>(null);
  const [called, setCalled] = useState<number[]>(numbers);
  const [latest, setLatest] = useState<number | null>(
    numbers.length > 0 ? numbers[numbers.length - 1] : null,
  );
  const [scan, setScan] = useState("");
  const [found, setFound] = useState<ScanHit | null | undefined>(undefined);
  const [mailNote, setMailNote] = useState<Record<string, string>>({});
  const [doorName, setDoorName] = useState("");
  const [doorAge, setDoorAge] = useState("");
  const [doorBingo, setDoorBingo] = useState(false);
  const [doorCode, setDoorCode] = useState<string | null>(null);
  const [doorError, setDoorError] = useState(false);
  const [message, setMessage] = useState("");
  const [messageNote, setMessageNote] = useState("");
  const [pending, startTransition] = useTransition();

  const counts = {
    in: people.filter((person) => person.status === "in").length,
    expected: people.filter((person) => person.status === "expected").length,
    cancelled: people.filter((person) => person.status === "cancelled").length,
    door: people.filter((person) => person.status === "door").length,
  };
  const winners = people.filter((person) => person.prizeWinner);
  const bingoWinners = people.filter((person) => person.bingoWinner);
  const seenOrders = new Set<string>();

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
      (winners.length > 0 || bingoWinners.length > 0) &&
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
      router.refresh();
    });
  }

  function addDoor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDoorError(false);
    setDoorCode(null);
    startTransition(async () => {
      const result = await createDoorAction({
        eventId,
        name: doorName,
        age: Number(doorAge),
        bingo: doorBingo,
      });
      if (!result.ok) {
        setDoorError(true);
        return;
      }
      setDoorCode(result.number);
      setDoorName("");
      setDoorAge("");
      setDoorBingo(false);
      router.refresh();
    });
  }

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await sendMessageAction(eventId, message);
      if (result === "sent" || result.startsWith("sent:")) {
        const count = result.startsWith("sent:") ? result.slice(5) : "";
        setMessageNote(count ? `Verstuurd naar ${count} adressen.` : "Verstuurd.");
        setMessage("");
      } else if (result === "empty") {
        setMessageNote("Er is niemand meer om te mailen.");
      } else if (result === "unavailable") {
        setMessageNote("E-mail is nog niet gekoppeld.");
      } else {
        setMessageNote("Schrijf eerst een bericht.");
      }
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
            Uitloggen
          </button>
        </form>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["in", counts.in],
            ["expected", counts.expected],
            ["cancelled", counts.cancelled],
            ["door", counts.door],
          ] as const
        ).map(([key, count]) => (
          <p key={key} className="rounded-3xl bg-ivory px-5 py-4 text-xl shadow-md ring-1 ring-line">
            <span className="font-display text-4xl text-chapel">{count}</span>
            <span className="mt-1 block">{statusLabel[key]}</span>
          </p>
        ))}
      </section>

      <section className="rounded-[2rem] bg-ivory px-5 py-6 shadow-md ring-1 ring-line">
        <h2 className="font-display text-3xl">Code scannen</h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={scanTicket}>
          <input
            ref={scanRef}
            autoFocus
            value={scan}
            onChange={(event) => setScan(event.target.value.toUpperCase())}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-label="Code"
            className="min-h-14 flex-1 rounded-2xl bg-stone px-4 font-display text-3xl tracking-wide ring-1 ring-line"
          />
          <button type="submit" className="min-h-14 rounded-full bg-chapel px-5 text-xl text-ivory">
            Zoeken
          </button>
        </form>
        {found === null ? <p className="mt-4 text-xl">Dit nummer hoort niet bij een code.</p> : null}
        {found ? (
          <div
            className={`mt-4 rounded-3xl px-4 py-4 text-xl ${
              found.prizeWinner || found.bingoWinner ? "bg-gold/25 ring-2 ring-gold" : "bg-stone"
            }`}
          >
            <p className="font-display text-4xl">{found.number}</p>
            <p className="mt-2 font-semibold">
              {found.result === "cancelled"
                ? "Afgemeld. Telt niet als aanwezig."
                : found.result === "already"
                  ? found.source === "door"
                    ? "Aan de deur. Al binnen."
                    : "Al binnen."
                  : "Binnen."}
            </p>
            <p className="mt-2">{found.name || "—"}</p>
            <p>{found.email || "Geen e-mail"}</p>
            <p>{found.phone || "Geen telefoon"}</p>
            <p>
              {found.age} jaar{found.bingo ? " · bingokaart" : ""}
            </p>
            {found.prizeWinner ? <p className="mt-2 font-semibold">Winnaar van een van de vijf prijzen.</p> : null}
            {found.bingoWinner ? <p className="mt-2 font-semibold">Winnaar van een van de vijf bingoprijzen.</p> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-[2rem] bg-ivory px-5 py-6 shadow-md ring-1 ring-line">
        <h2 className="font-display text-3xl">Iemand aan de deur</h2>
        <p className="mt-2 text-xl">
          Zonder e-mail en zonder telefoon. De code staat meteen op binnen. Bingo aan de deur is contant, €1.
        </p>
        <form className="mt-4 flex flex-col gap-4" onSubmit={addDoor}>
          <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
            Naam
            <input
              required
              value={doorName}
              onChange={(event) => setDoorName(event.target.value)}
              className="min-h-12 rounded-2xl bg-stone px-4 text-xl font-normal text-ink ring-1 ring-line"
            />
          </label>
          <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
            Leeftijd
            <input
              required
              inputMode="numeric"
              min={0}
              max={120}
              value={doorAge}
              onChange={(event) => setDoorAge(event.target.value)}
              className="min-h-12 w-28 rounded-2xl bg-stone px-4 text-xl font-normal text-ink ring-1 ring-line"
            />
          </label>
          <label className="flex min-h-12 items-center gap-3 text-xl">
            <input
              type="checkbox"
              checked={doorBingo}
              onChange={(event) => setDoorBingo(event.target.checked)}
              className="size-6 accent-chapel"
            />
            Bingokaart
          </label>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-14 w-fit items-center rounded-full bg-chapel px-5 text-xl text-ivory disabled:opacity-60"
          >
            Code maken
          </button>
        </form>
        {doorError ? <p className="mt-4 text-xl">Vul een naam en een leeftijd in.</p> : null}
        {doorCode ? (
          <p className="mt-4 font-display text-5xl tracking-wide text-chapel">{doorCode}</p>
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
        <p className="mt-2 text-xl">Vijf kaartjes voor de prijzen, en vijf bingokaarten. Afgemelde codes doen niet mee.</p>
        <button
          type="button"
          onClick={draw}
          disabled={pending}
          className="mt-4 min-h-14 rounded-full bg-chapel px-5 text-xl text-ivory disabled:opacity-60"
        >
          Winnaars trekken
        </button>
        <div className="mt-5 flex flex-col gap-3 text-xl">
          {winners.map((person, index) => (
            <p key={person.number}>
              Prijs {index + 1}: {person.number} · {person.name || person.email || "—"}
            </p>
          ))}
          {bingoWinners.map((person, index) => (
            <p key={person.number}>
              Bingo {index + 1}: {person.number} · {person.name || person.email || "—"}
            </p>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-3xl text-chapel">Mensen</h2>
        {people.length === 0 ? <p className="text-xl">Nog niemand.</p> : null}
        {people.map((person) => {
          const firstOfOrder = !seenOrders.has(person.orderId);
          if (firstOfOrder) seenOrders.add(person.orderId);
          return (
            <article key={person.number} className="rounded-3xl bg-ivory px-5 py-5 shadow-md ring-1 ring-line">
              <p className="font-display text-4xl tracking-wide">{person.number}</p>
              <p className="mt-2 text-xl font-semibold">{person.name || "—"}</p>
              <p className="mt-1 text-lg">{person.email || "Geen e-mail"}</p>
              <p className="text-lg">{person.phone || "Geen telefoon"}</p>
              <p className="mt-1 text-lg">
                {person.age} jaar · {person.bingo ? "bingo" : "geen bingo"} · {statusLabel[person.status]}
                {person.prizeWinner ? " · prijs" : ""}
                {person.bingoWinner ? " · bingoprijs" : ""}
              </p>
              {person.status === "expected" ? (
                <button
                  type="button"
                  className="mt-3 min-h-12 text-lg text-chapel underline"
                  onClick={() => {
                    if (!window.confirm("Deze persoon afmelden?")) return;
                    startTransition(async () => {
                      await adminCancelAction(person.number);
                      router.refresh();
                    });
                  }}
                >
                  Afmelden
                </button>
              ) : null}
              {firstOfOrder && person.source === "signup" && person.email ? (
                <button
                  type="button"
                  className="mt-3 block min-h-12 text-lg text-chapel underline"
                  onClick={() => {
                    startTransition(async () => {
                      const result = await resendEmailAction(person.orderId);
                      setMailNote((current) => ({
                        ...current,
                        [person.orderId]:
                          result === "sent" ? "De e-mail is verstuurd." : "E-mail is nog niet gekoppeld.",
                      }));
                      router.refresh();
                    });
                  }}
                >
                  E-mail opnieuw sturen
                </button>
              ) : null}
              {mailNote[person.orderId] && firstOfOrder ? (
                <p className="mt-2 text-lg">{mailNote[person.orderId]}</p>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="rounded-[2rem] bg-ivory px-5 py-6 shadow-md ring-1 ring-line">
        <h2 className="font-display text-3xl">Bericht aan wie nog komt</h2>
        <p className="mt-2 text-xl">Alleen naar e-mailadressen die nog niet zijn afgemeld. Deurcodes krijgen geen mail.</p>
        <form className="mt-4 flex flex-col gap-4" onSubmit={sendMessage}>
          <textarea
            required
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={5}
            maxLength={2000}
            className="rounded-2xl bg-stone px-4 py-3 text-xl text-ink ring-1 ring-line"
          />
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-14 w-fit items-center rounded-full bg-chapel px-5 text-xl text-ivory disabled:opacity-60"
          >
            Verstuur
          </button>
        </form>
        {messageNote ? <p className="mt-4 text-xl">{messageNote}</p> : null}
      </section>
    </div>
  );
}
