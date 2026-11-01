"use client";

import { BingoBall } from "@/components/bingo-ball";
import { useBingoNumbers } from "@/components/use-bingo-numbers";
import { useTranslations } from "next-intl";

export function BingoLive({
  eventId,
  duringEvent,
}: {
  eventId: string;
  duringEvent: boolean;
}) {
  const t = useTranslations("bingoLive");
  const numbers = useBingoNumbers(eventId);
  const latest = numbers.length > 0 ? numbers[numbers.length - 1] : null;

  if (!duringEvent && numbers.length === 0) return null;

  return (
    <section className="rounded-[2rem] bg-chapel px-6 py-8 text-ivory shadow-lg">
      <h2 className="text-center font-display text-4xl">{t("title")}</h2>
      <div className="mt-6 flex justify-center">
        <BingoBall number={latest} label={t("latest")} />
      </div>
      {latest == null ? (
        <p className="mt-4 text-center text-xl">{t("empty")}</p>
      ) : (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">{t("all")}</h3>
          <ol className="mt-3 flex flex-wrap gap-2">
            {numbers.map((number) => (
              <li
                key={number}
                className={`grid h-12 w-12 place-items-center rounded-full font-display text-2xl ${
                  number === latest ? "bg-gold text-ivory" : "bg-ivory text-chapel"
                }`}
              >
                {number}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
