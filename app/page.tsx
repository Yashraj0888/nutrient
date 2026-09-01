"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { DailyCaloriesCard } from "@/components/dashboard/DailyCaloriesCard";
import { MacroMiniCards } from "@/components/dashboard/MacroMiniCards";
import { DailyNutrientBreakdown } from "@/components/dashboard/DailyNutrientBreakdown";
import { DateStrip } from "@/components/dashboard/DateStrip";
import { TodayMealCard } from "@/components/dashboard/TodayMealCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconPlus } from "@/components/icons/nutrivision-icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";
import { useDailyLog } from "@/hooks/use-daily-log";
import { formatDayHeading, removeMealEntry, todayKey } from "@/lib/storage";
import { APP_NAME } from "@/lib/brand";
import { useCaptureFlow } from "@/components/capture/capture-context";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

export default function DashboardPage() {
  const { profile, targets, loaded } = useProfile();
  const [dateKey, setDateKey] = useState(() => todayKey());
  const [followToday, setFollowToday] = useState(true);
  const { log, totals } = useDailyLog(dateKey);
  const { openCapture } = useCaptureFlow();

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

  if (!loaded) {
    return (
      <div className="mobile-container pt-safe pt-5">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="mt-4 h-28 w-full rounded-3xl" />
      </div>
    );
  }

  if (!profile || !targets) {
    return (
      <div className="mobile-container flex flex-col items-center gap-6 px-4 pt-safe pt-24 text-center">
        <Image src="/appicon.png" alt={APP_NAME} width={80} height={80} className="rounded-2xl shadow-[var(--nv-shadow)]" priority />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Get to know your food&apos;s nutrition to maximize your diet.
          </p>
        </div>
        <Button asChild className="h-12 w-full rounded-full bg-nv-lime text-base font-bold text-primary-foreground hover:bg-nv-lime/90">
          <Link href="/profile">Join Us</Link>
        </Button>
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
            onClick={openCapture}
            className="flex items-center gap-1 text-sm font-bold text-nv-lime-dark"
          >
            <IconPlus size={16} />
            Add Meal
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {sortedMeals.length === 0 ? (
            <div className="nv-card px-4 py-10 text-center text-sm text-muted-foreground">
              No meals logged yet. Tap + Add Meal or scan food.
            </div>
          ) : (
            sortedMeals.map((entry) => (
              <TodayMealCard
                key={entry.id}
                entry={entry}
                onRemove={(id) => removeMealEntry(dateKey, id)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
