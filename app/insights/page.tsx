"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InsightsCoach } from "@/components/insights/InsightsCoach";
import { PageHeader } from "@/components/layout/PageHeader";
import { useProfile } from "@/hooks/use-profile";
import { useDailyLog } from "@/hooks/use-daily-log";
import { todayKey } from "@/lib/storage";

export default function InsightsPage() {
  const { profile, targets, loaded } = useProfile();
  const date = todayKey();
  const { log, totals } = useDailyLog(date);

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
    <div className="insights-page mobile-container flex flex-col overflow-hidden pb-0 pt-safe pt-5">
      <PageHeader title="AI Nutrition Tips" />
      <div className="mt-5 flex min-h-0 flex-1 flex-col">
        <InsightsCoach date={date} log={log} totals={totals} targets={targets} profile={profile} />
      </div>
    </div>
  );
}
