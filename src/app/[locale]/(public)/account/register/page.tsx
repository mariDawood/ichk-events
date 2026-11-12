import { RegisterForm } from "@/components/account-forms";
import { getCurrentAccount } from "@/lib/accounts";
import { localePath } from "@/lib/locale-path";
import { safeNextPath } from "@/lib/next-path";
import { routing } from "@/i18n/routing";
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
  return { title: t("registerTitle"), robots: { index: false, follow: false } };
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const account = await getCurrentAccount();
  const query = await searchParams;
  const nextPath = safeNextPath(query.next, localePath(locale, "/account"));
  if (account) redirect(nextPath);

  const t = await getTranslations("account");

  return (
    <div className="mx-auto w-full max-w-lg rounded-[2rem] bg-ivory px-6 py-8 shadow-md ring-1 ring-line">
      <h1 className="font-display text-5xl text-chapel">{t("registerTitle")}</h1>
      <p className="mt-4 text-xl leading-relaxed">{t("registerIntro")}</p>
      <RegisterForm nextPath={nextPath} />
    </div>
  );
}
