"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileSection, ProfileSelect } from "@/components/profile/ProfileSelect";
import { hasLlmApiKey } from "@/lib/llm-settings";
import {
  getProviderMeta,
  LLM_PROVIDERS,
  type LlmProvider,
  type LlmSettings,
} from "@/lib/llm-types";
import { cn } from "@/lib/utils";

const PROVIDER_OPTIONS = LLM_PROVIDERS.map((p) => ({
  value: p.id,
  label: p.label,
  description: p.description,
}));

interface AiProviderSettingsProps {
  value: LlmSettings;
  onChange: (next: LlmSettings) => void;
  showKey: boolean;
  onShowKeyChange: (show: boolean) => void;
}

export function AiProviderSettings({
  value,
  onChange,
  showKey,
  onShowKeyChange,
}: AiProviderSettingsProps) {
  const meta = getProviderMeta(value.provider);
  const configured = hasLlmApiKey(value);

  return (
    <div className="nv-card mt-4 flex flex-col gap-6 p-5">
      <ProfileSection
        title="AI provider (required)"
        description="Paste your own API key to use food scan and coaching. Nothing is pre-filled."
      >
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-xs font-medium",
            configured
              ? "bg-nv-lime/15 text-foreground"
              : "bg-amber-50 text-amber-900"
          )}
        >
          {configured
            ? `Ready — ${meta.label}${value.model.trim() ? ` · ${value.model.trim()}` : ""}`
            : "Required: choose a provider and paste your API key to continue."}
        </div>

        <ProfileSelect
          label="Provider"
          hint="BYOK"
          value={value.provider}
          onValueChange={(v) =>
            onChange({
              ...value,
              provider: v as LlmProvider,
              model: "",
            })
          }
          options={PROVIDER_OPTIONS}
          placeholder="Choose a provider"
        />

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label className="text-sm font-semibold">API key</Label>
            <a
              href={meta.keyHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-muted-foreground underline-offset-2 hover:underline"
            >
              Get a key
            </a>
          </div>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              autoComplete="off"
              spellCheck={false}
              value={value.apiKey}
              onChange={(e) => onChange({ ...value, apiKey: e.target.value })}
              placeholder={meta.keyPlaceholder}
              required
              className="h-11 rounded-2xl border border-border/50 bg-white px-4 pr-16 shadow-[var(--nv-shadow)]"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground"
              onClick={() => onShowKeyChange(!showKey)}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label className="text-sm font-semibold">Model</Label>
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground">Optional</span>
          </div>
          <Input
            value={value.model}
            onChange={(e) => onChange({ ...value, model: e.target.value })}
            placeholder={meta.defaultModel}
            className="h-11 rounded-2xl border border-border/50 bg-white px-4 shadow-[var(--nv-shadow)]"
          />
          <p className="text-[11px] text-muted-foreground">{meta.modelHint}</p>
        </div>
      </ProfileSection>
    </div>
  );
}
