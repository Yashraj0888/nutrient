"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconCheck, IconLogout } from "@/components/icons/nutrivision-icons";
import { ProfileAvatar } from "@/components/shared/ProfileAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateNutrientTargets,
  getMetabolicBreakdown,
} from "@/lib/nutrition-calculator";
import { MetabolicTargetsCard } from "@/components/profile/MetabolicTargetsCard";
import { ProfileSection, ProfileSelect, type ProfileSelectOption } from "@/components/profile/ProfileSelect";
import { clearProfile, generateId, saveProfile } from "@/lib/storage";
import { useProfile } from "@/hooks/use-profile";
import { APP_NAME } from "@/lib/brand";
import type { ActivityLevel, Gender, Goal, UserProfile } from "@/lib/types";
import { compressAvatarFile } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

const GENDER_OPTIONS: ProfileSelectOption[] = [
  { value: "male", label: "Male", description: "Used for BMR & minimum calorie floor" },
  { value: "female", label: "Female", description: "Used for BMR & minimum calorie floor" },
  { value: "other", label: "Other", description: "Uses neutral metabolic defaults" },
];

const ACTIVITY_OPTIONS: ProfileSelectOption[] = [
  { value: "sedentary", label: "Sedentary", description: "Desk job, little or no exercise" },
  { value: "light", label: "Lightly active", description: "Light exercise 1–3 days per week" },
  { value: "moderate", label: "Moderately active", description: "Moderate exercise 3–5 days per week" },
  { value: "very_active", label: "Very active", description: "Hard exercise 6–7 days per week" },
];

const GOAL_OPTIONS: ProfileSelectOption[] = [
  { value: "weight_loss", label: "Weight loss", description: "Moderate calorie deficit for fat loss" },
  { value: "maintenance", label: "Maintenance", description: "Stay at your current weight" },
  { value: "muscle_gain", label: "Muscle gain", description: "Calorie surplus to support growth" },
];

function profileToForm(profile: UserProfile) {
  return {
    name: profile.name,
    age: String(profile.age),
    gender: profile.gender,
    weightKg: String(profile.weightKg),
    heightCm: String(profile.heightCm),
    activityLevel: profile.activityLevel,
    goal: profile.goal,
  };
}

const EMPTY_FORM = {
  name: "",
  age: "28",
  gender: "male" as Gender,
  weightKg: "70",
  heightCm: "172",
  activityLevel: "moderate" as ActivityLevel,
  goal: "maintenance" as Goal,
};

export default function ProfilePage() {
  const router = useRouter();
  const { profile, refresh } = useProfile();

  return (
    <ProfileForm key={profile?.id ?? "new"} profile={profile} refresh={refresh} router={router} />
  );
}

function ProfileForm({
  profile,
  refresh,
  router,
}: {
  profile: ReturnType<typeof useProfile>["profile"];
  refresh: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => (profile ? profileToForm(profile) : EMPTY_FORM));
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile?.avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const preview = useMemo(() => {
    const parsedAge = parseInt(form.age, 10);
    const parsedWeight = parseFloat(form.weightKg);
    const parsedHeight = parseFloat(form.heightCm);
    if (!parsedAge || !parsedWeight || !parsedHeight) return null;
    const input = {
      age: parsedAge,
      gender: form.gender,
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      activityLevel: form.activityLevel,
      goal: form.goal,
    };
    return {
      targets: calculateNutrientTargets(input),
      metabolic: getMetabolicBreakdown(input),
    };
  }, [form]);

  function handleSave() {
    const parsedAge = parseInt(form.age, 10);
    const parsedWeight = parseFloat(form.weightKg);
    const parsedHeight = parseFloat(form.heightCm);

    if (!parsedAge || parsedAge < 10 || parsedAge > 100) {
      toast.error("Please enter a valid age (10-100).");
      return;
    }
    if (!parsedWeight || parsedWeight < 25 || parsedWeight > 300) {
      toast.error("Please enter a valid weight in kg.");
      return;
    }
    if (!parsedHeight || parsedHeight < 100 || parsedHeight > 250) {
      toast.error("Please enter a valid height in cm.");
      return;
    }

    const now = new Date().toISOString();
    const next: UserProfile = {
      id: profile?.id ?? generateId("user"),
      name: form.name.trim(),
      age: parsedAge,
      gender: form.gender,
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      activityLevel: form.activityLevel,
      goal: form.goal,
      avatarUrl,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };
    saveProfile(next);
    refresh();
    toast.success("Profile saved!");
    router.replace("/");
  }

  function handleReset() {
    clearProfile();
    setForm(EMPTY_FORM);
    setAvatarUrl(undefined);
    refresh();
    toast.info("Profile cleared.");
  }

  async function handleAvatarChange(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await compressAvatarFile(file);
      setAvatarUrl(dataUrl);
      toast.success("Photo updated — save profile to keep it.");
    } catch {
      toast.error("Could not load that image. Try another file.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="mobile-container pb-2 pt-safe pt-5">
      <PageHeader title={profile ? "Account" : "Set up your profile"} />

      {!profile && (
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome to {APP_NAME}. Add your details to get personalized calorie and macro targets.
        </p>
      )}

      <div className="nv-card mb-4 mt-4 flex flex-col items-center gap-3 p-5">
        <ProfileAvatar
          name={form.name}
          avatarUrl={avatarUrl}
          size="lg"
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void handleAvatarChange(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={uploadingAvatar}
          onClick={() => fileRef.current?.click()}
        >
          {uploadingAvatar ? "Uploading…" : "Change profile photo"}
        </Button>
        {avatarUrl && (
          <button
            type="button"
            className="text-xs font-semibold text-muted-foreground"
            onClick={() => setAvatarUrl(undefined)}
          >
            Remove photo
          </button>
        )}
      </div>

      <div className="nv-card flex flex-col gap-6 p-5">
        <ProfileSection title="Personal details" description="Basic info used to personalize your plan">
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              className="h-11 rounded-2xl border border-border/50 bg-white px-4 shadow-[var(--nv-shadow)]"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Age" className="min-w-0">
              <Input
                type="number"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                className="h-11 rounded-2xl border border-border/50 bg-white px-4 shadow-[var(--nv-shadow)]"
              />
            </Field>
            <ProfileSelect
              className="min-w-0"
              compact
              label="Gender"
              value={form.gender}
              onValueChange={(v) => setForm((f) => ({ ...f, gender: v as Gender }))}
              options={GENDER_OPTIONS}
              placeholder="Select"
            />
          </div>
        </ProfileSection>

        <ProfileSection title="Body metrics" description="Height and weight for BMI & calorie targets">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Weight (kg)" className="min-w-0">
              <Input
                type="number"
                value={form.weightKg}
                onChange={(e) => setForm((f) => ({ ...f, weightKg: e.target.value }))}
                className="h-11 rounded-2xl border border-border/50 bg-white px-4 shadow-[var(--nv-shadow)]"
              />
            </Field>
            <Field label="Height (cm)" className="min-w-0">
              <Input
                type="number"
                value={form.heightCm}
                onChange={(e) => setForm((f) => ({ ...f, heightCm: e.target.value }))}
                className="h-11 rounded-2xl border border-border/50 bg-white px-4 shadow-[var(--nv-shadow)]"
              />
            </Field>
          </div>
        </ProfileSection>

        <ProfileSection title="Lifestyle & goals" description="Shapes your daily calorie and macro targets">
          <ProfileSelect
            label="Activity level"
            hint="TDEE multiplier"
            value={form.activityLevel}
            onValueChange={(v) => setForm((f) => ({ ...f, activityLevel: v as ActivityLevel }))}
            options={ACTIVITY_OPTIONS}
            placeholder="How active are you?"
          />

          <ProfileSelect
            label="Nutrition goal"
            hint="Calorie adjustment"
            value={form.goal}
            onValueChange={(v) => setForm((f) => ({ ...f, goal: v as Goal }))}
            options={GOAL_OPTIONS}
            placeholder="What are you working toward?"
          />
        </ProfileSection>
      </div>

      {preview && (
        <div className="mt-4">
          <MetabolicTargetsCard metabolic={preview.metabolic} targets={preview.targets} />
        </div>
      )}

      <Button
        className="mt-5 h-12 w-full rounded-full bg-nv-lime text-base font-bold text-primary-foreground hover:bg-nv-lime/90"
        onClick={handleSave}
      >
        <IconCheck size={18} /> {profile ? "Save profile" : "Get started"}
      </Button>

      {profile && (
        <Button
          variant="ghost"
          className="mt-2 h-11 w-full rounded-full text-muted-foreground"
          onClick={handleReset}
        >
          <IconLogout size={18} /> Reset profile
        </Button>
      )}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
    </div>
  );
}
