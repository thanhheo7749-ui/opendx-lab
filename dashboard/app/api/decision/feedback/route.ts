// ==============================================================================
// ShopWise — Decision Feedback API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { checkDecisionOutcome, getDecisionStats } from "@/lib/decision/feedback";

// GET /api/decision/feedback — stats overview
// GET /api/decision/feedback?id=xxx — check specific decision
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const result = await checkDecisionOutcome(id);
      return NextResponse.json(result);
    }

    const stats = await getDecisionStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
