import { IconFlame, IconSparkle } from "@/components/icons/nutrivision-icons";
import type { Insight } from "@/lib/types";
import { cn } from "@/lib/utils";

const KIND_STYLES: Record<
  Insight["kind"],
  { label: string; iconClass: string; bgClass: string }
> = {
  highlight: { label: "★", iconClass: "text-nv-lime-dark", bgClass: "bg-nv-lime/20" },
  gap: { label: "!", iconClass: "text-nv-carbs", bgClass: "bg-nv-carbs/15" },
  warning: { label: "!", iconClass: "text-nv-protein", bgClass: "bg-nv-protein/15" },
  info: { label: "i", iconClass: "text-foreground", bgClass: "bg-secondary" },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const style = KIND_STYLES[insight.kind] ?? KIND_STYLES.info;

  return (
    <div className="nv-card flex items-start gap-3 p-4">
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
          style.bgClass,
          style.iconClass
        )}
      >
        {insight.kind === "highlight" ? <IconSparkle size={16} /> : style.label}
      </span>
      <div className="min-w-0">
        {insight.nutrient && (
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            <IconFlame size={12} className="text-nv-carbs" />
            {insight.nutrient}
          </p>
        )}
        <p className="text-sm leading-snug">{insight.message}</p>
      </div>
    </div>
  );
}
