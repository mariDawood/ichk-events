import { events, type ChurchEvent } from "@/content/events";

export function getEvent(id: string) {
  return events.find((event) => event.id === id) ?? null;
}

export function isDuringEvent(event: ChurchEvent, now: Date) {
  const time = now.getTime();
  return time >= new Date(event.start).getTime() && time < new Date(event.end).getTime();
}

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
