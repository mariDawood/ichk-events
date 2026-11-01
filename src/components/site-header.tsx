import { routing, type Locale } from "@/i18n/routing";
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
  const locale = (await getLocale()) as Locale;

  return (
    <header className="relative z-10 bg-chapel text-ivory">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-8 sm:py-10">
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
        <nav aria-label={t("language")}>
          <ul className="flex flex-wrap gap-2">
            {routing.locales.map((code) => {
              const current = code === locale;
              return (
                <li key={code}>
                  <a
                    href={code === routing.defaultLocale ? "/" : `/${code}`}
                    hrefLang={code}
                    lang={code}
                    aria-current={current ? "page" : undefined}
                    className={
                      current
                        ? "inline-flex min-h-12 items-center rounded-full bg-ivory px-4 text-lg text-ink"
                        : "inline-flex min-h-12 items-center rounded-full px-4 text-lg text-ivory ring-1 ring-ivory/50 hover:ring-ivory"
                    }
                  >
                    {languageNames[code]}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="h-px bg-gold" />
    </header>
  );
}
