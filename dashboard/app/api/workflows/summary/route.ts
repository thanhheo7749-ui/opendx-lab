// ==============================================================================
// OpenDX-Lab Dashboard - Workflow Summary API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [pending, failed, completed, waitingApproval, running, needsRetry] =
    await Promise.all([
      prisma.workflowExecution.count({ where: { status: "PENDING" } }),
      prisma.workflowExecution.count({ where: { status: "FAILED" } }),
      prisma.workflowExecution.count({ where: { status: "COMPLETED" } }),
      prisma.workflowExecution.count({ where: { status: "WAITING_APPROVAL" } }),
      prisma.workflowExecution.count({ where: { status: "RUNNING" } }),
      prisma.workflowExecution.count({ where: { status: "NEEDS_RETRY" } }),
    ]);

  return NextResponse.json({
    pending,
    failed,
    completed,
    waitingApproval,
    running,
    needsRetry,
    total: pending + failed + completed + waitingApproval + running + needsRetry,
  });
}
