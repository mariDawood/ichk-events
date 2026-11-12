"use client";

import { usePathname } from "next/navigation";

const goThere =
  "inline-flex min-h-12 items-center rounded-full bg-ivory px-4 text-lg font-semibold text-ink";
const youAreHere =
  "inline-flex min-h-12 items-center rounded-full px-4 text-lg text-ivory ring-1 ring-ivory";

function normalize(path: string) {
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function HeaderSwitch({
  label,
  eventHref,
  eventLabel,
  accountHref,
  accountLabel,
}: {
  label: string;
  eventHref: string;
  eventLabel: string;
  accountHref: string;
  accountLabel: string;
}) {
  const pathname = normalize(usePathname() || "/");
  const eventPath = normalize(eventHref);
  const accountPath = normalize(accountHref);
  const onEvent = pathname === eventPath;
  const onAccount = pathname === accountPath || pathname.startsWith(`${accountPath}/`);

  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      <a
        href={eventHref}
        aria-current={onEvent ? "page" : undefined}
        className={onEvent ? youAreHere : goThere}
      >
        {eventLabel}
      </a>
      <a
        href={accountHref}
        aria-current={onAccount ? "page" : undefined}
        className={onAccount ? youAreHere : goThere}
      >
        {accountLabel}
      </a>
    </nav>
  );
}
