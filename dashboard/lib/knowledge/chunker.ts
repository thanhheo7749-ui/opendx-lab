// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Text Chunking Utilities
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Splits text into overlapping chunks suitable for embedding.
// Respects sentence boundaries to avoid cutting mid-sentence.
// ==============================================================================

export interface TextChunk {
  content: string;
  index: number;
  tokenCount: number;
}

/**
 * Rough token count estimation.
 * Vietnamese text averages ~1.5 chars per token for multilingual models.
 * English averages ~4 chars per token.
 * We use a blended estimate of ~2.5 chars per token.
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 2.5);
}

/**
 * Split text into sentences using common delimiters.
 * Handles Vietnamese punctuation (., !, ?, ;) and newlines.
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace,
  // or double newlines (paragraph breaks)
  const raw = text.split(/(?<=[.!?;])\s+|\n{2,}/);
  return raw.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Chunk text into overlapping segments for embedding.
 *
 * Strategy:
 * 1. Split text into sentences
 * 2. Accumulate sentences until reaching maxTokens
 * 3. Create chunk, then backtrack by `overlap` tokens for the next chunk
 *
 * @param text - Full text to chunk
 * @param maxTokens - Maximum tokens per chunk (default: 512)
 * @param overlapTokens - Token overlap between consecutive chunks (default: 64)
 * @returns Array of text chunks with metadata
 */
export function chunkText(
  text: string,
  maxTokens: number = 512,
  overlapTokens: number = 64
): TextChunk[] {
  const cleanText = text.replace(/\r\n/g, "\n").trim();

  if (!cleanText) return [];

  // If text fits in one chunk, return as-is
  const totalTokens = estimateTokenCount(cleanText);
  if (totalTokens <= maxTokens) {
    return [
      {
        content: cleanText,
        index: 0,
        tokenCount: totalTokens,
      },
    ];
  }

  const sentences = splitSentences(cleanText);
  const chunks: TextChunk[] = [];
  let currentSentences: string[] = [];
  let currentTokens = 0;
  let chunkIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = estimateTokenCount(sentence);

    // If a single sentence exceeds maxTokens, split it by characters
    if (sentenceTokens > maxTokens) {
      // Flush current buffer first
      if (currentSentences.length > 0) {
        const content = currentSentences.join(" ");
        chunks.push({
          content,
          index: chunkIndex++,
          tokenCount: estimateTokenCount(content),
        });
        currentSentences = [];
        currentTokens = 0;
      }

      // Split long sentence into fixed-size pieces
      const maxChars = maxTokens * 2.5;
      for (let j = 0; j < sentence.length; j += maxChars - overlapTokens * 2.5) {
        const piece = sentence.slice(j, j + maxChars).trim();
        if (piece) {
          chunks.push({
            content: piece,
            index: chunkIndex++,
            tokenCount: estimateTokenCount(piece),
          });
        }
      }
      continue;
    }

    // Check if adding this sentence would exceed the limit
    if (currentTokens + sentenceTokens > maxTokens && currentSentences.length > 0) {
      // Emit current chunk
      const content = currentSentences.join(" ");
      chunks.push({
        content,
        index: chunkIndex++,
        tokenCount: estimateTokenCount(content),
      });

      // Calculate overlap: keep last few sentences that fit within overlapTokens
      const overlapSentences: string[] = [];
      let overlapCount = 0;
      for (let k = currentSentences.length - 1; k >= 0; k--) {
        const st = estimateTokenCount(currentSentences[k]);
        if (overlapCount + st > overlapTokens) break;
        overlapSentences.unshift(currentSentences[k]);
        overlapCount += st;
      }

      currentSentences = overlapSentences;
      currentTokens = overlapCount;
    }

    currentSentences.push(sentence);
    currentTokens += sentenceTokens;
  }

  // Flush remaining sentences
  if (currentSentences.length > 0) {
    const content = currentSentences.join(" ");
    chunks.push({
      content,
      index: chunkIndex,
      tokenCount: estimateTokenCount(content),
    });
  }

  return chunks;
}
