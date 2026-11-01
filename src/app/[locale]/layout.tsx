import { Background } from "@/components/background";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Cormorant_Garamond, Noto_Naskh_Arabic, Source_Sans_3 } from "next/font/google";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import "../globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source",
  display: "swap",
});

const arabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-naskh",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${display.variable} ${sans.variable} ${arabic.variable} h-full`}
    >
      <body className="flex min-h-dvh flex-col bg-stone text-ink">
        <Background />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:bg-ivory focus:px-4 focus:py-3 focus:text-lg focus:text-ink"
        >
          {t("skip")}
        </a>
        <SiteHeader />
        <main
          id="main"
          className="relative z-10 mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16"
        >
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
