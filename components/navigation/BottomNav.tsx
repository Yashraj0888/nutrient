"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useCaptureFlow } from "@/components/capture/capture-context";
import {
  IconAccount,
  IconForum,
  IconHome,
  IconProgress,
  IconScan,
} from "@/components/icons/nutrivision-icons";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/analytics", label: "Progress", Icon: IconProgress },
  { href: "/insights", label: "Forum", Icon: IconForum },
  { href: "/profile", label: "Account", Icon: IconAccount },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { openCapture } = useCaptureFlow();
  const barRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });

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
      width: elRect.width,
    });
  }, [activeIndex]);

  useEffect(() => {
    updatePill();
    window.addEventListener("resize", updatePill);
    return () => window.removeEventListener("resize", updatePill);
  }, [updatePill, pathname]);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-safe"
      aria-label="Primary navigation"
    >
      <div className="relative mb-3 w-full max-w-md">
        {/* Center scan FAB */}
        <button
          type="button"
          onClick={openCapture}
          aria-label="Scan food"
          className="nv-fab-scan absolute -top-7 left-1/2 z-20 flex size-[3.75rem] -translate-x-1/2 items-center justify-center rounded-full transition-transform active:scale-95"
        >
          <IconScan size={26} className="text-[#1a2e05]" />
        </button>

        <div
          ref={barRef}
          className="nv-tab-bar relative flex items-end justify-between rounded-[2rem] px-2 pb-2 pt-3"
        >
          {/* Sliding glass pill */}
          {activeIndex >= 0 && pill.width > 0 && (
            <span
              className="nv-tab-pill pointer-events-none absolute top-2.5 h-[2.75rem] rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              style={{ left: pill.left, width: pill.width }}
            />
          )}

          {/* Left tabs */}
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

          {/* Right tabs */}
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
        "relative z-10 flex min-w-[3.5rem] flex-col items-center gap-0.5 rounded-2xl px-3 py-1.5 transition-colors duration-300",
        active ? "text-foreground" : "text-muted-foreground"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={22} />
      <span className="text-[10px] font-semibold">{label}</span>
    </Link>
  );
});
