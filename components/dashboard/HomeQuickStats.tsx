"use client";

import Link from "next/link";
import { NutrientIcon } from "@/components/icons/NutrientIcon";
import { IconSparkle } from "@/components/icons/nutrivision-icons";
import type { DailyTotals, NutrientTargets } from "@/lib/types";

interface HomeQuickStatsProps {
  totals: DailyTotals;
  targets: NutrientTargets;
  mealCount: number;
  dayLabel: string;
}

function pct(value: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

export function HomeQuickStats({ totals, targets, mealCount, dayLabel }: HomeQuickStatsProps) {
  const caloriePct = pct(totals.calories, targets.calories);
  const proteinPct = pct(totals.protein, targets.protein);
  const remaining = Math.max(0, Math.round(targets.calories - totals.calories));

  const tip =
    mealCount === 0
      ? "Scan your first meal to start tracking today's nutrition."
      : remaining <= 0
        ? "You've reached your calorie target. Focus on protein and fiber for the rest of the day."
        : proteinPct < 50
          ? `You're ${remaining} kcal from your goal — consider a protein-rich meal next.`
          : `You're ${caloriePct}% of the way to your daily calorie goal.`;

  return (
    <div className="nv-card overflow-hidden p-0">
      <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60">
        <StatCell label="Meals" value={String(mealCount)} sub={dayLabel} />
        <StatCell label="Calories" value={`${caloriePct}%`} sub={`${Math.round(totals.calories)} kcal`} />
        <StatCell label="Protein" value={`${proteinPct}%`} sub={`${Math.round(totals.protein)}g`} />
      </div>

      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-nv-lime/15 text-nv-lime-dark">
          <IconSparkle size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-foreground">Today&apos;s snapshot</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{tip}</p>
        </div>
        <Link
          href="/insights"
          className="shrink-0 text-[11px] font-bold text-nv-lime-dark"
        >
          AI Tips →
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2 border-t border-border/60 px-4 py-3">
        <MacroPill icon="protein" label="Protein" value={totals.protein} target={targets.protein} unit="g" />
        <MacroPill icon="carbs" label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" />
        <MacroPill icon="fat" label="Fat" value={totals.fat} target={targets.fat} unit="g" />
        <MacroPill icon="fiber" label="Fiber" value={totals.fiber} target={targets.fiber} unit="g" />
      </div>
    </div>
  );
}

function StatCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function MacroPill({
  icon,
  label,
  value,
  target,
  unit,
}: {
  icon: "protein" | "carbs" | "fat" | "fiber";
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  const progress = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="rounded-xl bg-secondary/60 px-2 py-2">
      <div className="flex items-center justify-center gap-1">
        <NutrientIcon type={icon} size={12} />
        <span className="text-[9px] font-bold text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-center text-[11px] font-bold tabular-nums">
        {Math.round(value)}
        <span className="font-medium text-muted-foreground">/{Math.round(target)}{unit}</span>
      </p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border/80">
        <div
          className="h-full rounded-full bg-nv-lime transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
