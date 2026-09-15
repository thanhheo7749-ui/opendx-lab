// ==============================================================================
// BizScan — Market Intelligence API Route
// SPDX-License-Identifier: GPL-3.0-or-later
//
// POST /api/bizscan/market  → Fetch fresh market trends (uses API credits)
// GET  /api/bizscan/market  → Get latest market trends + comparisons (from DB)
// ==============================================================================

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  fetchMarketTrends,
  compareWithMarket,
  getMarketSummary,
} from "@/lib/bizscan/market-intel";

export async function POST() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    console.log("[BizScan] Fetching market trends...");
    const trends = await fetchMarketTrends();
    const comparisons = await compareWithMarket();

    return NextResponse.json({
      success: true,
      trendsCount: trends.length,
      trends,
      comparisons,
    });
  } catch (error) {
    console.error("[BizScan] Market trends fetch failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Market fetch failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const [summary, comparisons] = await Promise.all([
      getMarketSummary(),
      compareWithMarket(),
    ]);

    return NextResponse.json({
      success: true,
      summary,
      comparisons,
    });
  } catch (error) {
    console.error("[BizScan] Market data fetch failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed",
      },
      { status: 500 }
    );
  }
}
