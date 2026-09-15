// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Node Detail API (with chunks)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const { id } = await context.params;

    const node = await prisma.kgNode.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
          select: {
            id: true,
            content: true,
            chunkIndex: true,
            tokenCount: true,
          },
        },
        outgoingEdges: {
          include: {
            target: {
              select: { id: true, name: true, type: true },
            },
          },
        },
        incomingEdges: {
          include: {
            source: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });

    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    return NextResponse.json({ node });
  } catch (err) {
    console.error("[knowledge/nodes/[id]] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
