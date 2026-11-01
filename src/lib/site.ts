import "server-only";
import { headers } from "next/headers";

export function localePath(locale: string, path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (locale === "nl") return suffix;
  return `/${locale}${suffix}`;
}

export async function requestOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
