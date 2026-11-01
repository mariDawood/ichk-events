import { events, type ChurchEvent } from "@/content/events";

export function getVisibleEvents(
  now: Date,
  items: ChurchEvent[] = events,
): ChurchEvent[] {
  return items
    .filter((event) => now.getTime() < new Date(event.end).getTime())
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
}
