"use client";

import { useState } from "react";
import { AppMenu, MenuButton } from "@/components/navigation/AppMenu";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { useProfile } from "@/hooks/use-profile";

interface PageHeaderProps {
  title?: string;
  greeting?: string;
  showAvatar?: boolean;
}

export function PageHeader({ title, greeting, showAvatar = false }: PageHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { profile } = useProfile();

  return (
    <>
      <header className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {showAvatar && (
            <ProfileAvatar name={profile?.name} avatarUrl={profile?.avatarUrl} />
          )}
          {greeting ? (
            <h1 className="truncate text-lg font-bold">{greeting}</h1>
          ) : (
            <h1 className="text-xl font-bold">{title}</h1>
          )}
        </div>
        <MenuButton onClick={() => setMenuOpen(true)} />
      </header>
      <AppMenu open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
