"use client";

import { useEffect, useState } from "react";

export function useBingoNumbers(eventId: string) {
  const [numbers, setNumbers] = useState<number[]>([]);

  useEffect(() => {
    if (!eventId) return;
    let stop = false;

    async function pull() {
      try {
        const response = await fetch(`/api/bingo?event=${encodeURIComponent(eventId)}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as { numbers?: number[] };
        if (!stop && Array.isArray(data.numbers)) setNumbers(data.numbers);
      } catch {
        // Keep the last numbers on a brief network miss.
      }
    }

    let pending = false;

    async function load() {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      try {
        await pull();
      } finally {
        pending = false;
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 2000);
    const onVisible = () => {
      void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stop = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [eventId]);

  return numbers;
}
