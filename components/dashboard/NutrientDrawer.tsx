"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { MicroTargets } from "@/lib/types";

interface MicroRow {
  key: keyof MicroTargets;
  label: string;
  unit: string;
}

const VITAMIN_ROWS: MicroRow[] = [
  { key: "vitaminA_mcg", label: "Vitamin A", unit: "mcg" },
  { key: "vitaminC_mg", label: "Vitamin C", unit: "mg" },
  { key: "vitaminD_IU", label: "Vitamin D", unit: "IU" },
  { key: "vitaminB12_mcg", label: "Vitamin B12", unit: "mcg" },
];

const MINERAL_ROWS: MicroRow[] = [
  { key: "iron_mg", label: "Iron", unit: "mg" },
  { key: "calcium_mg", label: "Calcium", unit: "mg" },
  { key: "potassium_mg", label: "Potassium", unit: "mg" },
  { key: "sodium_mg", label: "Sodium", unit: "mg" },
];

interface NutrientDrawerProps {
  totals: MicroTargets;
  targets: MicroTargets;
}

export function NutrientDrawer({ totals, targets }: NutrientDrawerProps) {
  return (
    <Accordion type="single" collapsible defaultValue="vitamins">
      <AccordionItem value="vitamins">
        <AccordionTrigger className="py-3 text-[14px] font-semibold">
          Vitamins
        </AccordionTrigger>
        <AccordionContent>
          <MicroRows rows={VITAMIN_ROWS} totals={totals} targets={targets} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="minerals">
        <AccordionTrigger className="py-3 text-[14px] font-semibold">
          Minerals
        </AccordionTrigger>
        <AccordionContent>
          <MicroRows rows={MINERAL_ROWS} totals={totals} targets={targets} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function MicroRows({
  rows,
  totals,
  targets,
}: {
  rows: MicroRow[];
  totals: MicroTargets;
  targets: MicroTargets;
}) {
  return (
    <div className="flex flex-col gap-3 pt-1">
      {rows.map((row) => {
        const value = totals[row.key];
        const target = targets[row.key];
        const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
        const isSodium = row.key === "sodium_mg";
        const over = isSodium && value > target;
        return (
          <div key={row.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-foreground">{row.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {Math.round(value)} / {Math.round(target)} {row.unit}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: over ? "var(--nv-fat)" : "var(--nv-lime)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
