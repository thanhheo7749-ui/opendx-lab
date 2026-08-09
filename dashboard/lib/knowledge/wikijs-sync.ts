// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Wiki.js Sync Connector
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Syncs Wiki.js pages into the Knowledge Graph via GraphQL API.
// ==============================================================================

import { prisma } from "@/lib/prisma";
import { ingestDocument } from "./graph-builder";

// ── Types ────────────────────────────────────────────────────────────────────

interface WikiPage {
  id: number;
  title: string;
  path: string;
  content: string;
  updatedAt: string;
}

export interface SyncResult {
  synced: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// ── Config ───────────────────────────────────────────────────────────────────

const WIKIJS_API_URL = process.env.WIKIJS_API_URL || "http://wikijs:3000";
const WIKIJS_API_KEY = process.env.WIKIJS_API_KEY || "";

// ── GraphQL Queries ──────────────────────────────────────────────────────────

const LIST_PAGES_QUERY = `{
  pages {
    list(orderBy: UPDATED) {
      id
      title
      path
      updatedAt
    }
  }
}`;

function getPageContentQuery(id: number) {
  return `{
    pages {
      single(id: ${id}) {
        id
        title
        path
        content
        updatedAt
      }
    }
  }`;
}

// ── Main Sync Function ───────────────────────────────────────────────────────

/**
 * Sync all Wiki.js pages into the Knowledge Graph.
 *
 * Strategy:
 * - Fetch page list from Wiki.js
 * - For each page, check if it exists in kg_nodes (by sourceUrl)
 * - If new → ingest
 * - If updated (newer updatedAt) → delete old + re-ingest
 * - If unchanged → skip
 */
export async function syncFromWikiJs(): Promise<SyncResult> {
  if (!WIKIJS_API_KEY) {
    throw new Error("WIKIJS_API_KEY not configured. Set it in .env.local");
  }

  const result: SyncResult = { synced: 0, updated: 0, skipped: 0, errors: [] };

  // 1. Fetch page list
  let pages: WikiPage[];
  try {
    const listData = await queryWikiJs(LIST_PAGES_QUERY);
    pages = listData.pages.list;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Không thể kết nối Wiki.js: ${msg}`);
  }

  // 2. Process each page
  for (const pageMeta of pages) {
    const sourceUrl = `${WIKIJS_API_URL}/${pageMeta.path}`;

    try {
      // Check if this page is already in the knowledge graph
      const existing = await prisma.kgNode.findFirst({
        where: {
          source: "wikijs",
          sourceUrl,
        },
      });

      if (existing) {
        // Check if Wiki.js page has been updated since last sync
        const wikiUpdated = new Date(pageMeta.updatedAt);
        const nodeUpdated = existing.updatedAt;

        if (wikiUpdated <= nodeUpdated) {
          result.skipped++;
          continue;
        }

        // Delete old node (cascades to chunks and edges)
        await prisma.kgNode.delete({ where: { id: existing.id } });
        result.updated++;
      } else {
        result.synced++;
      }

      // Fetch full page content
      const pageData = await queryWikiJs(getPageContentQuery(pageMeta.id));
      const fullPage: WikiPage = pageData.pages.single;

      if (!fullPage || !fullPage.content || fullPage.content.trim().length < 50) {
        result.skipped++;
        continue; // Skip very short or empty pages
      }

      // Ingest into knowledge graph
      await ingestDocument({
        name: fullPage.title,
        content: fullPage.content,
        source: "wikijs",
        sourceUrl,
        metadata: {
          wikiPageId: fullPage.id,
          wikiPath: fullPage.path,
          wikiUpdatedAt: fullPage.updatedAt,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      result.errors.push(`Page "${pageMeta.title}": ${msg}`);
    }
  }

  return result;
}

// ── GraphQL Client ───────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
async function queryWikiJs(query: string): Promise<any> {
  const res = await fetch(`${WIKIJS_API_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WIKIJS_API_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Wiki.js API error (${res.status}): ${text}`);
  }

  const json = await res.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Wiki.js GraphQL error: ${json.errors[0].message}`);
  }

  return json.data;
}
/* eslint-enable @typescript-eslint/no-explicit-any */
