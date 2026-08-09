-- ==============================================================================
-- OpenDX-Lab Dashboard - Knowledge Graph Migration
-- Enable pgvector extension and create vector index for semantic search
-- SPDX-License-Identifier: GPL-3.0-or-later
-- ==============================================================================

-- Enable the pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create IVFFlat index on kg_chunks.embedding for fast cosine similarity search
-- Note: This index works best when there are at least 100 rows
-- lists = 100 is a good default for up to ~100K chunks
CREATE INDEX IF NOT EXISTS kg_chunks_embedding_idx 
  ON kg_chunks 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);
