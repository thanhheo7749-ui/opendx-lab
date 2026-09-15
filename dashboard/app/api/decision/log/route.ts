// ==============================================================================
// ShopWise — Decision Log API
// Record and retrieve decisions made by shop owner
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET — List all decisions, optionally filtered by type/status
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const where: Record<string, string> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const decisions = await prisma.sbDecision.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ decisions });
  } catch (error) {
    console.error("Decision log GET error:", error);
    return NextResponse.json({ decisions: [], error: "Failed" }, { status: 500 });
  }
}

// POST — Record a new decision
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const body = await req.json();
    const { type, title, chosenOption, reason, predictedImpact } = body;

    if (!type || !title) {
      return NextResponse.json({ error: "type and title are required" }, { status: 400 });
    }

    // Default feedback due = 7 days from now
    const feedbackDue = new Date();
    feedbackDue.setDate(feedbackDue.getDate() + 7);

    const decision = await prisma.sbDecision.create({
      data: {
        type,
        title,
        chosenOption: chosenOption || null,
        reason: reason || null,
        predictedImpact: predictedImpact || null,
        status: "PENDING",
        feedbackDue,
      },
    });

    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    console.error("Decision log POST error:", error);
    return NextResponse.json({ error: "Failed to record decision" }, { status: 500 });
  }
}
