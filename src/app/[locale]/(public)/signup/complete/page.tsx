import { PaymentWait } from "@/components/payment-wait";
import { routing } from "@/i18n/routing";
import { completeStripeSession } from "@/lib/checkout";
import { buildOrderEmail, sendOrderEmail } from "@/lib/email";
import { getEvent } from "@/lib/events";
import { formatEuro } from "@/lib/money";
import { fulfillOrder, getOrderByToken, getTicket, type Order, type Ticket } from "@/lib/orders";
import { localePath } from "@/lib/site";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "complete" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function CompletePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string; order?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("complete");

  let paid = false;
  let emailed = false;
  let email = "";
  let totalCents = 0;
  let eventTitle = "";
  let accessToken = "";
  let emailSubject = "";
  let emailHtml = "";
  let tickets: { number: string; age: number; bingo: boolean }[] = [];
  const demo = process.env.PAYMENTS_DEMO === "1";

  async function rememberEmail(order: Order, loaded: Ticket[]) {
    const letter = await buildOrderEmail(order, loaded);
    emailSubject = letter.subject;
    emailHtml = letter.html;
  }

  if (query.session_id) {
    try {
      const result = await completeStripeSession(query.session_id);
      if (!result) notFound();
      if (!result.paid) {
        return (
          <div className="rounded-[2rem] bg-ivory px-6 py-8 shadow-md ring-1 ring-line">
            <h1 className="font-display text-4xl text-chapel">{t("waitingTitle")}</h1>
            <p className="mt-4 text-xl">{t("waiting")}</p>
            <PaymentWait />
          </div>
        );
      }
      paid = true;
      emailed = result.emailed;
      email = result.order.email;
      totalCents = result.order.totalCents;
      accessToken = result.order.accessToken;
      eventTitle = getEvent(result.order.eventId)?.title[locale] ?? "";
      tickets = result.tickets.map((ticket) => ({
        number: ticket.number,
        age: ticket.age,
        bingo: ticket.bingoCard != null,
      }));
      await rememberEmail(result.order, result.tickets);
    } catch (error) {
      if (typeof error === "object" && error && "digest" in error) throw error;
      notFound();
    }
  } else if (
    query.order &&
    (process.env.NODE_ENV === "development" || process.env.PAYMENTS_DEMO === "1")
  ) {
    const order = await getOrderByToken(query.order);
    if (!order || order.status !== "paid") notFound();
    const paidOrder = await fulfillOrder(order.id);
    if (!paidOrder) notFound();
    const loaded = [];
    for (const number of paidOrder.ticketNumbers) {
      const ticket = await getTicket(number);
      if (ticket) loaded.push(ticket);
    }
    emailed = await sendOrderEmail(paidOrder, loaded);
    paid = true;
    email = paidOrder.email;
    totalCents = paidOrder.totalCents;
    accessToken = paidOrder.accessToken;
    eventTitle = getEvent(paidOrder.eventId)?.title[locale] ?? "";
    tickets = loaded.map((ticket) => ({
      number: ticket.number,
      age: ticket.age,
      bingo: ticket.bingoCard != null,
    }));
    await rememberEmail(paidOrder, loaded);
  } else {
    notFound();
  }

  if (!paid) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[2rem] bg-ivory px-6 py-8 shadow-md ring-1 ring-line">
        <h1 className="font-display text-5xl text-chapel">{t("title")}</h1>
        <p className="mt-4 text-xl leading-relaxed">{eventTitle}</p>
        <p className="mt-4 text-xl">{t("body", { email })}</p>
        <p className="mt-2 text-xl">
          {t("paid")} {formatEuro(totalCents, locale)}
        </p>
        {!emailed && !demo ? <p className="mt-4 text-xl">{t("emailPending")}</p> : null}
      </div>
      {emailHtml ? (
        <section className="overflow-hidden rounded-[2rem] bg-ivory shadow-md ring-1 ring-line">
          <div className="border-b border-line px-6 py-5">
            <h2 className="font-display text-4xl text-chapel">{t("emailHeading")}</h2>
            <p className="mt-3 text-xl">{t("emailTo", { email })}</p>
            <p className="mt-1 text-xl">{t("emailSubject", { subject: emailSubject })}</p>
          </div>
          <div dangerouslySetInnerHTML={{ __html: emailHtml }} />
        </section>
      ) : null}
      <ul className="flex flex-col gap-3">
        {tickets.map((ticket) => (
          <li key={ticket.number} className="rounded-3xl bg-ivory px-5 py-4 text-xl shadow-md ring-1 ring-line">
            <p className="font-display text-4xl">{ticket.number}</p>
            <p className="mt-1">
              {t("age", { age: ticket.age })} · {ticket.bingo ? t("bingoYes") : t("bingoNo")}
            </p>
          </li>
        ))}
      </ul>
      <a
        href={localePath(locale, `/ticket/${accessToken}`)}
        className="inline-flex min-h-14 items-center justify-center rounded-full bg-chapel px-6 text-xl text-ivory"
      >
        {t("open")}
      </a>
    </div>
  );
}
