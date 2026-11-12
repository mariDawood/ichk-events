"use client";

import { formatEuro } from "@/lib/money";
import { BINGO_CENTS, ENTRANCE_CENTS, MAX_PARTY } from "@/lib/pricing";
import { localePath } from "@/lib/locale-path";
import { startSignup, type SignupError } from "@/server/signup";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";

type Row = { name: string; age: string; bingo: boolean };

export function SignupForm({
  eventId,
  account,
  simulated,
  paymentsReady,
}: {
  eventId: string;
  account: { name: string; email: string } | null;
  simulated: boolean;
  paymentsReady: boolean;
}) {
  const t = useTranslations("signup");
  const locale = useLocale();
  const nextPath = `${localePath(locale, "/")}#aanmelden`;
  const [company, setCompany] = useState("");
  const [guests, setGuests] = useState<Row[]>([
    { name: account?.name ?? "", age: "", bingo: false },
  ]);
  const [error, setError] = useState<SignupError | null>(null);
  const [pending, startTransition] = useTransition();

  function setCount(count: number) {
    const next = Math.min(MAX_PARTY, Math.max(1, count));
    setGuests((current) => {
      const copy = current.slice(0, next);
      while (copy.length < next) copy.push({ name: "", age: "", bingo: false });
      return copy;
    });
  }

  let total = 0;
  let agesReady = true;
  for (const guest of guests) {
    if (guest.age.trim() === "") {
      agesReady = false;
      continue;
    }
    const age = Number(guest.age);
    if (!Number.isInteger(age) || age < 0 || age > 120) {
      agesReady = false;
      continue;
    }
    total += ENTRANCE_CENTS + (guest.bingo ? BINGO_CENTS : 0);
  }

  const needsPayment = agesReady && total > 0;
  const registerHref = `${localePath(locale, "/account/register")}?next=${encodeURIComponent(nextPath)}`;
  const loginHref = `${localePath(locale, "/account/login")}?next=${encodeURIComponent(nextPath)}`;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startSignup({
        eventId,
        company,
        locale,
        guests: guests.map((guest) => ({
          name: guest.name,
          age: Number(guest.age),
          bingo: guest.bingo,
        })),
      });
      if (result) setError(result.error);
    });
  }

  return (
    <section id="aanmelden" className="scroll-mt-8 rounded-[2rem] bg-ivory px-6 py-8 shadow-md ring-1 ring-line">
      <h2 className="font-display text-4xl text-chapel">{t("title")}</h2>
      <p className="mt-3 max-w-3xl text-xl leading-relaxed">{t("intro")}</p>
      <p className="mt-3 max-w-3xl text-xl leading-relaxed">{t("cancelNote")}</p>

      {!account ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={registerHref}
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-chapel px-6 text-xl text-ivory"
          >
            {t("createAccount")}
          </a>
          <a
            href={loginHref}
            className="inline-flex min-h-14 items-center justify-center rounded-full px-6 text-xl text-chapel ring-1 ring-chapel"
          >
            {t("login")}
          </a>
        </div>
      ) : (
        <form className="mt-8 flex flex-col gap-6" onSubmit={onSubmit}>
          <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label>
              Company
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>

          <p className="text-xl">
            {t("signedIn", { name: account.name, email: account.email })}{" "}
            <a href={localePath(locale, "/account")} className="text-chapel underline">
              {t("profile")}
            </a>
          </p>

          <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
            {t("party")}
            <select
              value={guests.length}
              onChange={(event) => setCount(Number(event.target.value))}
              className="min-h-12 max-w-40 rounded-2xl bg-stone px-4 text-xl font-normal text-ink ring-1 ring-line"
            >
              {Array.from({ length: MAX_PARTY }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>

          <ul className="flex flex-col gap-4">
            {guests.map((guest, index) => (
              <li key={index} className="rounded-3xl bg-stone px-4 py-4 ring-1 ring-line">
                <p className="font-display text-3xl text-ink">{t("person", { n: index + 1 })}</p>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
                    {t("name")}
                    <input
                      required
                      autoComplete={index === 0 ? "name" : "off"}
                      value={guest.name}
                      onChange={(event) => {
                        const name = event.target.value;
                        setGuests((current) =>
                          current.map((row, rowIndex) => (rowIndex === index ? { ...row, name } : row)),
                        );
                      }}
                      className="min-h-12 w-full rounded-2xl bg-ivory px-4 text-xl font-normal text-ink ring-1 ring-line sm:w-64"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-lg font-semibold text-chapel">
                    {t("age")}
                    <input
                      inputMode="numeric"
                      required
                      min={0}
                      max={120}
                      value={guest.age}
                      onChange={(event) => {
                        const age = event.target.value;
                        setGuests((current) =>
                          current.map((row, rowIndex) => (rowIndex === index ? { ...row, age } : row)),
                        );
                      }}
                      className="min-h-12 w-28 rounded-2xl bg-ivory px-4 text-xl font-normal text-ink ring-1 ring-line"
                    />
                  </label>
                  <label className="flex min-h-12 items-center gap-3 text-xl">
                    <input
                      type="checkbox"
                      checked={guest.bingo}
                      onChange={(event) => {
                        const bingo = event.target.checked;
                        setGuests((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, bingo } : row,
                          ),
                        );
                      }}
                      className="size-6 accent-chapel"
                    />
                    {t("bingo")}
                  </label>
                </div>
              </li>
            ))}
          </ul>
          <p className="font-display text-4xl text-ink">
            {t("total")} {agesReady ? formatEuro(total, locale) : "—"}
          </p>
          <p className="text-lg">{needsPayment ? t("bingoPay") : t("freeEntrance")}</p>

          {needsPayment && simulated ? <p className="text-lg">{t("simulated")}</p> : null}
          {needsPayment && !simulated && !paymentsReady ? (
            <p className="text-lg">{t("paymentsClosed")}</p>
          ) : null}
          {error ? (
            <p className="text-lg text-chapel" role="alert">
              {t(`errors.${error}`)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || (needsPayment && !simulated && !paymentsReady)}
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-chapel px-6 text-xl text-ivory disabled:opacity-60"
          >
            {pending ? t("paying") : needsPayment ? t("pay") : t("confirm")}
          </button>
        </form>
      )}
    </section>
  );
}
