// ==============================================================================
// OpenDX-Lab Dashboard - AI: Ollama API Client
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Provides 3 calling modes:
//   - chatFast()   → Intent classification (num_predict:10, temp:0.0, ~0.3s)
//   - chat()       → SQL generation (num_predict:512, temp:0.1)
//   - chatStream() → Answer streaming (num_predict:1024, temp:0.7)
// ==============================================================================

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://ollama:11434";
const DEFAULT_MODEL = process.env.OLLAMA_DEFAULT_MODEL || "qwen2.5:3b";
// Fast model for classification only — 0.5b is enough to pick 1 word from a list
const FAST_MODEL = process.env.OLLAMA_FAST_MODEL || "qwen2.5:0.5b";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaResponse {
  model: string;
  message: { role: string; content: string };
  done: boolean;
}

/**
 * Ultra-fast chat for intent classification.
 * - num_predict: 10 (only need 1-2 tokens)
 * - temperature: 0.0 (deterministic)
 * - Timeout: 5 seconds (fallback to default intent on timeout)
 */
export async function chatFast(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${OLLAMA_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: FAST_MODEL, // Always use fast 0.5b model for classification
        messages,
        stream: false,
        keep_alive: "10m", // Keep model loaded for 10min
        options: {
          temperature: 0.0,
          num_predict: 10,
          num_ctx: 512, // Small context for speed
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${errText}`);
    }

    const data: OllamaResponse = await res.json();
    return data.message.content.trim();
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      console.warn("[chatFast] Timeout after 5s — defaulting to DB_QUERY");
      return "DB_QUERY"; // Safe fallback
    }
    throw err;
  }
}

/**
 * Send a chat completion request to Ollama (non-streaming).
 * Used for SQL generation — precise, low temperature.
 */
export async function chat(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL
): Promise<string> {
  const res = await fetch(`${OLLAMA_API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      keep_alive: "10m",
      options: {
        temperature: 0.1,
        num_predict: 512,
        num_ctx: 2048, // Enough for SQL generation
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama API error (${res.status}): ${errText}`);
  }

  const data: OllamaResponse = await res.json();
  return data.message.content;
}

/**
 * Send a chat completion request to Ollama and return a ReadableStream
 * of text tokens for real-time streaming to the client.
 */
export function chatStream(
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
            options: {
              temperature: 0.7,
              num_predict: 1024,
              num_ctx: 4096,
            },
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
          // Keep the last potentially incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const json = JSON.parse(line) as OllamaResponse;
              if (json.message?.content) {
                controller.enqueue(encoder.encode(json.message.content));
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Process any remaining buffer
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
