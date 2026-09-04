"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProfileSelect } from "@/components/profile/ProfileSelect";
import { IconCheck } from "@/components/icons/nutrivision-icons";
import {
  getLlmSettings,
  hasLlmApiKey,
  saveLlmSettings,
} from "@/lib/llm-settings";
import { subscribeToUpdates } from "@/lib/storage";
import {
  getProviderMeta,
  LLM_PROVIDERS,
  type LlmProvider,
  type LlmSettings,
} from "@/lib/llm-types";

const PROVIDER_OPTIONS = LLM_PROVIDERS.map((p) => ({
  value: p.id,
  label: p.label,
  description: p.description,
}));

interface ApiKeyGateContextValue {
  hasKey: boolean;
  /** Open the API key sheet (e.g. when user tries to scan without a key). */
  requestApiKey: () => void;
}

const ApiKeyGateContext = createContext<ApiKeyGateContextValue | null>(null);

export function useApiKeyGate(): ApiKeyGateContextValue {
  const ctx = useContext(ApiKeyGateContext);
  if (!ctx) {
    throw new Error("useApiKeyGate must be used within <ApiKeyGateProvider>");
  }
  return ctx;
}

export function ApiKeyGateProvider({ children }: { children: React.ReactNode }) {
  const [hasKey, setHasKey] = useState(false);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<LlmSettings>(() => getLlmSettings());
  const [showKey, setShowKey] = useState(false);

  const sync = useCallback(() => {
    const next = getLlmSettings();
    setSettings(next);
    const ok = hasLlmApiKey(next);
    setHasKey(ok);
    return ok;
  }, []);

  // Boot: show gate until a key is saved.
  useEffect(() => {
    const ok = sync();
    setReady(true);
    if (!ok) setOpen(true);
  }, [sync]);

  useEffect(() => {
    return subscribeToUpdates(() => {
      const ok = sync();
      if (ok) setOpen(false);
    });
  }, [sync]);

  const requestApiKey = useCallback(() => {
    sync();
    setOpen(true);
  }, [sync]);

  const value = useMemo(
    () => ({ hasKey, requestApiKey }),
    [hasKey, requestApiKey]
  );

  const meta = getProviderMeta(settings.provider);

  function handleSave() {
    if (!settings.apiKey.trim()) {
      toast.error("Paste your API key to unlock scanning and AI coaching.");
      return;
    }
    saveLlmSettings({
      provider: settings.provider,
      apiKey: settings.apiKey.trim(),
      model: settings.model.trim(),
    });
    setHasKey(true);
    setOpen(false);
    toast.success(`${meta.label} key saved — AI features unlocked.`);
  }

  function handleBrowse() {
    setOpen(false);
    toast.message("You can browse the app. Add an API key to scan meals and use AI.");
  }

  return (
    <ApiKeyGateContext.Provider value={value}>
      {children}

      {ready && (
        <Drawer
          open={open && !hasKey}
          onOpenChange={(next) => {
            // Allow dismiss to browse; reopen on next boot / AI attempt.
            if (!next) handleBrowse();
            else setOpen(true);
          }}
        >
          <DrawerContent className="mx-auto max-w-lg pb-safe">
            <DrawerHeader className="text-left">
              <DrawerTitle>Add your AI API key</DrawerTitle>
              <DrawerDescription>
                No key is included with the app. Paste your Gemini (or other provider) key once —
                it stays on this device. You can browse without it, but scanning and AI stay locked.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-4 px-4 pb-2">
              <ProfileSelect
                label="Provider"
                hint="BYOK"
                value={settings.provider}
                onValueChange={(v) =>
                  setSettings((s) => ({
                    ...s,
                    provider: v as LlmProvider,
                    model: "",
                  }))
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
                    value={settings.apiKey}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, apiKey: e.target.value }))
                    }
                    placeholder={meta.keyPlaceholder}
                    className="h-11 rounded-2xl border border-border/50 bg-white px-4 pr-16 shadow-[var(--nv-shadow)]"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground"
                    onClick={() => setShowKey((v) => !v)}
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <Label className="text-sm font-semibold">Model</Label>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                    Optional
                  </span>
                </div>
                <Input
                  value={settings.model}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, model: e.target.value }))
                  }
                  placeholder={meta.defaultModel}
                  className="h-11 rounded-2xl border border-border/50 bg-white px-4 shadow-[var(--nv-shadow)]"
                />
              </div>
            </div>

            <DrawerFooter className="gap-2">
              <Button
                className="h-12 w-full rounded-full bg-nv-lime font-bold text-primary-foreground hover:bg-nv-lime/90"
                onClick={handleSave}
              >
                <IconCheck size={18} />
                Save & unlock AI
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-full rounded-full text-muted-foreground"
                onClick={handleBrowse}
              >
                Browse without AI
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </ApiKeyGateContext.Provider>
  );
}
