"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useCaptureFlow } from "@/components/capture/capture-context";
import { ScannerIcon } from "@/components/icons/ScannerIcon";
import {
  IconAccount,
  IconHome,
  IconProgress,
  IconSparkle,
} from "@/components/icons/nutrivision-icons";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/analytics", label: "Progress", Icon: IconProgress },
  { href: "/insights", label: "AI Tips", Icon: IconSparkle },
  { href: "/profile", label: "Account", Icon: IconAccount },
] as const;

type PillRect = { left: number; top: number; width: number; height: number };

const EMPTY_PILL: PillRect = { left: 0, top: 0, width: 0, height: 0 };

export function BottomNav() {
  const pathname = usePathname();
  const { openCapture } = useCaptureFlow();
  const barRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<PillRect>(EMPTY_PILL);

  const activeIndex = TABS.findIndex((t) => t.href === pathname);

  const updatePill = useCallback(() => {
    if (activeIndex < 0) return;
    const bar = barRef.current;
    const el = itemRefs.current[activeIndex];
    if (!bar || !el) return;
    const barRect = bar.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPill({
      left: elRect.left - barRect.left,
      top: elRect.top - barRect.top,
      width: elRect.width,
      height: elRect.height,
    });
  }, [activeIndex]);

  useEffect(() => {
    updatePill();
    const bar = barRef.current;
    const ro = bar ? new ResizeObserver(updatePill) : null;
    if (bar && ro) ro.observe(bar);
    window.addEventListener("resize", updatePill);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updatePill);
    };
  }, [updatePill, pathname]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-safe pt-6"
      aria-label="Primary navigation"
    >
      <div className="relative mb-3 w-full max-w-md">
        <button
          type="button"
          onClick={() => openCapture()}
          aria-label="Scan food"
          className="nv-fab-scan absolute -top-7 left-1/2 z-20 flex size-[3.75rem] -translate-x-1/2 items-center justify-center rounded-full transition-transform active:scale-95"
        >
          <ScannerIcon size={28} color="dark" />
        </button>

        <div
          ref={barRef}
          className="nv-tab-bar relative flex items-center justify-between rounded-[2rem] px-2 py-2"
        >
          {activeIndex >= 0 && pill.width > 0 && (
            <span
              className="nv-tab-pill pointer-events-none absolute rounded-2xl transition-[left,width,top,height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{
                left: pill.left,
                top: pill.top,
                width: pill.width,
                height: pill.height,
              }}
            />
          )}

          <div className="flex flex-1 justify-evenly">
            {TABS.slice(0, 2).map((tab, i) => (
              <TabLink
                key={tab.href}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                {...tab}
                active={pathname === tab.href}
              />
            ))}
          </div>

          <div className="w-[4.5rem] shrink-0" aria-hidden />

          <div className="flex flex-1 justify-evenly">
            {TABS.slice(2).map((tab, i) => (
              <TabLink
                key={tab.href}
                ref={(el) => {
                  itemRefs.current[i + 2] = el;
                }}
                {...tab}
                active={pathname === tab.href}
              />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

const TabLink = forwardRef<
  HTMLAnchorElement,
  {
    href: string;
    label: string;
    Icon: typeof IconHome;
    active: boolean;
  }
>(function TabLink({ href, label, Icon, active }, ref) {
  return (
    <Link
      ref={ref}
      href={href}
      className={cn(
        "relative z-10 flex h-14 min-w-[3.75rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5",
        "transition-colors duration-300",
        active ? "text-foreground" : "text-muted-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={20} className="shrink-0" />
      <span className="max-w-full truncate text-[10px] font-semibold leading-none">{label}</span>
    </Link>
  );
});
