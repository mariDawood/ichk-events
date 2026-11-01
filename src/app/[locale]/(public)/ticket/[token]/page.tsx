import { TicketDesk } from "@/components/ticket-desk";
import { routing } from "@/i18n/routing";
import { getOrderByToken } from "@/lib/orders";
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
  const t = await getTranslations({ locale, namespace: "ticket" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function TicketPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const order = await getOrderByToken(token);
  if (!order) notFound();

  const t = await getTranslations("ticket");

  if (order.status !== "paid") {
    return (
      <div className="rounded-[2rem] bg-ivory px-6 py-8 shadow-md ring-1 ring-line">
        <h1 className="font-display text-4xl text-chapel">{t("title")}</h1>
        <p className="mt-4 text-xl">{t("pending")}</p>
      </div>
    );
  }

  return <TicketDesk token={token} eventId={order.eventId} />;
}
