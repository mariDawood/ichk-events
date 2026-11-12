export const ENTRANCE_CENTS = 0;
export const BINGO_CENTS = 100;
export const MAX_PARTY = 12;

export type Guest = {
  name: string;
  age: number;
  bingo: boolean;
};

export function orderTotal(guests: Guest[]) {
  return guests.reduce(
    (sum, guest) => sum + ENTRANCE_CENTS + (guest.bingo ? BINGO_CENTS : 0),
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
    const name = parsePersonName((item as { name?: unknown }).name);
    if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 120) {
      return null;
    }
    if (typeof bingo !== "boolean" || !name) return null;
    guests.push({ name, age, bingo });
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

export function parsePersonName(input: unknown) {
  if (typeof input !== "string") return null;
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) return null;
  return name;
}

export function parsePhone(input: unknown) {
  if (typeof input !== "string") return null;
  const compact = input.trim().replace(/[^\d+]/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  if (compact.length > 20) return null;
  return compact;
}

export function parsePassword(input: unknown) {
  if (typeof input !== "string") return null;
  if (input.length < 8 || input.length > 200) return null;
  return input;
}
