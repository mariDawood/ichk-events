import { createHash, timingSafeEqual } from "node:crypto";
import { sendDueReminders } from "@/lib/reminders";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const actual = createHash("sha256").update(header).digest();
  const expected = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const sent = await sendDueReminders();
  return NextResponse.json({ ok: true, sent });
}
