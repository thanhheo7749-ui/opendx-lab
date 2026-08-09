// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Graph Data API (for visualization)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/knowledge/graph
 *
 * Returns full knowledge graph data formatted for react-force-graph-2d.
 * Supports filtering by node types and minimum edge weight.
 *
 * Query params:
 *   types: comma-separated node types (e.g., "DOCUMENT,PROCESS")
 *   minWeight: minimum edge weight to include (default: 0.0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typesParam = searchParams.get("types");
    const minWeight = parseFloat(searchParams.get("minWeight") || "0");

    // Build node filter
    const nodeWhere: Record<string, unknown> = {};
    if (typesParam) {
      nodeWhere.type = { in: typesParam.split(",").map((t) => t.trim()) };
    }

    // Fetch nodes
    const nodes = await prisma.kgNode.findMany({
      where: nodeWhere,
      select: {
        id: true,
        type: true,
        name: true,
        description: true,
        source: true,
        _count: {
          select: {
            chunks: true,
            outgoingEdges: true,
            incomingEdges: true,
          },
        },
      },
    });

    // Collect node IDs for edge filtering
    const nodeIds = new Set(nodes.map((n) => n.id));

    // Fetch edges (only between visible nodes)
    const edges = await prisma.kgEdge.findMany({
      where: {
        weight: { gte: minWeight },
        sourceId: { in: Array.from(nodeIds) },
        targetId: { in: Array.from(nodeIds) },
      },
      select: {
        id: true,
        sourceId: true,
        targetId: true,
        relation: true,
        weight: true,
      },
    });

    // Format for react-force-graph-2d
    const graphNodes = nodes.map((n) => ({
      id: n.id,
      name: n.name,
      type: n.type,
      description: n.description,
      source: n.source,
      // Node size based on connection count
      val: Math.max(1, n._count.outgoingEdges + n._count.incomingEdges),
      chunkCount: n._count.chunks,
    }));

    const graphLinks = edges.map((e) => ({
      source: e.sourceId,
      target: e.targetId,
      relation: e.relation,
      weight: e.weight,
    }));

    return NextResponse.json({
      nodes: graphNodes,
      links: graphLinks,
      stats: {
        totalNodes: graphNodes.length,
        totalLinks: graphLinks.length,
        nodeTypes: [...new Set(graphNodes.map((n) => n.type))],
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
