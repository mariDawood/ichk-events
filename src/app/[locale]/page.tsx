import { Agenda } from "@/components/agenda";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const meta = await getTranslations({ locale, namespace: "meta" });

  return {
    title: meta("title"),
    description: meta("description"),
    alternates: {
      languages: {
        nl: "/",
        en: "/en",
        ar: "/ar",
      },
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return null;
  }

  setRequestLocale(locale);

  return <Agenda locale={locale} />;
}
