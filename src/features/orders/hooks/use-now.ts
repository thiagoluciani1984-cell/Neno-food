"use client";

import { useEffect, useState } from "react";

/** Re-renderiza periodicamente para manter contagens regressivas (ex.: tempo de preparo) atualizadas. */
export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return now;
}
