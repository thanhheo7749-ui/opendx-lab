// ==============================================================================
// OpenDX-Lab Dashboard - AI: Workflow-Aware Query Helper
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Answers operational workflow questions from Prisma data.
// ==============================================================================

import { prisma } from "@/lib/prisma";
import type { AnswerSourceSummary } from "@/lib/ai/source-summary";

export interface WorkflowQueryResult {
  intent: "WORKFLOW_STATUS";
  summary: string;
  items: unknown[];
  sources: AnswerSourceSummary[];
  nextActions: string[];
}

/**
 * Answer workflow-related questions by querying incomplete/failed executions.
 */
export async function answerWorkflowQuestion(
  question: string
): Promise<WorkflowQueryResult> {
  const q = question.toLowerCase();

  // Determine what to query
  const isFailed =
    q.includes("lỗi") ||
    q.includes("fail") ||
    q.includes("thất bại") ||
    q.includes("error");

  const isOnboarding = q.includes("onboarding") || q.includes("nhập việc");
  const isOffboarding = q.includes("offboarding") || q.includes("nghỉ việc");

  // Build where clause
  const where: Record<string, unknown> = {};

  if (isFailed) {
    where.status = { in: ["FAILED", "NEEDS_RETRY"] };
  } else {
    where.status = {
      in: ["PENDING", "RUNNING", "FAILED", "NEEDS_RETRY", "WAITING_APPROVAL"],
    };
  }

  if (isOnboarding) where.type = "ONBOARDING";
  if (isOffboarding) where.type = "OFFBOARDING";

  const workflows = await prisma.workflowExecution.findMany({
    where,
    include: {
      steps: {
        where: { status: { in: ["FAILED", "NEEDS_RETRY", "PENDING"] } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Build summary
  const failedCount = workflows.filter(
    (w) => w.status === "FAILED" || w.status === "NEEDS_RETRY"
  ).length;
  const pendingCount = workflows.filter(
    (w) => w.status === "PENDING" || w.status === "RUNNING"
  ).length;

  let summary: string;
  if (workflows.length === 0) {
    summary = isFailed
      ? "✅ Không có workflow nào bị lỗi."
      : "✅ Tất cả workflow đã hoàn tất. Không có workflow nào đang chờ xử lý.";
  } else {
    const parts: string[] = [];
    if (failedCount > 0) parts.push(`${failedCount} workflow bị lỗi/cần thử lại`);
    if (pendingCount > 0) parts.push(`${pendingCount} workflow đang chờ xử lý`);
    summary = `📊 Có ${parts.join(" và ")}.`;

    // Add detail per workflow
    for (const wf of workflows.slice(0, 5)) {
      const failedSteps = wf.steps
        .filter((s) => s.status === "FAILED" || s.status === "NEEDS_RETRY")
        .map((s) => `"${s.title}" (${s.errorCode ?? "unknown"})`)
        .join(", ");

      summary += `\n- **${wf.type}** (${wf.status})`;
      if (failedSteps) summary += `: bước lỗi — ${failedSteps}`;
    }
  }

  // Build sources
  const sources: AnswerSourceSummary[] = workflows.slice(0, 5).map((w) => ({
    type: "workflow" as const,
    label: `${w.type} · ${w.status}`,
    ref: w.id,
  }));

  // Build next actions
  const nextActions: string[] = [];
  if (failedCount > 0) {
    nextActions.push("Mở trang Workflows để xem chi tiết các bước lỗi");
    nextActions.push("Kiểm tra kết nối đến Activepieces và Keycloak");
  }
  if (pendingCount > 0) {
    nextActions.push("Kiểm tra các workflow đang chờ xử lý");
  }
  if (workflows.length > 0) {
    nextActions.push("Xem danh sách nhân viên liên quan");
  }

  return {
    intent: "WORKFLOW_STATUS",
    summary,
    items: workflows,
    sources,
    nextActions,
  };
}
