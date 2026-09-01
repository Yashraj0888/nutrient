"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";

export function useRequireProfile() {
  const router = useRouter();
  const { profile, targets, loaded, refresh } = useProfile();

  useEffect(() => {
    if (loaded && (!profile || !targets)) {
      router.replace("/profile");
    }
  }, [loaded, profile, targets, router]);

  const isReady = loaded && !!profile && !!targets;

  return { profile, targets, loaded, isReady, refresh };
}
