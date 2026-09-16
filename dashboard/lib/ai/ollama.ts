// ==============================================================================
// ShopWise Dashboard - AI: LLM Router Client (OpenAI-compatible)
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Supports both 9Router (cloud) and Ollama (local) as backends.
// Uses OpenAI-compatible /v1/chat/completions API.
//
// Provides 3 calling modes:
//   - chatFast()   → Intent classification (max_tokens:10, temp:0.0)
//   - chat()       → SQL generation / analysis (max_tokens:512, temp:0.1)
//   - chatStream() → Answer streaming (max_tokens:1024, temp:0.7)
// ==============================================================================

// ── Configuration ────────────────────────────────────────────────────────────

// If OPENAI_API_KEY is set, use 9Router/OpenAI-compatible API
// Otherwise fall back to Ollama local API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.9router.com/v1";

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://ollama:11434";

// Model names — adjust based on your 9Router config
const DEFAULT_MODEL = process.env.LLM_DEFAULT_MODEL || process.env.OLLAMA_DEFAULT_MODEL || "gpt-4o-mini";
const FAST_MODEL = process.env.LLM_FAST_MODEL || process.env.OLLAMA_FAST_MODEL || "gpt-4o-mini";

// Detect which backend to use
const USE_CLOUD = !!OPENAI_API_KEY;

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface OllamaResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

// ── Cloud API (9Router / OpenAI-compatible) ──────────────────────────────────

async function cloudChat(
  messages: ChatMessage[],
  options: { model?: string; temperature?: number; max_tokens?: number; timeout?: number } = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    max_tokens = 1024,
    timeout = 30000,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM API error (${res.status}): ${errText}`);
    }

    const data: OpenAIResponse = await res.json();
    return data.choices[0]?.message?.content?.trim() || "";
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`LLM timeout (${timeout / 1000}s)`);
    }
    throw err;
  }
}

function cloudChatStream(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: 1024,
            stream: true,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          controller.enqueue(encoder.encode(`Lỗi kết nối LLM: ${errText}`));
          controller.close();
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode("Không thể đọc phản hồi từ LLM."));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // Skip malformed SSE
            }
          }
        }

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n❌ Lỗi: ${message}`));
        controller.close();
      }
    },
  });
}

// ── Ollama Local API ─────────────────────────────────────────────────────────

async function ollamaChat(
  messages: ChatMessage[],
  options: { model?: string; temperature?: number; num_predict?: number; num_ctx?: number; timeout?: number } = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    num_predict = 1024,
    num_ctx = 4096,
    timeout = 30000,
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        keep_alive: "10m",
        options: { temperature, num_predict, num_ctx },
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${errText}`);
    }

    const data: OllamaResponse = await res.json();
    return data.message.content.trim();
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Ollama timeout (${timeout / 1000}s)`);
    }
    throw err;
  }
}

function ollamaChatStream(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const res = await fetch(`${OLLAMA_API_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
            keep_alive: "10m",
            options: { temperature: 0.7, num_predict: 1024, num_ctx: 4096 },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          controller.enqueue(encoder.encode(`Lỗi kết nối Ollama: ${errText}`));
          controller.close();
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode("Không thể đọc phản hồi từ Ollama."));
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line) as OllamaResponse;
              if (json.message?.content) {
                controller.enqueue(encoder.encode(json.message.content));
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        if (buffer.trim()) {
          try {
            const json = JSON.parse(buffer) as OllamaResponse;
            if (json.message?.content) {
              controller.enqueue(encoder.encode(json.message.content));
            }
          } catch {
            // Ignore
          }
        }

        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n❌ Lỗi: ${message}`));
        controller.close();
      }
    },
  });
}

// ── Public API (auto-selects backend) ────────────────────────────────────────

/**
 * Ultra-fast chat for intent classification.
 * - max_tokens/num_predict: 10
 * - temperature: 0.0 (deterministic)
 */
export async function chatFast(
  messages: ChatMessage[],
  model: string = FAST_MODEL
): Promise<string> {
  if (USE_CLOUD) {
    try {
      return await cloudChat(messages, { model, temperature: 0.0, max_tokens: 10, timeout: 15000 });
    } catch (err) {
      console.warn("[chatFast] Cloud LLM failed, falling back to Ollama:", err);
      // Fallback to Ollama
    }
  }

  // Ollama fallback
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const result = await ollamaChat(messages, {
      model: process.env.OLLAMA_FAST_MODEL || "qwen2.5:0.5b",
      temperature: 0.0,
      num_predict: 10,
      num_ctx: 512,
      timeout: 15000,
    });
    clearTimeout(timeout);
    return result;
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("[chatFast] Timeout — defaulting to DB_QUERY");
      return "DB_QUERY";
    }
    throw err;
  }
}

/**
 * Standard chat for SQL generation and analysis.
 * - max_tokens/num_predict: 512
 * - temperature: 0.1 (precise)
 */
export async function chat(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  if (USE_CLOUD) {
    try {
      return await cloudChat(messages, { model, temperature: 0.1, max_tokens: 512, timeout: 30000 });
    } catch (err) {
      console.warn("[chat] Cloud LLM failed, falling back to Ollama:", err);
    }
  }

  return ollamaChat(messages, {
    model: process.env.OLLAMA_DEFAULT_MODEL || "qwen2.5:3b",
    temperature: 0.1,
    num_predict: 512,
    num_ctx: 2048,
    timeout: 30000,
  });
}

/**
 * Streaming chat for real-time answer generation.
 * Returns ReadableStream<Uint8Array> for SSE response.
 */
export function chatStream(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): ReadableStream<Uint8Array> {
  if (USE_CLOUD) {
    return cloudChatStream(messages, model);
  }

  return ollamaChatStream(messages, process.env.OLLAMA_DEFAULT_MODEL || "qwen2.5:3b");
}

/**
 * Check which backend is active.
 */
export function getLLMBackend(): { type: "cloud" | "ollama"; model: string } {
  return {
    type: USE_CLOUD ? "cloud" : "ollama",
    model: DEFAULT_MODEL,
  };
}
