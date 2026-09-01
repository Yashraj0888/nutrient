"use client";

import { NutrientIcon } from "@/components/icons/NutrientIcon";
import { NutrientDrawer } from "@/components/dashboard/NutrientDrawer";
import type { DailyTotals, NutrientTargets } from "@/lib/types";

interface MacroRowProps {
  label: string;
  value: number;
  target: number;
  unit: string;
  color: string;
  icon?: "carbs" | "protein" | "fat" | "fiber" | "calories";
}

function MacroRow({ label, value, target, unit, color, icon }: MacroRowProps) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-semibold">
          {icon && <NutrientIcon type={icon} size={18} />}
          {label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(value)} / {Math.round(target)} {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

interface DailyNutrientBreakdownProps {
  totals: DailyTotals;
  targets: NutrientTargets;
  title?: string;
}

export function DailyNutrientBreakdown({ totals, targets, title = "Nutrient details" }: DailyNutrientBreakdownProps) {
  const hasData = totals.calories > 0;

  return (
    <div className="nv-card p-4">
      <h2 className="mb-1 text-sm font-bold">{title}</h2>
      <p className="mb-4 text-[11px] leading-relaxed text-muted-foreground">
        Values are summed from your logged meals. Each food item is analyzed by AI using USDA FoodData
        Central and Indian food composition data when you scan or add food.
      </p>

      {!hasData ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Log a meal to see nutrient breakdown.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <MacroRow label="Calories" value={totals.calories} target={targets.calories} unit="kcal" color="var(--nv-lime)" icon="calories" />
            <MacroRow label="Protein" value={totals.protein} target={targets.protein} unit="g" color="var(--nv-protein)" icon="protein" />
            <MacroRow label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" color="var(--nv-carbs)" icon="carbs" />
            <MacroRow label="Fats" value={totals.fat} target={targets.fat} unit="g" color="var(--nv-fat)" icon="fat" />
            <MacroRow label="Fiber" value={totals.fiber} target={targets.fiber} unit="g" color="var(--nv-fiber)" icon="fiber" />
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-sm">
            <div className="rounded-xl bg-secondary/60 px-3 py-2">
              <p className="text-[10px] font-semibold text-muted-foreground">Sugar</p>
              <p className="font-bold tabular-nums">{Math.round(totals.sugar_g)} g</p>
            </div>
            <div className="rounded-xl bg-secondary/60 px-3 py-2">
              <p className="text-[10px] font-semibold text-muted-foreground">Cholesterol</p>
              <p className="font-bold tabular-nums">{Math.round(totals.cholesterol_mg)} mg</p>
            </div>
          </div>

          <NutrientDrawer totals={totals.micros} targets={targets.micros} />
        </div>
      )}
    </div>
  );
}
