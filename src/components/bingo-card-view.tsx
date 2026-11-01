"use client";

export function BingoCardView({
  card,
  numbers,
  freeLabel,
}: {
  card: (number | null)[][];
  numbers: number[];
  freeLabel: string;
}) {
  const called = new Set(numbers);
  const latest = numbers.length > 0 ? numbers[numbers.length - 1] : null;

  return (
    <div className="grid grid-cols-5 gap-2">
      {card.map((row, rowIndex) =>
        row.map((value, columnIndex) => {
          const marked = value != null && called.has(value);
          const current = value != null && value === latest;
          return (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className={`grid aspect-square place-items-center rounded-2xl font-display text-3xl ${
                value == null
                  ? "bg-gold/25 text-chapel"
                  : marked
                    ? "bg-gold/30 text-chapel/70 line-through decoration-chapel decoration-2"
                    : "bg-stone text-ink"
              } ${current ? "ring-4 ring-gold" : ""}`}
            >
              {value == null ? <span className="text-lg font-sans font-semibold">{freeLabel}</span> : value}
            </div>
          );
        }),
      )}
    </div>
  );
}
