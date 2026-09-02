// ==============================================================================
// BizScan — Simulator API Route
// SPDX-License-Identifier: GPL-3.0-or-later
//
// POST /api/bizscan/simulator?action=tick     → Run one simulator tick
// POST /api/bizscan/simulator?action=inject   → Inject anomaly
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { simulateTick, injectAnomaly, AnomalyType } from "@/lib/bizscan/simulator";

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action") ?? "tick";

  try {
    if (action === "tick") {
      const result = await simulateTick();
      return NextResponse.json({
        success: true,
        action: "tick",
        ...result,
      });
    }

    if (action === "inject") {
      const body = await req.json().catch(() => ({}));
      const anomalyType = (body as { type?: AnomalyType }).type;
      const result = await injectAnomaly(anomalyType);
      return NextResponse.json({
        success: true,
        action: "inject",
        ...result,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action. Use ?action=tick or ?action=inject" },
      { status: 400 }
    );
  } catch (error) {
    console.error(`[BizScan] Simulator ${action} failed:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
