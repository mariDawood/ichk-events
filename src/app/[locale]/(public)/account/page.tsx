import { CancelRegistration } from "@/components/cancel-registration";
import { ProfileForm } from "@/components/profile-form";
import { getCurrentAccount } from "@/lib/accounts";
import { getEvent } from "@/lib/events";
import { localePath } from "@/lib/locale-path";
import { listAccountRegistrations } from "@/lib/orders";
import { logoutAccount } from "@/server/account";
import { routing, type Locale } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("profileTitle"), robots: { index: false, follow: false } };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const account = await getCurrentAccount();
  if (!account) {
    redirect(`${localePath(locale, "/account/login")}?next=${encodeURIComponent(localePath(locale, "/account"))}`);
  }

  const t = await getTranslations("account");
  const registrations = await listAccountRegistrations(account.id);
  const now = Date.now();

  const upcoming = [];
  const history = [];
  for (const registration of registrations) {
    const event = getEvent(registration.order.eventId);
    const ended = event ? now >= new Date(event.end).getTime() : true;
    const came = registration.tickets.some((ticket) => ticket.checkedInAt && !ticket.cancelledAt);
    const view = {
      orderId: registration.order.id,
      title: event?.title[locale as Locale] ?? registration.order.eventId,
      when: event?.date[locale as Locale] ?? "",
      start: event ? new Date(event.start).getTime() : 0,
      ended,
      tickets: registration.tickets,
    };
    if (!ended) upcoming.push(view);
    else if (came) history.push(view);
  }

  upcoming.sort((a, b) => a.start - b.start);
  history.sort((a, b) => b.start - a.start);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-5xl text-chapel">{t("profileTitle")}</h1>
        <form action={logoutAccount}>
          <button type="submit" className="min-h-12 text-lg text-chapel underline">
            {t("logout")}
          </button>
        </form>
      </div>

      <section className="rounded-[2rem] bg-ivory px-6 py-8 shadow-md ring-1 ring-line">
        <h2 className="font-display text-4xl text-chapel">{t("details")}</h2>
        <ProfileForm name={account.name} email={account.email} phone={account.phone} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-4xl text-chapel">{t("upcoming")}</h2>
        <p className="text-xl leading-relaxed">{t("refund")}</p>
        {upcoming.length === 0 ? <p className="text-xl">{t("upcomingEmpty")}</p> : null}
        {upcoming.map((registration) => {
          const openTickets = registration.tickets.filter(
            (ticket) => !ticket.cancelledAt && !ticket.checkedInAt,
          );
          return (
            <article
              key={registration.orderId}
              className="rounded-[2rem] bg-ivory px-6 py-6 shadow-md ring-1 ring-line"
            >
              <h3 className="font-display text-3xl text-ink">{registration.title}</h3>
              <p className="mt-1 text-xl">{registration.when}</p>
              <ul className="mt-4 flex flex-col gap-4">
                {registration.tickets.map((ticket) => (
                  <li key={ticket.number} className="text-xl">
                    <p className="font-semibold">{ticket.name}</p>
                    <p className="mt-1 font-display text-3xl tracking-wide">{ticket.number}</p>
                    <p className="mt-1">
                      {t("age", { age: ticket.age })} · {ticket.bingoCard ? t("bingoYes") : t("bingoNo")}
                      {ticket.cancelledAt ? ` · ${t("cancelled")}` : ""}
                      {ticket.checkedInAt && !ticket.cancelledAt ? ` · ${t("inside")}` : ""}
                    </p>
                    {!registration.ended && !ticket.cancelledAt && !ticket.checkedInAt ? (
                      <CancelRegistration orderId={registration.orderId} number={ticket.number} />
                    ) : null}
                  </li>
                ))}
              </ul>
              {openTickets.length > 1 ? (
                <div className="mt-4">
                  <CancelRegistration orderId={registration.orderId} number={null} everyone />
                </div>
              ) : null}
            </article>
          );
        })}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-4xl text-chapel">{t("history")}</h2>
        <p className="text-xl leading-relaxed">{t("historyIntro")}</p>
        {history.length === 0 ? <p className="text-xl">{t("historyEmpty")}</p> : null}
        {history.map((registration) => (
          <article
            key={registration.orderId}
            className="rounded-[2rem] bg-ivory px-6 py-6 shadow-md ring-1 ring-line"
          >
            <h3 className="font-display text-3xl text-ink">{registration.title}</h3>
            <p className="mt-1 text-xl">{registration.when}</p>
            <ul className="mt-4 flex flex-col gap-2 text-xl">
              {registration.tickets
                .filter((ticket) => ticket.checkedInAt && !ticket.cancelledAt)
                .map((ticket) => (
                  <li key={ticket.number}>
                    {ticket.name}
                    {ticket.bingoCard ? ` · ${t("bingoYes")}` : ""}
                  </li>
                ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
