"use client";

import { useCallback, useEffect, useState } from "react";
import { computeDailyTotals, getDailyLog, subscribeToUpdates } from "@/lib/storage";
import type { DailyLog, DailyTotals } from "@/lib/types";

export function useDailyLog(dateKey: string) {
  const [log, setLog] = useState<DailyLog>(() =>
    typeof window !== "undefined" ? getDailyLog(dateKey) : { date: dateKey, meals: [] }
  );

  const refresh = useCallback(() => {
    setLog(getDailyLog(dateKey));
  }, [dateKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => subscribeToUpdates(refresh), [refresh]);

  const totals: DailyTotals = computeDailyTotals(log);

  return { log, totals, refresh };
}
