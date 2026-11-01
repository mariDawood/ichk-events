import type { ChurchEvent } from "@/content/events";
import type { Locale } from "@/i18n/routing";
import { getVisibleEvents } from "@/lib/events";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";

export async function Agenda({ locale }: { locale: Locale }) {
  await connection();
  const visible = getVisibleEvents(new Date());

  if (visible.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-20">
      {visible.map((event) => (
        <EventArticle key={event.id} event={event} locale={locale} />
      ))}
    </div>
  );
}

async function EmptyState() {
  const t = await getTranslations("empty");

  return (
    <div className="py-6">
      <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-6 max-w-xl text-xl leading-relaxed">{t("body")}</p>
    </div>
  );
}

async function EventArticle({
  event,
  locale,
}: {
  event: ChurchEvent;
  locale: Locale;
}) {
  const t = await getTranslations("event");

  return (
    <article id={event.id} className="flex flex-col gap-10">
      <header>
        <p className="text-xl text-chapel">{event.kind[locale]}</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
          {event.title[locale]}
        </h1>
        <p className="mt-6 text-xl leading-relaxed">{event.summary[locale]}</p>
      </header>

      <section>
        <h2 className="font-display text-3xl text-chapel">{t("when")}</h2>
        <p className="mt-3 text-2xl">{event.date[locale]}</p>
        <p className="mt-1 text-xl">{event.time[locale]}</p>
      </section>

      <section>
        <h2 className="font-display text-3xl text-chapel">{t("where")}</h2>
        <p className="mt-3 text-2xl">{event.place[locale]}</p>
      </section>

      <section>
        <h2 className="font-display text-3xl text-chapel">{t("why")}</h2>
        <p className="mt-3 text-xl leading-relaxed">{event.goal[locale]}</p>
      </section>

      <section className="rounded-3xl bg-ivory px-6 py-7 ring-1 ring-line sm:px-8">
        <h2 className="font-display text-3xl text-chapel">{t("entrance")}</h2>
        <ul className="mt-4 flex flex-col gap-2 text-2xl">
          {event.prices.map((price) => (
            <li key={price.nl}>{price[locale]}</li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col gap-4 text-xl leading-relaxed">
          <p>{event.included[locale]}</p>
          <p>{event.extra[locale]}</p>
          <p>{event.ticket[locale]}</p>
          <p className="border-t border-line pt-4">{event.bingo[locale]}</p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-3xl text-chapel">{t("activities")}</h2>
        <ul className="mt-5 flex flex-col gap-4">
          {event.activities.map((activity) => (
            <li key={activity.nl} className="flex gap-3 text-xl leading-relaxed">
              <span
                className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                aria-hidden="true"
              />
              <span>{activity[locale]}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
