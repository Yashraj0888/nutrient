"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconSparkle } from "@/components/icons/nutrivision-icons";
import { buildNutritionCoachContext } from "@/lib/nutrition-coach";
import { hasLlmApiKey, llmFetch } from "@/lib/llm-settings";
import { useApiKeyGate } from "@/components/ai/ApiKeyGate";
import type { DailyLog, DailyTotals, InsightsResult, NutrientTargets, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface InsightsCoachProps {
  date: string;
  log: DailyLog;
  totals: DailyTotals;
  targets: NutrientTargets;
  profile: UserProfile;
}

function AssistantBubble({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-chat-role="assistant"
      className={cn(
        "insights-message mr-auto max-w-[92%] rounded-2xl bg-white px-3.5 py-2.5 text-sm leading-relaxed text-foreground shadow-(--nv-shadow)",
        className
      )}
    >
      {children}
    </div>
  );
}

export function InsightsCoach({ date, log, totals, targets, profile }: InsightsCoachProps) {
  const { requestApiKey } = useApiKeyGate();
  const context = useMemo(
    () => buildNutritionCoachContext(date, log, totals, targets, profile),
    [date, log, totals, targets, profile]
  );

  const [summary, setSummary] = useState<InsightsResult | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);
  const wasChatLoadingRef = useRef(false);

  const fetchSummary = useCallback(async () => {
    if (!hasLlmApiKey()) return;
    setSummaryLoading(true);
    try {
      const res = await llmFetch("/api/generate-insights", {
        method: "POST",
        body: JSON.stringify(context),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not load summary.");
      setSummary(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load today's summary.");
    } finally {
      setSummaryLoading(false);
    }
  }, [context]);

  const scrollChatToTarget = useCallback((preferAssistant: boolean, smooth = false) => {
    const container = chatScrollRef.current;
    if (!container) return;

    const run = () => {
      let top = container.scrollHeight;

      if (preferAssistant) {
        const assistants = container.querySelectorAll<HTMLElement>('[data-chat-role="assistant"]');
        const last = assistants[assistants.length - 1];
        if (last) {
          const assistantBottom = last.offsetTop + last.offsetHeight;
          top = Math.max(0, assistantBottom - container.clientHeight + 16);
        }
      }

      container.scrollTo({
        top,
        behavior: smooth ? "smooth" : "auto",
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
  }, []);

  useEffect(() => {
    if (log.meals.length === 0 || fetchedRef.current) return;
    fetchedRef.current = true;
    void fetchSummary();
  }, [log.meals.length, fetchSummary]);

  useEffect(() => {
    if (messages.length === 0 && !chatLoading) return;

    const lastMessage = messages[messages.length - 1];
    const assistantJustArrived =
      wasChatLoadingRef.current && !chatLoading && lastMessage?.role === "assistant";
    wasChatLoadingRef.current = chatLoading;

    scrollChatToTarget(assistantJustArrived, assistantJustArrived);
  }, [messages, chatLoading, scrollChatToTarget]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || chatLoading) return;

    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setChatLoading(true);

    try {
      const res = await llmFetch("/api/insights-chat", {
        method: "POST",
        body: JSON.stringify({ question: q, history: messages, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not get an answer.");
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setMessages((prev) => prev.slice(0, -1));
      setQuestion(q);
    } finally {
      setChatLoading(false);
    }
  }

  if (log.meals.length === 0) {
    return (
      <div className="nv-card px-4 py-12 text-center text-sm text-muted-foreground">
        Log meals today to get your daily summary and ask nutrition questions.
      </div>
    );
  }

  if (!hasLlmApiKey()) {
    return (
      <div className="nv-card flex flex-col items-center gap-3 px-4 py-12 text-center text-sm text-muted-foreground">
        <p>Add your AI API key to unlock daily insights and coaching.</p>
        <Button
          type="button"
          className="rounded-full bg-nv-lime font-bold text-primary-foreground hover:bg-nv-lime/90"
          onClick={requestApiKey}
        >
          Add API key
        </Button>
      </div>
    );
  }

  return (
    <div className="insights-coach flex min-h-0 flex-1 flex-col">
      <div
        ref={chatScrollRef}
        className="insights-messages min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
      >
        <div className="flex flex-col gap-2.5 pb-2">
          {summaryLoading ? (
            <AssistantBubble>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-nv-lime/15 text-nv-lime-dark">
                  <IconSparkle size={14} />
                </span>
                <p className="text-xs font-semibold text-muted-foreground">{context.localDateLabel}</p>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
                <Skeleton className="h-4 w-4/6 rounded-lg" />
              </div>
            </AssistantBubble>
          ) : summary ? (
            <AssistantBubble>
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-nv-lime/15 text-nv-lime-dark">
                  <IconSparkle size={14} />
                </span>
                <p className="text-xs font-semibold text-muted-foreground">{context.localDateLabel}</p>
              </div>
              <p>{summary.summary}</p>
              {summary.insights.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {summary.insights.map((insight, i) => (
                    <div
                      key={i}
                      className="insights-message rounded-xl bg-secondary/70 px-3 py-2 text-[13px] leading-snug"
                    >
                      {insight.message}
                    </div>
                  ))}
                </div>
              )}
            </AssistantBubble>
          ) : (
            <AssistantBubble>
              <p className="mb-2 text-muted-foreground">Could not load today&apos;s summary.</p>
              <Button
                onClick={() => void fetchSummary()}
                size="sm"
                className="rounded-full bg-nv-lime font-bold text-primary-foreground"
              >
                Try again
              </Button>
            </AssistantBubble>
          )}

          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}-${msg.content.slice(0, 24)}`}
              data-chat-role={msg.role}
              className={cn(
                "insights-message max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-auto bg-nv-lime/20 text-foreground"
                  : "mr-auto bg-white text-foreground shadow-(--nv-shadow)"
              )}
            >
              {msg.content}
            </div>
          ))}

          {chatLoading && (
            <AssistantBubble className="text-muted-foreground">Thinking…</AssistantBubble>
          )}

          <div ref={messagesEndRef} aria-hidden className="h-px shrink-0" />
        </div>
      </div>

      <div className="insights-chat-input fixed inset-x-0 z-30 border-t border-border/60 bg-background">
        <form
          onSubmit={(e) => void handleAsk(e)}
          className="mobile-container flex min-w-0 items-center gap-2 overflow-hidden px-5 py-2.5"
        >
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about your meals…"
            className="h-10 min-w-0 flex-1 rounded-full border border-input bg-secondary px-4 text-sm"
            disabled={chatLoading}
          />
          <Button
            type="submit"
            disabled={chatLoading || !question.trim()}
            size="sm"
            className="h-10 shrink-0 rounded-full bg-nv-lime px-4 font-bold text-primary-foreground hover:bg-nv-lime/90"
          >
            Ask
          </Button>
        </form>
      </div>
    </div>
  );
}
