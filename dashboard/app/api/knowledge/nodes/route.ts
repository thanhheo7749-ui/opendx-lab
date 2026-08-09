// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Nodes CRUD API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Single node detail mode (with chunks)
    if (id) {
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
              target: { select: { id: true, name: true, type: true } },
            },
          },
          incomingEdges: {
            include: {
              source: { select: { id: true, name: true, type: true } },
            },
          },
        },
      });

      if (!node) {
        return NextResponse.json({ error: "Node not found" }, { status: 404 });
      }

      return NextResponse.json({ node });
    }

    // List mode
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const nodes = await prisma.kgNode.findMany({
      where,
      include: {
        _count: {
          select: {
            chunks: true,
            outgoingEdges: true,
            incomingEdges: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: Math.min(limit, 500),
    });

    return NextResponse.json({ nodes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
