"use client";

export function BingoBall({
  number,
  label,
}: {
  number: number | null;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="sr-only" aria-live="polite">
        {number == null ? label : `${label} ${number}`}
      </p>
      <div key={number ?? "waiting"} className="bingo-ball ball-pop" aria-hidden="true">
        <span>{number ?? "·"}</span>
      </div>
    </div>
  );
}
