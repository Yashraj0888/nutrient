"use client";

import { useCallback, useEffect, useState } from "react";
import { calculateNutrientTargets } from "@/lib/nutrition-calculator";
import { getProfile, subscribeToUpdates } from "@/lib/storage";
import type { NutrientTargets, UserProfile } from "@/lib/types";

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(() =>
    typeof window !== "undefined" ? getProfile() : null
  );
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined");

  const refresh = useCallback(() => {
    setProfile(getProfile());
    setLoaded(true);
  }, []);

  useEffect(() => subscribeToUpdates(refresh), [refresh]);

  const targets: NutrientTargets | null = profile ? calculateNutrientTargets(profile) : null;

  return { profile, targets, loaded, refresh };
}
