// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Graph RAG Query Engine
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Vector search + Graph traversal = Rich context for LLM answers.
// ==============================================================================

import { prisma } from "@/lib/prisma";
import { generateEmbedding, vectorToSql } from "@/lib/ai/embedding";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChunkWithContext {
  content: string;
  nodeName: string;
  nodeType: string;
  chunkIndex: number;
  similarity: number;
  source: "vector" | "graph";
}

export interface RagQueryResult {
  chunks: ChunkWithContext[];
  sourceNodes: { id: string; name: string; type: string }[];
}

// ── Main Query Function ──────────────────────────────────────────────────────

/**
 * Query the Knowledge Graph using Graph RAG.
 *
 * Pipeline:
 * 1. Embed the question → vector(768)
 * 2. Vector search: find top-5 most similar chunks
 * 3. Graph expansion: traverse edges from matched chunks' nodes
 *    → find related nodes → load their top chunks
 * 4. Deduplicate & rank → return top-8 context chunks
 */
export async function queryKnowledge(question: string): Promise<RagQueryResult> {
  // 1. Embed the question
  const questionEmbedding = await generateEmbedding(question);
  const embeddingStr = vectorToSql(questionEmbedding);

  // 2. Vector similarity search (top 5)
  const vectorResults = await prisma.$queryRawUnsafe<
    {
      id: string;
      content: string;
      chunkIndex: number;
      nodeId: string;
      nodeName: string;
      nodeType: string;
      similarity: number;
    }[]
  >(
    `SELECT
       c.id,
       c.content,
       c."chunkIndex",
       c."nodeId",
       n.name as "nodeName",
       n.type as "nodeType",
       1 - (c.embedding <=> $1::vector(768)) as similarity
     FROM kg_chunks c
     JOIN kg_nodes n ON n.id = c."nodeId"
     WHERE c.embedding IS NOT NULL
     ORDER BY c.embedding <=> $1::vector(768)
     LIMIT 5`,
    embeddingStr
  );

  if (vectorResults.length === 0) {
    return { chunks: [], sourceNodes: [] };
  }

  // 3. Graph expansion: find related nodes via edges
  const matchedNodeIds = [...new Set(vectorResults.map((r) => r.nodeId))];

  // Get neighboring nodes (1-hop traversal)
  const neighbors = await prisma.kgEdge.findMany({
    where: {
      OR: [
        { sourceId: { in: matchedNodeIds } },
        { targetId: { in: matchedNodeIds } },
      ],
    },
    select: {
      sourceId: true,
      targetId: true,
      relation: true,
      source: { select: { id: true, name: true, type: true } },
      target: { select: { id: true, name: true, type: true } },
    },
    take: 20,
  });

  // Collect neighbor node IDs (exclude already matched)
  const neighborNodeIds = new Set<string>();
  for (const edge of neighbors) {
    if (!matchedNodeIds.includes(edge.sourceId)) {
      neighborNodeIds.add(edge.sourceId);
    }
    if (!matchedNodeIds.includes(edge.targetId)) {
      neighborNodeIds.add(edge.targetId);
    }
  }

  // Load top chunks from neighbor nodes
  let graphChunks: ChunkWithContext[] = [];
  if (neighborNodeIds.size > 0) {
    const neighborChunkResults = await prisma.$queryRawUnsafe<
      {
        content: string;
        chunkIndex: number;
        nodeName: string;
        nodeType: string;
        similarity: number;
      }[]
    >(
      `SELECT
         c.content,
         c."chunkIndex",
         n.name as "nodeName",
         n.type as "nodeType",
         1 - (c.embedding <=> $1::vector(768)) as similarity
       FROM kg_chunks c
       JOIN kg_nodes n ON n.id = c."nodeId"
       WHERE c."nodeId" = ANY($2::text[])
         AND c.embedding IS NOT NULL
       ORDER BY c.embedding <=> $1::vector(768)
       LIMIT 3`,
      embeddingStr,
      Array.from(neighborNodeIds)
    );

    graphChunks = neighborChunkResults.map((r) => ({
      content: r.content,
      nodeName: r.nodeName,
      nodeType: r.nodeType,
      chunkIndex: r.chunkIndex,
      similarity: Number(r.similarity),
      source: "graph" as const,
    }));
  }

  // 4. Combine vector results + graph results, deduplicate, rank
  const directChunks: ChunkWithContext[] = vectorResults.map((r) => ({
    content: r.content,
    nodeName: r.nodeName,
    nodeType: r.nodeType,
    chunkIndex: r.chunkIndex,
    similarity: Number(r.similarity),
    source: "vector" as const,
  }));

  // Deduplicate by content (prefer direct vector matches)
  const seen = new Set<string>();
  const allChunks: ChunkWithContext[] = [];

  for (const chunk of [...directChunks, ...graphChunks]) {
    const key = chunk.content.slice(0, 100);
    if (!seen.has(key)) {
      seen.add(key);
      allChunks.push(chunk);
    }
  }

  // Sort by similarity (descending) and take top 8
  allChunks.sort((a, b) => b.similarity - a.similarity);
  const finalChunks = allChunks.slice(0, 8);

  // Collect unique source nodes
  const sourceNodeMap = new Map<string, { id: string; name: string; type: string }>();
  for (const r of vectorResults) {
    sourceNodeMap.set(r.nodeId, {
      id: r.nodeId,
      name: r.nodeName,
      type: r.nodeType,
    });
  }
  for (const edge of neighbors) {
    sourceNodeMap.set(edge.source.id, edge.source);
    sourceNodeMap.set(edge.target.id, edge.target);
  }

  return {
    chunks: finalChunks,
    sourceNodes: Array.from(sourceNodeMap.values()),
  };
}
