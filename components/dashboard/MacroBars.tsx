"use client";

import { cn } from "@/lib/utils";

interface MacroDatum {
  label: string;
  value: number;
  target: number;
  unit: string;
  colorVar: string;
  colorClass: string;
}

interface MacroBarsProps {
  protein: { value: number; target: number };
  carbs: { value: number; target: number };
  fat: { value: number; target: number };
  fiber: { value: number; target: number };
}

export function MacroBars({ protein, carbs, fat, fiber }: MacroBarsProps) {
  const data: MacroDatum[] = [
    { label: "Protein", unit: "g", colorVar: "var(--nv-protein)", colorClass: "text-nv-protein", ...protein },
    { label: "Carbs", unit: "g", colorVar: "var(--nv-carbs)", colorClass: "text-nv-carbs", ...carbs },
    { label: "Fat", unit: "g", colorVar: "var(--nv-fat)", colorClass: "text-nv-fat", ...fat },
    { label: "Fiber", unit: "g", colorVar: "var(--nv-fiber)", colorClass: "text-nv-fiber", ...fiber },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {data.map((d) => {
        const pct = d.target > 0 ? Math.min(100, (d.value / d.target) * 100) : 0;
        return (
          <div key={d.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{d.label}</span>
              <span className={cn("text-xs font-semibold tabular-nums", d.colorClass)}>
                {Math.round(d.value)}/{Math.round(d.target)}
                {d.unit}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%`, backgroundColor: d.colorVar }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
