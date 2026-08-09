// ==============================================================================
// OpenDX-Lab Dashboard - AI: Embedding API Client (Ollama)
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Generates vector embeddings using nomic-embed-text via Ollama.
// Used by the Knowledge Graph system for semantic search (Graph RAG).
// ==============================================================================

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://ollama:11434";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "nomic-embed-text";

interface OllamaEmbeddingResponse {
  embedding: number[];
}

/**
 * Generate a vector embedding for a single text string.
 * Uses nomic-embed-text (768 dimensions) via Ollama.
 *
 * @param text - Text to embed (will be truncated to ~8K tokens by model)
 * @returns 768-dimensional float array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_API_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      prompt: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama embedding error (${res.status}): ${errText}`);
  }

  const data: OllamaEmbeddingResponse = await res.json();
  return data.embedding;
}

/**
 * Generate embeddings for multiple texts in sequence.
 * (Ollama doesn't support batch embedding natively, so we call sequentially.)
 *
 * @param texts - Array of texts to embed
 * @returns Array of 768-dimensional float arrays
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const embedding = await generateEmbedding(text);
    embeddings.push(embedding);
  }
  return embeddings;
}

/**
 * Compute cosine similarity between two vectors.
 * Returns a value between -1 (opposite) and 1 (identical).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Format a float array as a PostgreSQL vector literal string.
 * Used for raw SQL queries with pgvector.
 *
 * @example vectorToSql([1.0, 2.0, 3.0]) => "[1,2,3]"
 */
export function vectorToSql(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
