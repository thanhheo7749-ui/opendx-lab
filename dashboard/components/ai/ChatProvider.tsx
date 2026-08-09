// ==============================================================================
// OpenDX-Lab Dashboard - AI Chat Context Provider
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Lifts chat state + streaming logic to Layout level so it persists
// across route navigations (component mount/unmount won't kill streams).
// ==============================================================================

"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  intent?: string;
  sources?: Array<{ type: string; label: string; ref?: string }>;
  nextActions?: string[];
  timestamp: Date;
}

export type ProgressStep =
  | "classifying"
  | "querying"
  | "searching"
  | "traversing"
  | "health"
  | "workflow"
  | "answering"
  | null;

interface ChatContextType {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  streamingId: string | null;
  currentStep: ProgressStep;
  sendMessage: (question: string) => void;
  clearChat: () => void;
}

// ── Step parser ──────────────────────────────────────────────────────────────

function parseStepMarkers(raw: string): {
  content: string;
  currentStep: ProgressStep;
} {
  const stepRegex = /\[STEP:(\w+)\]/g;
  let currentStep: ProgressStep = null;
  let match: RegExpExecArray | null;

  while ((match = stepRegex.exec(raw)) !== null) {
    currentStep = match[1] as ProgressStep;
  }

  const content = raw.replace(/\[STEP:\w+\]/g, "").trim();
  return { content, currentStep };
}

// ── Context ──────────────────────────────────────────────────────────────────

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ai-chat-messages";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed.map((m: ChatMessage) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
        }
      } catch {}
    }
    return [];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ProgressStep>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Persist messages to sessionStorage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      // Cancel any previous request
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question.trim(),
        timestamp: new Date(),
      };

      const assistantId = `a-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsLoading(true);
      setStreamingId(assistantId);
      setCurrentStep("classifying");

      // 30-second timeout
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question.trim() }),
          signal: controller.signal,
        });

        // Capture intent from header
        const intent = res.headers.get("X-AI-Intent") || undefined;

        // Capture sources and next actions
        let sources: ChatMessage["sources"] | undefined;
        let nextActions: ChatMessage["nextActions"] | undefined;
        try {
          const sourcesRaw = res.headers.get("X-AI-Sources");
          if (sourcesRaw) sources = JSON.parse(sourcesRaw);
          const actionsRaw = res.headers.get("X-AI-NextActions");
          if (actionsRaw) nextActions = JSON.parse(actionsRaw);
        } catch { /* ignore parse errors */ }

        if (intent || sources || nextActions) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, intent, sources, nextActions } : m
            )
          );
        }

        if (!res.ok || !res.body) {
          const errText = await res.text();
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: `❌ Không thể kết nối với AI (Ollama). Hãy kiểm tra dịch vụ Ollama có đang chạy không.\n\nLỗi: ${errText}`,
                    intent,
                  }
                : m
            )
          );
          return;
        }

        // Stream response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          fullContent += decoder.decode(value, { stream: true });

          const { content, currentStep: step } = parseStepMarkers(fullContent);

          if (step) {
            setCurrentStep(step);
          }

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content, intent } : m
            )
          );
        }

        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "⏱️ Yêu cầu đã quá thời gian (30 giây). Hãy thử câu hỏi ngắn hơn hoặc kiểm tra kết nối đến Ollama.",
                  }
                : m
            )
          );
        } else {
          const errMsg =
            err instanceof Error ? err.message : "Không thể kết nối";
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: `❌ Lỗi: ${errMsg}` }
                : m
            )
          );
        }
      } finally {
        setIsLoading(false);
        setStreamingId(null);
        setCurrentStep(null);
        abortRef.current = null;
      }
    },
    [isLoading]
  );

  const clearChat = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setMessages([]);
    setIsLoading(false);
    setStreamingId(null);
    setCurrentStep(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        setInput,
        isLoading,
        streamingId,
        currentStep,
        sendMessage,
        clearChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
