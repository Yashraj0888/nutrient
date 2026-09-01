"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScannerIcon } from "@/components/icons/ScannerIcon";
import {
  IconAccount,
  IconHome,
  IconProgress,
  IconSparkle,
} from "@/components/icons/nutrivision-icons";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { useCaptureFlow } from "@/components/capture/capture-context";
import { useProfile } from "@/hooks/use-profile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/analytics", label: "Progress", Icon: IconProgress },
  { href: "/insights", label: "AI Tips", Icon: IconSparkle },
  { href: "/profile", label: "Account", Icon: IconAccount },
] as const;

interface AppMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppMenu({ open, onOpenChange }: AppMenuProps) {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { openCapture } = useCaptureFlow();

  function close() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(100%,20rem)] border-l-0 bg-white/95 p-0 backdrop-blur-xl">
        <SheetHeader className="border-b border-border/60 px-5 py-5 text-left">
          <div className="flex items-center gap-3">
            <ProfileAvatar name={profile?.name} avatarUrl={profile?.avatarUrl} size="md" />
            <div className="min-w-0">
              <SheetTitle className="truncate text-base">{profile?.name || "Guest"}</SheetTitle>
              <p className="text-xs text-muted-foreground">{APP_NAME}</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-3">
          {LINKS.map(({ href, label, Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  active ? "bg-nv-lime/25 text-foreground" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              close();
              openCapture();
            }}
            className="mt-2 flex items-center gap-3 rounded-2xl bg-nv-lime px-4 py-3 text-sm font-bold text-primary-foreground"
          >
            <ScannerIcon size={20} color="dark" />
            Scan food
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

interface MenuButtonProps {
  onClick: () => void;
  className?: string;
}

export function MenuButton({ onClick, className }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-white shadow-[var(--nv-shadow)]",
        className
      )}
      aria-label="Open menu"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 7h12M5 12h9M5 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}
