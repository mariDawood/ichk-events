import { LanguageNav } from "@/components/language-nav";
import type { Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

const languageNames: Record<Locale, string> = {
  nl: "Nederlands",
  en: "English",
  ar: "العربية",
};

function Cross() {
  return (
    <svg
      viewBox="0 0 48 72"
      className="mt-1 h-14 w-9 shrink-0 text-gold"
      aria-hidden="true"
    >
      <path
        d="M24 4v64M8 20h32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export async function SiteHeader() {
  const t = await getTranslations("header");

  return (
    <header className="relative z-10 bg-chapel text-ivory">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8 sm:py-10">
        <div className="flex items-start gap-4">
          <Cross />
          <div>
            <p className="font-display text-4xl leading-tight sm:text-5xl">
              {t("churchName")}
            </p>
            <p className="mt-1 text-2xl">{t("town")}</p>
            <p className="mt-4 max-w-xl text-xl leading-relaxed">{t("parish")}</p>
          </div>
        </div>
        <LanguageNav label={t("language")} names={languageNames} />
      </div>
      <div className="h-px bg-gold" />
    </header>
  );
}
