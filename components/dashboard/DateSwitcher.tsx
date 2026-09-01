"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatDateLabel, toDateKey, todayKey } from "@/lib/storage";

interface DateSwitcherProps {
  dateKey: string;
  onChange: (dateKey: string) => void;
}

export function DateSwitcher({ dateKey, onChange }: DateSwitcherProps) {
  const [open, setOpen] = useState(false);
  const isToday = dateKey === todayKey();

  function shiftDay(delta: number) {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(y, m - 1, d + delta);
    const next = toDateKey(date);
    if (next > todayKey()) return;
    onChange(next);
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="icon"
        variant="ghost"
        className="tap-target size-9 rounded-full"
        onClick={() => shiftDay(-1)}
        aria-label="Previous day"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 gap-1.5 rounded-full px-3">
            <CalendarDays className="size-3.5" />
            {formatDateLabel(dateKey)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={new Date(`${dateKey}T00:00:00`)}
            disabled={{ after: new Date() }}
            onSelect={(date) => {
              if (!date) return;
              onChange(toDateKey(date));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      <Button
        size="icon"
        variant="ghost"
        className="tap-target size-9 rounded-full"
        onClick={() => shiftDay(1)}
        disabled={isToday}
        aria-label="Next day"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
