// ==============================================================================
// Decision Intelligence — Forecast API Route
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { forecastRevenue, getStockoutAlerts } from "@/lib/decision/forecast";

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const [revenue, stockouts] = await Promise.all([
      forecastRevenue(),
      getStockoutAlerts(),
    ]);

    return NextResponse.json({ revenue, stockouts });
  } catch (error) {
    console.error("[Forecast API]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
