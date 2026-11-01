"use client";

import { routing, type Locale } from "@/i18n/routing";
import { usePathname } from "next/navigation";

export function LanguageNav({
  label,
  names,
}: {
  label: string;
  names: Record<Locale, string>;
}) {
  const pathname = usePathname() || "/";
  const parts = pathname.split("/").filter(Boolean);
  const prefixed = parts[0] === "en" || parts[0] === "ar";
  const current = (prefixed ? parts[0] : routing.defaultLocale) as Locale;
  const rest = prefixed ? parts.slice(1) : parts;
  const suffix = rest.join("/");

  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {routing.locales.map((code) => {
          const href =
            code === routing.defaultLocale
              ? suffix
                ? `/${suffix}`
                : "/"
              : suffix
                ? `/${code}/${suffix}`
                : `/${code}`;
          const active = code === current;
          return (
            <li key={code}>
              <a
                href={href}
                hrefLang={code}
                lang={code}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "inline-flex min-h-12 items-center rounded-full bg-ivory px-4 text-lg text-ink"
                    : "inline-flex min-h-12 items-center rounded-full px-4 text-lg text-ivory ring-1 ring-ivory/50 hover:ring-ivory"
                }
              >
                {names[code]}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
