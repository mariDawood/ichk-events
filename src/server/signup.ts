"use server";

import { startCheckout, type SignupError } from "@/lib/checkout";
import { redirect } from "next/navigation";

export type { SignupError };

export async function startSignup(input: {
  eventId: string;
  email: string;
  guests: { age: number; bingo: boolean }[];
  company?: string;
  locale: string;
}): Promise<{ ok: false; error: SignupError } | undefined> {
  try {
    const result = await startCheckout(input);
    if (!result.ok) return result;
    redirect(result.url);
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "digest" in error &&
      String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    console.error("signup failed");
    return { ok: false, error: "generic" };
  }
}
