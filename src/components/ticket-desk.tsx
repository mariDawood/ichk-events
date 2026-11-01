"use client";

import { BingoBall } from "@/components/bingo-ball";
import { BingoCardView } from "@/components/bingo-card-view";
import { useBingoNumbers } from "@/components/use-bingo-numbers";
import { lookupTicket } from "@/server/tickets";
import { useState } from "react";
import { useTranslations } from "next-intl";

type FoundTicket = {
  number: string;
  age: number;
  barcode: string;
  bingoCard: (number | null)[][] | null;
  prizeWinner: boolean;
  bingoWinner: boolean;
};

export function TicketDesk({ token, eventId }: { token: string; eventId: string }) {
  const t = useTranslations("ticket");
  const [number, setNumber] = useState("");
  const [ticket, setTicket] = useState<FoundTicket | null>(null);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const numbers = useBingoNumbers(ticket?.bingoCard ? eventId : "");
  const latest = numbers.length > 0 ? numbers[numbers.length - 1] : null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);
    const result = await lookupTicket(token, number);
    setPending(false);
    if (!result.ok) {
      setTicket(null);
      setError(true);
      return;
    }
    setTicket(result.ticket);
  }

  return (
    <div className="flex flex-col gap-8">
      {ticket?.bingoCard ? (
        <section className="rounded-[2rem] bg-chapel px-5 py-5 text-ivory shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg">{t("calledTitle")}</p>
              <div className="mt-3">
                <BingoBall number={latest} label={t("calledTitle")} />
              </div>
            </div>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
              className="inline-flex min-h-12 items-center rounded-full bg-ivory px-4 text-lg text-chapel"
            >
              {t("calledButton")}
              {numbers.length > 0 ? ` (${numbers.length})` : ""}
            </button>
          </div>
          {latest == null ? <p className="mt-4 text-xl">{t("calledEmpty")}</p> : null}
          {open ? (
            <ol className="mt-4 flex flex-wrap gap-2">
              {numbers.map((called) => (
                <li
                  key={called}
                  className={`grid h-12 w-12 place-items-center rounded-full font-display text-2xl ${
                    called === latest ? "bg-gold text-ivory" : "bg-ivory text-chapel"
                  }`}
                >
                  {called}
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      <form className="rounded-[2rem] bg-ivory px-6 py-6 shadow-md ring-1 ring-line" onSubmit={onSubmit}>
        <h1 className="font-display text-4xl text-chapel">{t("title")}</h1>
        <p className="mt-3 text-xl leading-relaxed">{t("intro")}</p>
        <label className="mt-6 flex flex-col gap-2 text-lg font-semibold text-chapel">
          {t("number")}
          <input
            value={number}
            onChange={(event) => setNumber(event.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            required
            className="min-h-12 rounded-2xl bg-stone px-4 font-display text-3xl tracking-wide text-ink ring-1 ring-line"
          />
        </label>
        {error ? (
          <p className="mt-4 text-lg text-chapel" role="alert">
            {t("invalid")}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex min-h-14 items-center rounded-full bg-chapel px-6 text-xl text-ivory disabled:opacity-60"
        >
          {t("show")}
        </button>
      </form>

      {ticket ? (
        <section className="flex flex-col gap-6">
          {ticket.prizeWinner ? (
            <p className="rounded-3xl bg-gold/20 px-5 py-4 text-xl text-chapel ring-2 ring-gold">
              {t("prize")}
            </p>
          ) : null}
          {ticket.bingoWinner ? (
            <p className="rounded-3xl bg-gold/20 px-5 py-4 text-xl text-chapel ring-2 ring-gold">
              {t("bingoPrize")}
            </p>
          ) : null}
          <div className="rounded-[2rem] bg-white px-4 py-5 text-ink shadow-md">
            <h2 className="font-display text-3xl">{t("barcode")}</h2>
            <p className="mt-2 text-xl">{t("barcodeHint")}</p>
            <div
              className="barcode-svg mt-4"
              role="img"
              aria-label={`${t("barcode")} ${ticket.number}`}
              dangerouslySetInnerHTML={{ __html: ticket.barcode }}
            />
            <p className="mt-3 text-center font-display text-4xl tracking-wide">{ticket.number}</p>
            <p className="mt-2 text-center text-xl">{t("age", { age: ticket.age })}</p>
          </div>
          {ticket.bingoCard ? (
            <div className="rounded-[2rem] bg-ivory px-5 py-6 shadow-md ring-1 ring-line">
              <h2 className="font-display text-4xl text-chapel">{t("card")}</h2>
              <div className="mt-5">
                <BingoCardView card={ticket.bingoCard} numbers={numbers} freeLabel={t("free")} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
