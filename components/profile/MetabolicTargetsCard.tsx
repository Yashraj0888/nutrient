"use client";

import type { NutrientTargets } from "@/lib/types";
import type { MetabolicBreakdown } from "@/lib/nutrition-calculator";
import { GOAL_LABELS, ACTIVITY_SHORT_LABELS } from "@/lib/nutrition-calculator";
import { cn } from "@/lib/utils";

interface MetabolicTargetsCardProps {
  metabolic: MetabolicBreakdown;
  targets: NutrientTargets;
}

export function MetabolicTargetsCard({ metabolic, targets }: MetabolicTargetsCardProps) {
  return (
    <div className="nv-card bg-accent/40 p-5">
      <h2 className="text-base font-bold">How your targets are calculated</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        Uses your age, gender, weight, and height with the Mifflin-St Jeor equation (clinical standard).
        Only one activity level and one goal are applied — never combined.
      </p>

      <div className="mt-4 space-y-2 rounded-2xl bg-white/70 p-3 text-sm">
        <Row label="BMR (basal metabolic rate)" value={`${metabolic.bmr} kcal`} highlight />
        <Row
          label={`Activity (${ACTIVITY_SHORT_LABELS[metabolic.activityLevel]} × ${metabolic.activityMultiplier})`}
          value={`${metabolic.tdee} kcal TDEE`}
        />
        <Row
          label={`Goal (${GOAL_LABELS[metabolic.goal]})`}
          value={
            metabolic.goalAdjustmentKcal === 0
              ? "No change"
              : `${metabolic.goalAdjustmentKcal > 0 ? "+" : ""}${metabolic.goalAdjustmentKcal} kcal`
          }
        />
        <Row label="Daily calorie target" value={`${metabolic.calories} kcal`} highlight />
      </div>

      <p className="mt-2 text-[10px] text-muted-foreground">{metabolic.formulaNote}</p>

      <h3 className="mb-2 mt-4 text-sm font-bold">Macro targets</h3>
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <TargetStat label="Protein" value={`${targets.protein}g`} accent="protein" />
        <TargetStat label="Carbs" value={`${targets.carbs}g`} accent="carbs" />
        <TargetStat label="Fat" value={`${targets.fat}g`} accent="fat" />
        <TargetStat label="Fiber" value={`${targets.fiber}g`} accent="lime" />
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-bold tabular-nums", highlight && "text-nv-lime-dark")}>{value}</span>
    </div>
  );
}

function TargetStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "carbs" | "fat" | "protein" | "lime";
}) {
  const accentClass = {
    carbs: "text-nv-carbs",
    fat: "text-nv-fat",
    protein: "text-nv-protein",
    lime: "text-nv-lime-dark",
  };
  return (
    <div className="rounded-2xl bg-white/60 py-2.5">
      <span className={cn("text-base font-bold tabular-nums", accent && accentClass[accent])}>{value}</span>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
