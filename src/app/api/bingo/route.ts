import { getEvent } from "@/lib/events";
import { getBingoNumbers } from "@/lib/orders";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const eventId = new URL(request.url).searchParams.get("event") ?? "";
  if (!getEvent(eventId)) {
    return NextResponse.json({ numbers: [] }, { status: 404 });
  }

  const numbers = await getBingoNumbers(eventId);
  return NextResponse.json(
    { numbers },
    { headers: { "Cache-Control": "no-store" } },
  );
}
