// ==============================================================================
// OpenDX-Lab Dashboard - Workflow: Service Helpers
// SPDX-License-Identifier: GPL-3.0-or-later
//
// Create, update, and complete workflow execution records.
// ==============================================================================

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
  WorkflowRecordType,
  WorkflowRecordStatus,
  WorkflowSeedStep,
} from "@/lib/workflows/types";

// ── Default Steps per Workflow Type ─────────────────────────────────────────

const DEFAULT_STEPS: Record<WorkflowRecordType, WorkflowSeedStep[]> = {
  ONBOARDING: [
    {
      stepKey: "employee_record_created",
      title: "Tạo hồ sơ nhân viên",
      owner: "system",
      status: "COMPLETED",
    },
    {
      stepKey: "create_sso_account",
      title: "Tạo tài khoản SSO (Keycloak)",
      owner: "activepieces",
    },
    {
      stepKey: "send_welcome_notification",
      title: "Gửi thông báo chào mừng (Mattermost)",
      owner: "activepieces",
    },
    {
      stepKey: "create_onboarding_page",
      title: "Tạo trang hướng dẫn onboarding",
      owner: "system",
    },
    {
      stepKey: "notify_manager",
      title: "Thông báo cho quản lý",
      owner: "activepieces",
    },
  ],
  OFFBOARDING: [
    {
      stepKey: "request_received",
      title: "Nhận yêu cầu offboarding",
      owner: "system",
      status: "COMPLETED",
    },
    {
      stepKey: "disable_sso_account",
      title: "Vô hiệu hóa tài khoản SSO",
      owner: "activepieces",
    },
    {
      stepKey: "notify_team",
      title: "Thông báo cho nhóm",
      owner: "activepieces",
    },
    {
      stepKey: "archive_knowledge",
      title: "Lưu trữ quyền sở hữu tài liệu",
      owner: "system",
    },
  ],
  ACTIVATION: [
    {
      stepKey: "request_received",
      title: "Nhận yêu cầu kích hoạt",
      owner: "system",
      status: "COMPLETED",
    },
    {
      stepKey: "enable_sso_account",
      title: "Kích hoạt lại tài khoản SSO",
      owner: "activepieces",
    },
    {
      stepKey: "notify_team",
      title: "Thông báo cho nhóm",
      owner: "activepieces",
    },
  ],
};

// ── Create Workflow Execution ───────────────────────────────────────────────

export async function createWorkflowExecutionRecord(input: {
  type: WorkflowRecordType;
  employeeId?: string;
  initiatedBy?: string;
  payload?: Record<string, unknown>;
}) {
  return prisma.workflowExecution.create({
    data: {
      type: input.type,
      status: "RUNNING",
      employeeId: input.employeeId,
      initiatedBy: input.initiatedBy,
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      steps: {
        create: DEFAULT_STEPS[input.type].map((step) => ({
          stepKey: step.stepKey,
          title: step.title,
          owner: step.owner,
          status: step.status ?? "PENDING",
          details: (step.details ?? {}) as Prisma.InputJsonValue,
        })),
      },
    },
    include: { steps: true },
  });
}

// ── Update Step Status ──────────────────────────────────────────────────────

export async function updateWorkflowStepStatus(input: {
  workflowId: string;
  stepKey: string;
  status: WorkflowRecordStatus;
  details?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}) {
  // Update the specific step
  await prisma.workflowStepExecution.updateMany({
    where: { workflowId: input.workflowId, stepKey: input.stepKey },
    data: {
      status: input.status,
      details: input.details ? (input.details as Prisma.InputJsonValue) : undefined,
      errorCode: input.errorCode ?? null,
      errorMessage: input.errorMessage ?? null,
      finishedAt: ["COMPLETED", "FAILED", "NEEDS_RETRY"].includes(input.status)
        ? new Date()
        : null,
    },
  });

  // Propagate to parent workflow
  const nextWorkflowStatus: WorkflowRecordStatus =
    input.status === "FAILED"
      ? "FAILED"
      : input.status === "NEEDS_RETRY"
        ? "NEEDS_RETRY"
        : "RUNNING";

  return prisma.workflowExecution.update({
    where: { id: input.workflowId },
    data: {
      status: nextWorkflowStatus,
      ...(input.status === "FAILED" ? { finishedAt: new Date() } : {}),
    },
    include: { steps: true },
  });
}

// ── Complete Workflow ────────────────────────────────────────────────────────

export async function completeWorkflow(workflowId: string) {
  // Mark all remaining PENDING steps as COMPLETED
  await prisma.workflowStepExecution.updateMany({
    where: { workflowId, status: "PENDING" },
    data: { status: "COMPLETED", finishedAt: new Date() },
  });

  return prisma.workflowExecution.update({
    where: { id: workflowId },
    data: { status: "COMPLETED", finishedAt: new Date() },
    include: { steps: true },
  });
}
