"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export interface ProfileSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface ProfileSelectProps {
  label: string;
  hint?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ProfileSelectOption[];
  placeholder?: string;
  className?: string;
  /** Single-line trigger for tight grid layouts */
  compact?: boolean;
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProfileSelect({
  label,
  hint,
  value,
  onValueChange,
  options,
  placeholder = "Choose an option",
  className,
  compact = false,
}: ProfileSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  function pick(next: string) {
    onValueChange(next);
    setOpen(false);
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-semibold text-foreground">{label}</Label>
        {hint && <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{hint}</span>}
      </div>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-border/50 bg-white px-3 text-left shadow-[var(--nv-shadow)]",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nv-lime/25",
          compact ? "h-11 py-0" : "min-h-11 py-2.5"
        )}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
          {selected ? selected.label : <span className="font-medium text-muted-foreground">{placeholder}</span>}
        </span>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <ChevronDown />
        </span>
      </button>

      <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
        <DrawerContent className="mx-auto w-full max-w-lg pb-safe">
          <DrawerHeader className="border-b border-border/60 px-5 pb-4 text-left">
            <DrawerTitle className="text-base font-bold">{label}</DrawerTitle>
            {hint ? (
              <DrawerDescription>{hint}</DrawerDescription>
            ) : (
              <DrawerDescription>Choose the option that best fits you</DrawerDescription>
            )}
          </DrawerHeader>

          <div className="flex max-h-[min(52vh,22rem)] flex-col gap-1.5 overflow-y-auto px-3 py-3" role="listbox" aria-label={label}>
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(option.value)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-colors",
                    active
                      ? "bg-nv-lime/15 ring-1 ring-nv-lime/35"
                      : "bg-secondary/40 hover:bg-secondary"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">{option.label}</p>
                    {option.description && (
                      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{option.description}</p>
                    )}
                  </div>
                  {active && (
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-nv-lime text-primary-foreground">
                      <IconCheck />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

interface ProfileSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function ProfileSection({ title, description, children }: ProfileSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="border-b border-border/60 pb-2">
        <h3 className="text-sm font-bold tracking-tight">{title}</h3>
        {description && <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}
