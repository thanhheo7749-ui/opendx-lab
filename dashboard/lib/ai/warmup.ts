// ==============================================================================
// OpenDX-Lab Dashboard - AI: Ollama Model Warm-up
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Pre-loads the LLM model into Ollama's memory on first request,
// so subsequent calls don't suffer from cold-start latency.
// ==============================================================================

import { chatFast } from "./ollama";

let _warmedUp = false;
let _warmupPromise: Promise<void> | null = null;

/**
 * Ensure the Ollama model is loaded into RAM.
 * Safe to call multiple times — only warms up once.
 * Non-blocking after the first call.
 */
export function ensureWarmup(): void {
  if (_warmedUp || _warmupPromise) return;

  _warmupPromise = (async () => {
    try {
      console.log("[warmup] Loading Ollama model into memory...");
      const start = Date.now();
      await chatFast([{ role: "user", content: "hi" }]);
      _warmedUp = true;
      console.log(`[warmup] Model loaded in ${Date.now() - start}ms`);
    } catch (err) {
      console.warn("[warmup] Failed to warm up Ollama:", err);
      // Don't block — user requests will still work (just slower on first call)
    } finally {
      _warmupPromise = null;
    }
  })();
}
