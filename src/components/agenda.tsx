import { BingoLive } from "@/components/bingo-live";
import { SignupForm } from "@/components/signup-form";
import type { ChurchEvent } from "@/content/events";
import type { Locale } from "@/i18n/routing";
import { getVisibleEvents, isDuringEvent } from "@/lib/events";
import { routeUrl } from "@/components/site-footer";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { connection } from "next/server";

const illustrations = {
  candles: "/illustrations/candles.jpg",
  table: "/illustrations/table.jpg",
  play: "/illustrations/play.jpg",
  music: "/illustrations/music.jpg",
  welcome: "/illustrations/welcome.jpg",
} as const;

export async function Agenda({ locale }: { locale: Locale }) {
  await connection();
  const visible = getVisibleEvents(new Date());

  if (visible.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-16">
      {visible.map((event) => (
        <EventArticle key={event.id} event={event} locale={locale} />
      ))}
    </div>
  );
}

async function EmptyState() {
  const t = await getTranslations("empty");
  const event = await getTranslations("event");

  return (
    <div className="grid items-center gap-8 sm:grid-cols-2">
      <Image
        src="/illustrations/hero.jpg"
        alt={event("heroAlt")}
        width={1600}
        height={1000}
        priority
        sizes="(min-width: 640px) 50vw, 100vw"
        className="aspect-[16/10] h-auto w-full rounded-3xl object-cover shadow-lg"
      />
      <div>
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-6 text-xl leading-relaxed">{t("body")}</p>
      </div>
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
  const footer = await getTranslations("footer");

  const duringEvent = isDuringEvent(event, new Date());

  return (
    <article id={event.id} className="flex flex-col gap-8">
      <BingoLive eventId={event.id} duringEvent={duringEvent} />
      <div className="relative">
        <Image
          src="/illustrations/candles.jpg"
          alt=""
          width={224}
          height={224}
          sizes="112px"
          className="float-card absolute -top-5 start-6 z-20 hidden aspect-square w-28 rounded-2xl object-cover shadow-lg ring-4 ring-ivory sm:block"
        />
        <Image
          src="/illustrations/play.jpg"
          alt=""
          width={256}
          height={256}
          sizes="128px"
          className="float-card-late absolute top-8 end-6 z-20 hidden aspect-square w-32 rounded-2xl object-cover shadow-lg ring-4 ring-ivory lg:block"
        />
        <div className="rise overflow-hidden rounded-[2rem] shadow-lg">
          <div className="relative">
            <Image
              src="/illustrations/hero.jpg"
              alt={t("heroAlt")}
              width={1000}
              height={1000}
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="aspect-[4/3] h-auto w-full object-cover object-[center_42%] sm:aspect-[16/10]"
            />
            <div className="absolute inset-0 hidden bg-gradient-to-t from-chapel via-chapel/70 to-transparent sm:block" />
            <div className="bg-chapel p-6 text-ivory sm:absolute sm:inset-x-0 sm:bottom-0 sm:bg-transparent sm:p-10">
              <h1 className="max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
                {event.title[locale]}
              </h1>
              <p className="mt-4 max-w-2xl text-xl leading-relaxed">
                {event.summary[locale]}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid gap-4 lg:-mt-6 lg:grid-cols-3">
        <section className="rise rounded-3xl bg-ivory px-6 py-6 shadow-md ring-1 ring-line">
          <h2 className="text-lg font-semibold text-chapel">{t("when")}</h2>
          <p className="mt-2 font-display text-3xl leading-tight text-ink">
            {event.date[locale]}
          </p>
          <p className="mt-2 text-2xl">{event.time[locale]}</p>
        </section>

        <section className="rise rise-2 rounded-3xl bg-ivory px-6 py-6 shadow-md ring-1 ring-line">
          <h2 className="text-lg font-semibold text-chapel">{t("where")}</h2>
          <p className="mt-2 whitespace-pre-line font-display text-3xl leading-tight text-ink">
            {event.place[locale]}
          </p>
          <a
            href={routeUrl}
            className="mt-4 inline-flex min-h-12 items-center text-xl text-chapel underline decoration-gold decoration-2 underline-offset-4"
          >
            {footer("route")}
          </a>
        </section>

        <section className="rise rise-3 rounded-3xl bg-chapel px-6 py-6 text-ivory shadow-md">
          <h2 className="text-lg font-semibold">{t("entrance")}</h2>
          <ul className="mt-3 flex flex-col gap-3">
            {event.prices.map((price) => (
              <li key={price.who.nl} className="flex items-baseline gap-3">
                <span className="font-display text-5xl leading-none">
                  {price.amount[locale]}
                </span>
                <span className="text-xl leading-snug">{price.who[locale]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-lg leading-relaxed text-ivory/95">
            {event.included[locale]}
          </p>
          <a
            href="#aanmelden"
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-ivory px-5 text-xl text-chapel"
          >
            {t("signup")}
          </a>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <p className="rounded-2xl bg-ivory/80 px-5 py-4 text-lg leading-relaxed ring-1 ring-line">
          {event.extra[locale]}
        </p>
        <p className="rounded-2xl bg-ivory px-5 py-4 text-xl font-semibold leading-relaxed text-chapel ring-2 ring-gold">
          {event.bingo[locale]}
        </p>
      </div>

      <SignupForm
        eventId={event.id}
        simulated={
          process.env.NODE_ENV === "development" &&
          !process.env.STRIPE_SECRET_KEY &&
          process.env.PAYMENTS_DEMO !== "1"
        }
        paymentsReady={Boolean(process.env.STRIPE_SECRET_KEY) || process.env.PAYMENTS_DEMO === "1"}
      />

      <section>
        <h2 className="font-display text-4xl text-chapel">{t("activities")}</h2>
        <ul className="mt-6 grid gap-5 sm:grid-cols-2">
          {event.activities.map((activity, index) => (
            <li
              key={activity.image}
              className={`rise overflow-hidden rounded-[1.75rem] bg-ivory shadow-md ring-1 ring-line ${
                activity.image === "welcome" ? "sm:col-span-2" : ""
              } ${index === 1 ? "rise-2" : ""} ${index === 2 ? "rise-3" : ""}`}
            >
              <div
                className={
                  activity.image === "welcome"
                    ? "grid sm:grid-cols-2"
                    : "flex flex-col"
                }
              >
                <Image
                  src={illustrations[activity.image]}
                  alt=""
                  width={900}
                  height={700}
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className={
                    activity.image === "welcome"
                      ? "aspect-[4/3] h-full w-full object-cover sm:aspect-auto sm:min-h-72"
                      : "aspect-[4/3] h-auto w-full object-cover"
                  }
                />
                <div className="flex flex-col justify-center px-6 py-6">
                  <h3 className="font-display text-3xl leading-tight text-ink">
                    {activity.title[locale]}
                  </h3>
                  <p className="mt-3 text-xl leading-relaxed">
                    {activity.text[locale]}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
