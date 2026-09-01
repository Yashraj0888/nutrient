"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CaptureProvider } from "@/components/capture/CaptureProvider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider delayDuration={200}>
        <CaptureProvider>{children}</CaptureProvider>
      </TooltipProvider>
      <Toaster position="top-center" richColors />
    </ThemeProvider>
  );
}
