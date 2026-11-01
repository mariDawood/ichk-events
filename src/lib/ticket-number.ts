import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTicketNumber() {
  let raw = "";
  for (let index = 0; index < 8; index += 1) {
    raw += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function normalizeTicketNumber(input: string) {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!new RegExp(`^[${ALPHABET}]{8}$`).test(clean)) return null;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}
