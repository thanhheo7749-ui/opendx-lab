// ==============================================================================
// OpenDX-Lab Dashboard - Approvals API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const items = await prisma.approvalRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, requestType, requestedBy, notes } = body;

    if (!workflowId || !requestType) {
      return NextResponse.json(
        { error: "Thiếu thông tin: workflowId, requestType" },
        { status: 400 }
      );
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        workflowId,
        requestType,
        requestedBy,
        notes,
      },
    });

    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("[approvals] Error:", error);
    return NextResponse.json(
      { error: "Không thể tạo yêu cầu phê duyệt" },
      { status: 500 }
    );
  }
}
