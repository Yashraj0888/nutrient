"use client";

import { useEffect, useMemo, useState } from "react";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@/components/icons/nutrivision-icons";
import { formatDateLabel, toDateKey, todayKey } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface DateStripProps {
  selected: string;
  onChange: (dateKey: string) => void;
  days?: number;
}

export function DateStrip({ selected, onChange, days = 7 }: DateStripProps) {
  const [anchorToday, setAnchorToday] = useState(() => todayKey());

  useEffect(() => {
    function refreshToday() {
      const next = todayKey();
      setAnchorToday((current) => (current === next ? current : next));
    }

    refreshToday();
    const interval = window.setInterval(refreshToday, 60_000);
    window.addEventListener("focus", refreshToday);
    document.addEventListener("visibilitychange", refreshToday);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshToday);
      document.removeEventListener("visibilitychange", refreshToday);
    };
  }, []);

  const monthLabel = useMemo(() => {
    const [y, m] = selected.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "short", year: "numeric" });
  }, [selected]);

  const dates = useMemo(() => {
    const result: { key: string; day: number; weekday: string }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const [y, m, d] = anchorToday.split("-").map(Number);
      const date = new Date(y, m - 1, d - i);
      result.push({
        key: toDateKey(date),
        day: date.getDate(),
        weekday: date.toLocaleDateString(undefined, { weekday: "short" }).charAt(0),
      });
    }
    return result;
  }, [anchorToday, days]);

  function shift(delta: number) {
    const [y, m, d] = selected.split("-").map(Number);
    const next = toDateKey(new Date(y, m - 1, d + delta));
    if (next > anchorToday) return;
    onChange(next);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold">
          <IconCalendar size={18} className="text-muted-foreground" />
          {monthLabel}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs font-semibold shadow-[var(--nv-shadow)]">
          <button type="button" onClick={() => shift(-1)} className="p-1" aria-label="Previous day">
            <IconChevronLeft size={16} />
          </button>
          <span className="px-1 text-muted-foreground">{formatDateLabel(selected)}</span>
          <button
            type="button"
            onClick={() => shift(1)}
            disabled={selected === anchorToday}
            className="p-1 disabled:opacity-30"
            aria-label="Next day"
          >
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto no-scrollbar px-1 py-1">
        {dates.map((d) => {
          const active = d.key === selected;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => onChange(d.key)}
              className={cn(
                "flex min-w-[2.75rem] shrink-0 flex-col items-center justify-center rounded-2xl py-2 transition-all duration-300",
                active
                  ? "bg-nv-lime text-primary-foreground shadow-[0_4px_12px_-2px_var(--nv-lime-glow)]"
                  : "bg-white text-muted-foreground shadow-[var(--nv-shadow)]"
              )}
            >
              <span className="text-[10px] font-bold uppercase">{d.weekday}</span>
              <span className="text-[15px] font-bold tabular-nums leading-none">{String(d.day).padStart(2, "0")}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
