"use client";

import { BMICard } from "@/components/analytics/BMICard";
import { CalorieTrendChart } from "@/components/analytics/CalorieTrendChart";
import { MacroTrendChart } from "@/components/analytics/MacroTrendChart";
import { FiberTrendChart } from "@/components/analytics/FiberTrendChart";
import { DailyNutrientBreakdown } from "@/components/dashboard/DailyNutrientBreakdown";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireProfile } from "@/hooks/use-require-profile";
import { computeDailyTotals, getDailyLog, getLogsInRange, todayKey } from "@/lib/storage";
import type { DayIntakePoint } from "@/lib/types";
import { useMemo } from "react";

export default function AnalyticsPage() {
  const { profile, targets, isReady } = useRequireProfile();
  const rangeDays = 7;

  const series: DayIntakePoint[] = useMemo(() => {
    if (!targets) return [];
    const logs = getLogsInRange(rangeDays);
    return logs.map((log) => {
      const totals = computeDailyTotals(log);
      return {
        date: log.date,
        calories: totals.calories,
        target: targets.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        fiber: totals.fiber,
        fiberTarget: targets.fiber,
        micros: totals.micros,
      };
    });
  }, [targets]);

  const todayTotals = useMemo(() => computeDailyTotals(getDailyLog(todayKey())), []);

  if (!isReady || !profile || !targets) {
    return (
      <div className="mobile-container pt-safe pt-5">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-40 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="mobile-container pb-4 pt-safe pt-5">
      <PageHeader title="Progress" />

      <div className="mt-5">
        <BMICard />
      </div>

      <div className="nv-card mt-4 p-4">
        <h2 className="mb-1 text-sm font-bold">Calorie intake trend</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">Last 7 days from your logged meals</p>
        <CalorieTrendChart data={series} />
      </div>

      <div className="nv-card mt-4 p-4">
        <h2 className="mb-1 text-sm font-bold">Macro trends</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">Protein, carbs, and fat over time</p>
        <MacroTrendChart data={series} />
      </div>

      <div className="nv-card mt-4 p-4">
        <h2 className="mb-1 text-sm font-bold">Fiber trend</h2>
        <p className="mb-3 text-[11px] text-muted-foreground">Daily fiber vs your target</p>
        <FiberTrendChart data={series} />
      </div>

      <div className="mt-4">
        <DailyNutrientBreakdown totals={todayTotals} targets={targets} title="Today's nutrients" />
      </div>
    </div>
  );
}
