export function safeNextPath(input: unknown, fallback: string) {
  if (typeof input !== "string") return fallback;
  if (!input.startsWith("/")) return fallback;
  if (input.startsWith("//") || input.startsWith("/\\")) return fallback;
  if (input.includes("://") || input.includes("\n") || input.includes("\r")) return fallback;
  return input;
}
