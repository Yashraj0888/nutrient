"use client";

import { useEffect, useMemo, useState } from "react";
import { DailyCaloriesCard } from "@/components/dashboard/DailyCaloriesCard";
import { HomeQuickStats } from "@/components/dashboard/HomeQuickStats";
import { MacroMiniCards } from "@/components/dashboard/MacroMiniCards";
import { DailyNutrientBreakdown } from "@/components/dashboard/DailyNutrientBreakdown";
import { DateStrip } from "@/components/dashboard/DateStrip";
import { TodayMealCard } from "@/components/dashboard/TodayMealCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconPlus } from "@/components/icons/nutrivision-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireProfile } from "@/hooks/use-require-profile";
import { useDailyLog } from "@/hooks/use-daily-log";
import { formatDayHeading, removeMealEntry, todayKey } from "@/lib/storage";
import { useCaptureFlow } from "@/components/capture/capture-context";
import { MealDetailSheet } from "@/components/dashboard/MealDetailSheet";
import type { MealLogEntry } from "@/lib/types";
import { toast } from "sonner";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export default function DashboardPage() {
  const { profile, targets, isReady } = useRequireProfile();
  const [dateKey, setDateKey] = useState(() => todayKey());
  const [followToday, setFollowToday] = useState(true);
  const { log, totals } = useDailyLog(dateKey);
  const { openCapture, openManual } = useCaptureFlow();
  const [selectedMeal, setSelectedMeal] = useState<MealLogEntry | null>(null);

  const dayLabel = useMemo(() => formatDayHeading(dateKey), [dateKey]);

  useEffect(() => {
    function syncToday() {
      const today = todayKey();
      if (followToday) setDateKey(today);
    }

    syncToday();
    const interval = window.setInterval(syncToday, 60_000);
    window.addEventListener("focus", syncToday);
    document.addEventListener("visibilitychange", syncToday);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", syncToday);
      document.removeEventListener("visibilitychange", syncToday);
    };
  }, [followToday]);

  function handleDateChange(next: string) {
    setDateKey(next);
    setFollowToday(next === todayKey());
  }

  const sortedMeals = useMemo(
    () => [...log.meals].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)),
    [log.meals]
  );

  if (!isReady || !profile || !targets) {
    return (
      <div className="mobile-container pt-safe pt-5">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-28 w-full rounded-3xl" />
      </div>
    );
  }

  const firstName = profile.name?.split(" ")[0] || "there";

  return (
    <div className="mobile-container pb-4 pt-safe pt-5">
      <PageHeader greeting={`${greeting()}, ${firstName}!`} showAvatar />

      <div className="mt-5">
        <DateStrip selected={dateKey} onChange={handleDateChange} />
      </div>

      <div className="mt-4 space-y-3">
        <HomeQuickStats
          totals={totals}
          targets={targets}
          mealCount={sortedMeals.length}
          dayLabel={dayLabel}
        />
        <DailyCaloriesCard consumed={totals.calories} target={targets.calories} />
        <MacroMiniCards
          carbs={{ value: totals.carbs, target: targets.carbs }}
          fats={{ value: totals.fat, target: targets.fat }}
          protein={{ value: totals.protein, target: targets.protein }}
        />
      </div>

      <section className="mt-6">
        <DailyNutrientBreakdown totals={totals} targets={targets} title={`${dayLabel}'s nutrients`} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">{dayLabel}&apos;s meals</h2>
          <button
            type="button"
            onClick={() => openCapture({ date: dateKey })}
            className="flex items-center gap-1 text-sm font-bold text-nv-lime-dark"
          >
            <IconPlus size={16} />
            Add Meal
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {sortedMeals.length === 0 ? (
            <div className="nv-card px-4 py-10 text-center">
              <p className="text-sm font-semibold text-foreground">No meals logged yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tap the camera to scan, or add a food manually below.
              </p>
              <button
                type="button"
                onClick={() => openCapture({ date: dateKey })}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-nv-lime px-4 py-2 text-sm font-bold text-primary-foreground"
              >
                <IconPlus size={16} />
                Scan first meal
              </button>
            </div>
          ) : (
            sortedMeals.map((entry) => (
              <TodayMealCard
                key={entry.id}
                entry={entry}
                onOpen={setSelectedMeal}
                onRemove={(id) => {
                  removeMealEntry(dateKey, id);
                  toast.info("Meal removed");
                }}
              />
            ))
          )}
        </div>

        <div className="mt-5 pb-2 text-center">
          <button
            type="button"
            onClick={() => openManual({ date: dateKey })}
            className="text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Add manually
          </button>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Type a food name and weight instead of taking a photo
          </p>
        </div>
      </section>

      <MealDetailSheet
        open={selectedMeal !== null}
        entry={selectedMeal}
        date={dateKey}
        onClose={() => setSelectedMeal(null)}
      />
    </div>
  );
}
