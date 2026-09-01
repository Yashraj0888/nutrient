"use client";

import { InsightsCoach } from "@/components/insights/InsightsCoach";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireProfile } from "@/hooks/use-require-profile";
import { useDailyLog } from "@/hooks/use-daily-log";
import { todayKey } from "@/lib/storage";

export default function InsightsPage() {
  const { profile, targets, isReady } = useRequireProfile();
  const date = todayKey();
  const { log, totals } = useDailyLog(date);

  if (!isReady || !profile || !targets) {
    return (
      <div className="insights-page mobile-container flex flex-col overflow-hidden pb-0 pt-safe pt-5">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="mt-5 h-full min-h-0 flex-1 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="insights-page mobile-container flex flex-col overflow-hidden pb-0 pt-safe pt-5">
      <PageHeader title="AI Nutrition Tips" />
      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <InsightsCoach date={date} log={log} totals={totals} targets={targets} profile={profile} />
      </div>
    </div>
  );
}
