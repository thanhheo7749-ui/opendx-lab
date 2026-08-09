// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Graph Builder (Ingestion Pipeline)
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Core pipeline: Document → Chunks → Embeddings → Entities → Graph
// ==============================================================================

import { prisma } from "@/lib/prisma";
import { generateEmbedding, vectorToSql, cosineSimilarity } from "@/lib/ai/embedding";
import { chat } from "@/lib/ai/ollama";
import { chunkText } from "./chunker";

// ── Types ────────────────────────────────────────────────────────────────────

export interface IngestParams {
  name: string;
  content: string;
  source: "upload" | "wikijs" | "system";
  sourceUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface IngestResult {
  nodeId: string;
  chunksCreated: number;
  entitiesExtracted: number;
  edgesCreated: number;
}

interface ExtractedEntity {
  type: string;
  name: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const VALID_ENTITY_TYPES = [
  "DEPARTMENT",
  "PROCESS",
  "POLICY",
  "SERVICE",
  "TOPIC",
  "ROLE",
];

const SIMILARITY_THRESHOLD = 0.7;

// ── Entity Extraction Prompt ─────────────────────────────────────────────────

const ENTITY_EXTRACTION_PROMPT = `You are an entity extractor for an enterprise operations platform called OpenDX-Lab.

From the given text, extract important entities. Each entity must have a "type" and a "name".

Valid types:
- DEPARTMENT: company departments (e.g., "Phòng Kỹ thuật", "HR", "Engineering")
- PROCESS: business processes or SOPs (e.g., "Tuyển dụng", "Onboarding", "Code Review")
- POLICY: company policies or rules (e.g., "Chính sách nghỉ phép", "Quy định lương")
- SERVICE: system services or tools (e.g., "Keycloak", "Mattermost", "Wiki.js", "PostgreSQL")
- TOPIC: general topics or themes (e.g., "Bảo mật", "DevOps", "Quản lý dự án")
- ROLE: job roles or titles (e.g., "Manager", "Senior Dev", "HR Lead", "CTO")

Output ONLY a JSON array, no explanation:
[{"type": "DEPARTMENT", "name": "Engineering"}, {"type": "PROCESS", "name": "Onboarding"}]

If no entities found, output: []`;

// ── Main Ingestion Function ──────────────────────────────────────────────────

/**
 * Ingest a document into the Knowledge Graph.
 *
 * Pipeline:
 * 1. Create KgNode (type=DOCUMENT)
 * 2. Chunk text → create KgChunk records with embeddings
 * 3. Extract entities via LLM → create/find KgNode for each
 * 4. Create KgEdge relationships (MENTIONS, etc.)
 * 5. Find semantically similar existing documents → create RELATES_TO edges
 */
export async function ingestDocument(params: IngestParams): Promise<IngestResult> {
  const { name, content, source, sourceUrl, metadata = {} } = params;

  // 1. Create the document node
  const docNode = await prisma.kgNode.create({
    data: {
      type: "DOCUMENT",
      name,
      description: content.slice(0, 200) + (content.length > 200 ? "..." : ""),
      source,
      sourceUrl,
      metadata: metadata as object,
    },
  });

  // 2. Chunk the text and create chunks with embeddings
  const textChunks = chunkText(content);
  let chunksCreated = 0;

  for (const chunk of textChunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);
      const embeddingStr = vectorToSql(embedding);

      // Use raw SQL because Prisma doesn't support vector type natively
      await prisma.$executeRawUnsafe(
        `INSERT INTO kg_chunks (id, "nodeId", content, embedding, "chunkIndex", "tokenCount", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3::vector(768), $4, $5, NOW())`,
        docNode.id,
        chunk.content,
        embeddingStr,
        chunk.index,
        chunk.tokenCount
      );
      chunksCreated++;
    } catch (err) {
      console.error(`[graph-builder] Failed to embed chunk ${chunk.index}:`, err);
      // Create chunk without embedding as fallback
      await prisma.kgChunk.create({
        data: {
          nodeId: docNode.id,
          content: chunk.content,
          chunkIndex: chunk.index,
          tokenCount: chunk.tokenCount,
        },
      });
      chunksCreated++;
    }
  }

  // 3. Extract entities from the document (use first 2000 chars for speed)
  const entities = await extractEntities(content.slice(0, 2000));
  let entitiesExtracted = 0;
  let edgesCreated = 0;

  for (const entity of entities) {
    try {
      // Find or create entity node
      const entityNode = await findOrCreateEntity(entity);
      entitiesExtracted++;

      // Create edge: DOCUMENT --MENTIONS--> ENTITY
      await prisma.kgEdge.upsert({
        where: {
          sourceId_targetId_relation: {
            sourceId: docNode.id,
            targetId: entityNode.id,
            relation: "MENTIONS",
          },
        },
        create: {
          sourceId: docNode.id,
          targetId: entityNode.id,
          relation: "MENTIONS",
          weight: 1.0,
        },
        update: {
          weight: 1.0,
        },
      });
      edgesCreated++;
    } catch (err) {
      console.error(`[graph-builder] Failed to process entity:`, entity, err);
    }
  }

  // 4. Find semantically similar existing documents → create RELATES_TO edges
  try {
    const relatedEdges = await findAndLinkSimilarDocuments(docNode.id);
    edgesCreated += relatedEdges;
  } catch (err) {
    console.error("[graph-builder] Failed to find similar documents:", err);
  }

  return {
    nodeId: docNode.id,
    chunksCreated,
    entitiesExtracted,
    edgesCreated,
  };
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Extract entities from text using LLM.
 */
async function extractEntities(text: string): Promise<ExtractedEntity[]> {
  try {
    const raw = await chat([
      { role: "system", content: ENTITY_EXTRACTION_PROMPT },
      { role: "user", content: text },
    ]);

    // Try to parse JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as ExtractedEntity[];

    // Filter to valid types only
    return parsed.filter(
      (e) =>
        e.type &&
        e.name &&
        VALID_ENTITY_TYPES.includes(e.type.toUpperCase()) &&
        e.name.trim().length > 0
    ).map((e) => ({
      type: e.type.toUpperCase(),
      name: e.name.trim(),
    }));
  } catch (err) {
    console.warn("[graph-builder] Entity extraction failed:", err);
    return [];
  }
}

/**
 * Find an existing entity node by type+name, or create a new one.
 */
async function findOrCreateEntity(entity: ExtractedEntity) {
  // Try to find existing node with same type and name (case-insensitive)
  const existing = await prisma.kgNode.findFirst({
    where: {
      type: entity.type,
      name: { equals: entity.name, mode: "insensitive" },
    },
  });

  if (existing) return existing;

  // Create new entity node
  return prisma.kgNode.create({
    data: {
      type: entity.type,
      name: entity.name,
      source: "auto",
    },
  });
}

/**
 * Find documents with high semantic similarity to a given document
 * and create RELATES_TO edges between them.
 *
 * Uses the average embedding of the document's chunks.
 */
async function findAndLinkSimilarDocuments(docNodeId: string): Promise<number> {
  // Get the document's chunk embeddings
  const chunks = await prisma.$queryRawUnsafe<
    { embedding: string }[]
  >(
    `SELECT embedding::text FROM kg_chunks WHERE "nodeId" = $1 AND embedding IS NOT NULL LIMIT 5`,
    docNodeId
  );

  if (chunks.length === 0) return 0;

  // Use the first chunk's embedding as the document representative
  // (more accurate: average all chunks, but this is faster)
  const firstChunkEmbedding = chunks[0].embedding;

  // Find similar chunks from OTHER documents
  const similarChunks = await prisma.$queryRawUnsafe<
    { nodeId: string; similarity: number }[]
  >(
    `SELECT DISTINCT ON (c."nodeId") c."nodeId",
            1 - (c.embedding <=> $1::vector(768)) as similarity
     FROM kg_chunks c
     JOIN kg_nodes n ON n.id = c."nodeId"
     WHERE c."nodeId" != $2
       AND n.type = 'DOCUMENT'
       AND c.embedding IS NOT NULL
     ORDER BY c."nodeId", c.embedding <=> $1::vector(768)
     LIMIT 10`,
    firstChunkEmbedding,
    docNodeId
  );

  let edgesCreated = 0;

  for (const sim of similarChunks) {
    if (Number(sim.similarity) >= SIMILARITY_THRESHOLD) {
      try {
        await prisma.kgEdge.upsert({
          where: {
            sourceId_targetId_relation: {
              sourceId: docNodeId,
              targetId: sim.nodeId,
              relation: "RELATES_TO",
            },
          },
          create: {
            sourceId: docNodeId,
            targetId: sim.nodeId,
            relation: "RELATES_TO",
            weight: Number(sim.similarity),
          },
          update: {
            weight: Number(sim.similarity),
          },
        });
        edgesCreated++;
      } catch {
        // Ignore duplicate edge errors
      }
    }
  }

  return edgesCreated;
}

/**
 * Delete a document node and all its associated data (cascading).
 */
export async function deleteDocumentNode(nodeId: string): Promise<void> {
  await prisma.kgNode.delete({ where: { id: nodeId } });
}
