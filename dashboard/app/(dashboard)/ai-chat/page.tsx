// ==============================================================================
// OpenDX-Lab Dashboard - AI Chat Page (Agentic AI)
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Features:
//   - Chat state lives in ChatProvider (layout level) → survives navigation
//   - [STEP:...] progress markers parsed from stream
//   - Intent badge on assistant messages
//   - Persistent compact suggestion chips
// ==============================================================================

"use client";

import { useRef, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Loader2,
  Trash2,
  Database,
  Activity,
  Cog,
  Search,
  MessageSquare,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { useChatContext, type ChatMessage, type ProgressStep } from "@/components/ai/ChatProvider";
import { SourceSummary } from "@/components/ai/SourceSummary";
import { NextActionChips } from "@/components/ai/NextActionChips";

// ---------------------------------------------------------------------------
// Step label mappings
// ---------------------------------------------------------------------------
const STEP_LABELS: Record<string, { icon: string; text: string }> = {
  classifying: { icon: "🔍", text: "Đang phân tích câu hỏi..." },
  querying: { icon: "📊", text: "Đang truy vấn dữ liệu..." },
  searching: { icon: "🔎", text: "Đang tìm kiếm tri thức..." },
  traversing: { icon: "🧠", text: "Đang duyệt đồ thị tri thức..." },
  health: { icon: "🏥", text: "Đang kiểm tra hệ thống..." },
  workflow: { icon: "⚙️", text: "Đang kích hoạt quy trình..." },
  answering: { icon: "💬", text: "Đang trả lời..." },
};

// Intent badge config
const INTENT_BADGES: Record<string, { icon: typeof Database; label: string; color: string }> = {
  DB_QUERY: { icon: Database, label: "Truy vấn DB", color: "text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" },
  KNOWLEDGE_QUERY: { icon: BookOpen, label: "Knowledge", color: "text-violet-500 bg-violet-50 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800" },
  HEALTH_CHECK: { icon: Activity, label: "Health Check", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800" },
  WORKFLOW: { icon: Cog, label: "Workflow", color: "text-amber-500 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800" },
  GREETING: { icon: MessageSquare, label: "Chào hỏi", color: "text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800" },
  OUT_OF_DOMAIN: { icon: ShieldCheck, label: "Guardrail", color: "text-red-500 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800" },
};

// ---------------------------------------------------------------------------
// Quick suggestion questions (covers all intent types)
// ---------------------------------------------------------------------------
const SUGGESTIONS = [
  "Doanh thu hôm nay bao nhiêu?",
  "Top 5 sản phẩm bán chạy nhất?",
  "Chiến dịch quảng cáo nào hiệu quả nhất?",
  "Hệ thống có dịch vụ nào bị lỗi không?",
  "Tồn kho sản phẩm nào sắp hết?",
  "Chào bạn, bạn có thể giúp gì?",
];

// ---------------------------------------------------------------------------
// ProgressIndicator component
// ---------------------------------------------------------------------------
function ProgressIndicator({ step }: { step: ProgressStep }) {
  if (!step || step === "answering") return null;

  const info = STEP_LABELS[step];
  if (!info) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
      <span>{info.icon}</span>
      <span>{info.text}</span>
      <Loader2 className="w-3 h-3 animate-spin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// IntentBadge component
// ---------------------------------------------------------------------------
function IntentBadge({ intent }: { intent?: string }) {
  if (!intent) return null;

  const badge = INTENT_BADGES[intent];
  if (!badge) return null;

  const Icon = badge.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${badge.color}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {badge.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// ChatBubble component
// ---------------------------------------------------------------------------
function ChatBubble({
  msg,
  isStreaming,
  currentStep,
}: {
  msg: ChatMessage;
  isStreaming?: boolean;
  currentStep?: ProgressStep;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} group`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200/50 dark:border-purple-700/50 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white"
            : "bg-muted border border-border text-foreground"
        }`}
      >
        {/* Intent badge */}
        {!isUser && msg.intent && (
          <div className="mb-1.5">
            <IntentBadge intent={msg.intent} />
          </div>
        )}

        {/* Progress indicator while streaming */}
        {isStreaming && currentStep && currentStep !== "answering" && (
          <div className="mb-2">
            <ProgressIndicator step={currentStep} />
          </div>
        )}

        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {msg.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-purple-500 ml-0.5 animate-pulse rounded-sm" />
          )}
        </div>

        {msg.sql && (
          <details className="mt-2 group/sql">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1 transition-colors">
              <Database className="w-3 h-3 text-indigo-500" /> SQL Query
            </summary>
            <pre className="mt-1.5 text-xs bg-gray-900 text-emerald-400 p-2.5 rounded-lg overflow-x-auto font-mono border border-gray-800 shadow-inner">
              {msg.sql}
            </pre>
          </details>
        )}

        {/* Source summaries */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <SourceSummary sources={msg.sources} />
        )}

        {/* Next action chips */}
        {!isUser && msg.nextActions && msg.nextActions.length > 0 && (
          <NextActionChips
            actions={msg.nextActions}
            onSelect={(action) => {
              // Access setInput through the global context - we'll use a workaround
              const input = document.querySelector<HTMLInputElement>('#ai-chat-input');
              if (input) {
                // Dispatch a custom event to update the input
                input.value = action;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.focus();
              }
            }}
          />
        )}

        <p className={`text-[10px] mt-1.5 ${isUser ? "text-indigo-200/80" : "text-muted-foreground"}`}>
          {msg.timestamp.toLocaleTimeString("vi-VN")}
        </p>
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-200/50 dark:border-blue-700/50 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page — consumes ChatProvider (state lives in layout, survives navigation)
// ---------------------------------------------------------------------------
export default function AIChatPage() {
  const { t } = useTranslation();
  const {
    messages,
    input,
    setInput,
    isLoading,
    streamingId,
    currentStep,
    sendMessage,
    clearChat,
  } = useChatContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-700">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            {t("aiChat.title")}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("aiChat.subtitle")}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Xóa đoạn chat
          </button>
        )}
      </div>

      {/* Chat Card */}
      <Card className="shadow-sm h-[calc(100vh-14rem)]">
        <CardContent className="flex flex-col h-full pt-4 pb-4">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {messages.length === 0 ? (
              /* Empty state — large centered suggestions */
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-200 dark:border-purple-700 flex items-center justify-center mb-6 animate-pulse">
                  <Sparkles className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  DX-OS Agent
                </h2>
                <p className="text-muted-foreground max-w-md text-sm mb-8">
                  Trợ lý AI thông minh — tra cứu dữ liệu kinh doanh, phân tích
                  doanh thu, tồn kho, quảng cáo và kiểm tra hệ thống.
                </p>

                {/* Quick suggestions grid */}
                <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-left px-3 py-2.5 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800 rounded-xl hover:bg-indigo-100/50 dark:hover:bg-indigo-900/40 hover:border-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm font-medium"
                    >
                      <Sparkles className="w-3 h-3 inline mr-1.5 text-indigo-500" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  isStreaming={msg.id === streamingId}
                  currentStep={msg.id === streamingId ? currentStep : undefined}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compact suggestion chips — always visible when messages exist */}
          {messages.length > 0 && (
            <div className="flex gap-1.5 pt-3 pb-1 overflow-x-auto scrollbar-none">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  disabled={isLoading}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[10px] text-indigo-600 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/50 rounded-full hover:bg-indigo-100/80 dark:hover:bg-indigo-900/40 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap font-medium"
                >
                  <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 pt-2 border-t border-border"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? t("aiChat.thinking") : t("aiChat.placeholder")}
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 disabled:opacity-50 transition-all"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-30 rounded-xl px-4 transition-all hover:scale-105 active:scale-95 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
