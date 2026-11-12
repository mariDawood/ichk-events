import { LanguageNav } from "@/components/language-nav";
import type { Locale } from "@/i18n/routing";
import { getCurrentAccount } from "@/lib/accounts";
import { localePath } from "@/lib/locale-path";
import { getLocale, getTranslations } from "next-intl/server";

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
  const locale = await getLocale();
  const account = await getCurrentAccount();
  const accountHref = account
    ? localePath(locale, "/account")
    : localePath(locale, "/account/login");

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
        <div className="flex flex-wrap items-center gap-3">
          <LanguageNav label={t("language")} names={languageNames} />
          <a
            href={accountHref}
            className="inline-flex min-h-12 items-center rounded-full bg-ivory px-4 text-lg text-ink"
          >
            {account ? t("account") : t("login")}
          </a>
        </div>
      </div>
      <div className="h-px bg-gold" />
    </header>
  );
}
