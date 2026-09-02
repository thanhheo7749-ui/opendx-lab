// ==============================================================================
// BizScan — Approve/Dismiss Findings API
// SPDX-License-Identifier: GPL-3.0-or-later
//
// POST /api/bizscan/approve → Approve or dismiss a finding
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { findingId, action } = body as {
      findingId: string;
      action: "APPROVE" | "DISMISS";
    };

    if (!findingId || !action) {
      return NextResponse.json(
        { success: false, error: "Missing findingId or action" },
        { status: 400 }
      );
    }

    if (!["APPROVE", "DISMISS"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Action must be APPROVE or DISMISS" },
        { status: 400 }
      );
    }

    const finding = await prisma.sbScanFinding.findUnique({
      where: { id: findingId },
    });

    if (!finding) {
      return NextResponse.json(
        { success: false, error: "Finding not found" },
        { status: 404 }
      );
    }

    if (finding.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: `Finding đã được xử lý (status: ${finding.status})`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.sbScanFinding.update({
      where: { id: findingId },
      data: {
        status: action === "APPROVE" ? "APPROVED" : "DISMISSED",
        approvedAt: action === "APPROVE" ? new Date() : null,
      },
    });

    console.log(
      `[BizScan] Finding "${finding.title}" ${action === "APPROVE" ? "approved ✅" : "dismissed ❌"}`
    );

    return NextResponse.json({
      success: true,
      finding: updated,
    });
  } catch (error) {
    console.error("[BizScan] Approve failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed",
      },
      { status: 500 }
    );
  }
}
