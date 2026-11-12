import { ResetForm } from "@/components/account-forms";
import { localePath } from "@/lib/locale-path";
import { routing } from "@/i18n/routing";
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
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("resetTitle"), robots: { index: false, follow: false } };
}

export default async function ResetPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const query = await searchParams;
  const token = query.token ?? "";
  const t = await getTranslations("account");

  return (
    <div className="mx-auto w-full max-w-lg rounded-[2rem] bg-ivory px-6 py-8 shadow-md ring-1 ring-line">
      <h1 className="font-display text-5xl text-chapel">{t("resetTitle")}</h1>
      {token.length < 20 ? (
        <p className="mt-4 text-xl leading-relaxed">
          {t("errors.invalid")}{" "}
          <a href={localePath(locale, "/account/forgot")} className="text-chapel underline">
            {t("forgot")}
          </a>
        </p>
      ) : (
        <ResetForm token={token} />
      )}
    </div>
  );
}
