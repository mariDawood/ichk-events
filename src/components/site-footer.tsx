import { getTranslations } from "next-intl/server";

export const routeUrl =
  "https://www.google.com/maps/search/?api=1&query=Remigiuskerk+Remigiusplein+Duiven";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const header = await getTranslations("header");

  return (
    <footer className="relative z-10 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-xl leading-relaxed">
        <p className="font-display text-3xl text-chapel">{header("churchName")}</p>
        <p>{t("address")}</p>
        <p>
          <a className="text-chapel underline decoration-gold decoration-2 underline-offset-4" href={routeUrl}>
            {t("route")}
          </a>
        </p>
        <p>
          <a
            className="text-chapel underline decoration-gold decoration-2 underline-offset-4"
            href="https://ichk.nl"
          >
            {t("parish")}
          </a>
        </p>
      </div>
    </footer>
  );
}
