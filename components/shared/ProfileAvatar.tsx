"use client";

import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

const SIZES = {
  sm: "size-11 text-sm",
  md: "size-16 text-lg",
  lg: "size-24 text-2xl",
};

export function ProfileAvatar({ name, avatarUrl, size = "sm", className, onClick }: ProfileAvatarProps) {
  const initial = (name || "U").charAt(0).toUpperCase();
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#d4f5a0] to-[#b8e62e] font-bold text-primary-foreground",
        SIZES[size],
        onClick && "transition active:scale-95",
        className
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="size-full object-cover" />
      ) : (
        initial
      )}
    </Tag>
  );
}
