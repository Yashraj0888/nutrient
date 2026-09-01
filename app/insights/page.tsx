"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InsightCard } from "@/components/insights/InsightCard";
import { useProfile } from "@/hooks/use-profile";
import { useDailyLog } from "@/hooks/use-daily-log";
import { todayKey } from "@/lib/storage";
import type { InsightsResult } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";

export default function InsightsPage() {
  const { profile, targets, loaded } = useProfile();
  const { totals, log } = useDailyLog(todayKey());
  const [result, setResult] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!targets) return;
    setLoading(true);
    try {
      const res = await fetch("/api/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totals, targets }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } finally {
      setLoading(false);
    }
  }, [targets, totals]);

  if (!loaded) return null;

  if (!profile || !targets) {
    return (
      <div className="mobile-container pt-safe pt-20 text-center">
        <Button asChild className="rounded-full bg-nv-lime text-primary-foreground">
          <Link href="/profile">Set up your profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mobile-container pb-4 pt-safe pt-5">
      <PageHeader title="AI Nutrition Tips" />

      <div className="mt-5">
        {log.meals.length === 0 ? (
          <div className="nv-card px-4 py-12 text-center text-sm text-muted-foreground">
            Log meals to get AI insights.
          </div>
        ) : !result && !loading ? (
          <div className="nv-card flex flex-col items-center gap-4 px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">Get personalized nutrition feedback.</p>
            <Button onClick={() => void fetchInsights()} className="rounded-full bg-nv-lime font-bold text-primary-foreground">
              Generate insights
            </Button>
          </div>
        ) : loading ? (
          <Skeleton className="h-24 w-full rounded-3xl" />
        ) : result ? (
          <div className="flex flex-col gap-3">
            <div className="nv-card p-4 text-sm">{result.summary}</div>
            {result.insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
