// ==============================================================================
// BizScan — Scan API Route
// SPDX-License-Identifier: GPL-3.0-or-later
//
// POST /api/bizscan/scan   → Run a full scan (manual trigger)
// GET  /api/bizscan/scan   → Get latest scan results
// ==============================================================================

import { NextResponse } from "next/server";
import { runFullScan } from "@/lib/bizscan/scanner";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function POST() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    console.log("[BizScan] Manual scan triggered...");
    const result = await runFullScan("MANUAL");

    return NextResponse.json({
      success: true,
      scan: {
        id: result.scan.id,
        status: result.scan.status,
        summary: result.scan.summary,
        durationMs: result.durationMs,
        anomalyCount: result.anomalyCount,
        findings: result.scan.findings,
      },
      checks: result.results.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        hasAnomaly: r.hasAnomaly,
        severity: r.severity,
        message: r.message,
      })),
    });
  } catch (error) {
    console.error("[BizScan] Scan failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Scan failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    // Get the 10 most recent scans with their findings
    const scans = await prisma.sbScanResult.findMany({
      orderBy: { startedAt: "desc" },
      take: 10,
      include: {
        findings: {
          orderBy: [{ severity: "asc" }, { createdAt: "desc" }],
        },
      },
    });

    // Get overall stats
    const [totalScans, totalFindings, pendingFindings] = await Promise.all([
      prisma.sbScanResult.count(),
      prisma.sbScanFinding.count(),
      prisma.sbScanFinding.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: { totalScans, totalFindings, pendingFindings },
      scans,
    });
  } catch (error) {
    console.error("[BizScan] Failed to get scans:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get scans",
      },
      { status: 500 }
    );
  }
}
