// ==============================================================================
// OpenDX-Lab — DX-Ticket API: Simple internal service desk
// SPDX-License-Identifier: GPL-3.0-or-later
//
// POST /api/tickets → Create ticket + notify Mattermost
// GET  /api/tickets → List recent tickets
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MATTERMOST_WEBHOOK_URL =
  process.env.MATTERMOST_WEBHOOK_URL ?? "http://mattermost:8065/hooks/1tweywjun7dk9kph3qyyq4odjh";

const PRIORITY_EMOJI: Record<string, string> = {
  LOW: "🟢",
  NORMAL: "🔵",
  HIGH: "🟡",
  URGENT: "🔴",
};

// ── POST: Create ticket ─────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, priority, category, createdBy } = body as {
      title: string;
      description: string;
      priority?: string;
      category?: string;
      createdBy?: string;
    };

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Missing title or description" },
        { status: 400 }
      );
    }

    const ticket = await prisma.dxTicket.create({
      data: {
        title,
        description,
        priority: priority ?? "NORMAL",
        category: category ?? "IT",
        createdBy: createdBy ?? "Dashboard User",
      },
    });

    // Notify Mattermost
    const emoji = PRIORITY_EMOJI[ticket.priority] ?? "⚪";
    const message = `### 🎫 DX-Ticket mới: #${ticket.id.slice(-6).toUpperCase()}

${emoji} **[${ticket.priority}]** ${ticket.title}

| Thông tin | Chi tiết |
|:---|:---|
| Danh mục | ${ticket.category} |
| Người tạo | ${ticket.createdBy ?? "N/A"} |
| Mô tả | ${ticket.description} |

> Trạng thái: **OPEN** — Chờ IT xử lý`;

    try {
      await fetch(MATTERMOST_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "DX-Ticket Bot",
          icon_emoji: ":ticket:",
          text: message,
        }),
      });
    } catch (e) {
      console.warn("[Ticket] Mattermost notification failed:", e);
    }

    // Audit log
    await prisma.activityLog.create({
      data: {
        type: "SYSTEM",
        message: `🎫 Ticket mới: "${title}" [${ticket.priority}] bởi ${ticket.createdBy}`,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("[Ticket] Create failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}

// ── GET: List tickets ───────────────────────────────────────────────────────

export async function GET() {
  try {
    const tickets = await prisma.dxTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const counts = {
      open: await prisma.dxTicket.count({ where: { status: "OPEN" } }),
      inProgress: await prisma.dxTicket.count({ where: { status: "IN_PROGRESS" } }),
      resolved: await prisma.dxTicket.count({ where: { status: "RESOLVED" } }),
    };

    return NextResponse.json({ success: true, tickets, counts });
  } catch (error) {
    console.error("[Ticket] List failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
