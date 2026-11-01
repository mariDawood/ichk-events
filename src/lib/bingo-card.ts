import { randomInt } from "node:crypto";

function sample(min: number, max: number, count: number) {
  const pool = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1);
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }

  return pool.slice(0, count).sort((a, b) => a - b);
}

/** A 5 by 5 card. Columns use the usual 1–75 ranges. The centre is free. */
export function createBingoCard(): (number | null)[][] {
  const columns = [
    sample(1, 15, 5),
    sample(16, 30, 5),
    sample(31, 45, 5),
    sample(46, 60, 5),
    sample(61, 75, 5),
  ];

  return Array.from({ length: 5 }, (_, row) =>
    columns.map((column, columnIndex) =>
      columnIndex === 2 && row === 2 ? null : column[row],
    ),
  );
}
