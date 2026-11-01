export function formatEuro(cents: number, locale: string) {
  const euros = cents / 100;
  if (Number.isInteger(euros)) return `€${euros}`;
  const [whole, fraction] = euros.toFixed(2).split(".");
  return locale === "en" ? `€${whole}.${fraction}` : `€${whole},${fraction}`;
}
