// ==============================================================================
// OpenDX-Lab Dashboard - Workflow Listing API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const id = searchParams.get("id");

  // Detail mode: return single workflow with all steps
  if (id) {
    const item = await prisma.workflowExecution.findUnique({
      where: { id },
      include: { steps: { orderBy: { createdAt: "asc" } } },
    });

    if (!item) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  }

  // List mode: return filtered workflows
  const items = await prisma.workflowExecution.findMany({
    where: {
      ...(type ? { type: type as "ONBOARDING" | "OFFBOARDING" | "ACTIVATION" } : {}),
      ...(status
        ? { status: status as "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "WAITING_APPROVAL" | "NEEDS_RETRY" }
        : {}),
    },
    include: { steps: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(items);
}
