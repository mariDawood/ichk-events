export const CHILD_MAX_AGE = 12;
export const CHILD_CENTS = 500;
export const ADULT_CENTS = 1000;
export const BINGO_CENTS = 700;
export const MAX_PARTY = 12;

export type Guest = {
  age: number;
  bingo: boolean;
};

export function priceForAge(age: number) {
  return age <= CHILD_MAX_AGE ? CHILD_CENTS : ADULT_CENTS;
}

export function orderTotal(guests: Guest[]) {
  return guests.reduce(
    (sum, guest) => sum + priceForAge(guest.age) + (guest.bingo ? BINGO_CENTS : 0),
    0,
  );
}

export function parseGuests(input: unknown): Guest[] | null {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_PARTY) {
    return null;
  }

  const guests: Guest[] = [];

  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const age = (item as { age?: unknown }).age;
    const bingo = (item as { bingo?: unknown }).bingo;
    if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 120) {
      return null;
    }
    if (typeof bingo !== "boolean") return null;
    guests.push({ age, bingo });
  }

  return guests;
}

export function parseEmail(input: unknown) {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length < 5 || email.length > 200) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}
