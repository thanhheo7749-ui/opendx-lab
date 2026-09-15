// ==============================================================================
// Decision Intelligence — API Route
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getDecisionAdvice, getAllDecisions, type DecisionType } from "@/lib/decision/advisor";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const type = req.nextUrl.searchParams.get("type") as DecisionType | null;

    if (type) {
      const result = await getDecisionAdvice(type);
      return NextResponse.json(result);
    }

    // Return all 3 decision types
    const results = await getAllDecisions();
    return NextResponse.json(results);
  } catch (error) {
    console.error("[Decision API]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
