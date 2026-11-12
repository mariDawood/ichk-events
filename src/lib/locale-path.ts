export function localePath(locale: string, path: string) {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  if (locale === "nl") return suffix;
  return `/${locale}${suffix}`;
}
