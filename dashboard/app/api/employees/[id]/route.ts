// ==============================================================================
// OpenDX-Lab Dashboard - Single Employee API Routes
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { triggerOffboarding } from "@/lib/activepieces";
import { disableUser, enableUser } from "@/lib/keycloak-admin";
import { updateEmployeeSchema } from "@/lib/validations/employee";
import {
  notifyStatusChange,
  deactivateUser as mmDeactivate,
  activateUser as mmActivate,
} from "@/lib/mattermost";
import {
  createWorkflowExecutionRecord,
  updateWorkflowStepStatus,
} from "@/lib/workflows/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole("admin");
    if (!authResult.ok) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    
    const parseResult = updateEmployeeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const validatedBody = parseResult.data;

    // Use interactive transaction to prevent race conditions (C2 fix)
    const result = await prisma.$transaction(async (tx) => {
      // Get the employee BEFORE update to detect status changes
      const before = await tx.employee.findUnique({
        where: { id },
        include: { department: true },
      });

      if (!before) {
        return { found: false as const };
      }

      const employee = await tx.employee.update({
        where: { id },
        data: validatedBody,
        include: { department: true },
      });

      // Log activity for status changes (inside transaction for consistency)
      if (validatedBody.status && validatedBody.status !== before.status) {
        const statusLabels: Record<string, string> = {
          ACTIVE: "Hoạt động",
          ON_LEAVE: "Nghỉ phép",
          TERMINATED: "Đã nghỉ việc",
        };
        await tx.activityLog.create({
          data: {
            type: validatedBody.status === "TERMINATED" ? "EMPLOYEE_TERMINATED" : "EMPLOYEE_STATUS_CHANGE",
            message: `${employee.firstName} ${employee.lastName}: ${statusLabels[before.status]} → ${statusLabels[validatedBody.status]}`,
            metadata: { employeeId: employee.id, email: employee.email, from: before.status, to: validatedBody.status },
          },
        });
      }

      // Log activity for info changes (non-status, inside transaction)
      if (!validatedBody.status || validatedBody.status === before.status) {
        const changes: string[] = [];
        if (validatedBody.firstName && validatedBody.firstName !== before.firstName) changes.push("họ");
        if (validatedBody.lastName && validatedBody.lastName !== before.lastName) changes.push("tên");
        if (validatedBody.email && validatedBody.email !== before.email) changes.push("email");
        if (validatedBody.position && validatedBody.position !== before.position) changes.push("vị trí");
        if (validatedBody.departmentId && validatedBody.departmentId !== before.departmentId) changes.push("phòng ban");

        if (changes.length > 0) {
          await tx.activityLog.create({
            data: {
              type: "EMPLOYEE_UPDATED",
              message: `Cập nhật ${employee.firstName} ${employee.lastName}: ${changes.join(", ")}`,
              metadata: { employeeId: employee.id },
            },
          });
        }
      }

      return { found: true as const, before, employee };
    });

    if (!result.found) {
      return NextResponse.json({ error: "Không tìm thấy nhân viên" }, { status: 404 });
    }

    const { before, employee } = result;
    let workflowId: string | null = null;

    // Side effects OUTSIDE transaction (external API calls should not block DB)
    if (body.status && body.status !== before.status) {
      // ── Offboarding: ACTIVE/ON_LEAVE → TERMINATED ──────────────────
      if (body.status === "TERMINATED") {
        // Step 1: Disable Keycloak SSO account
        const kcResult = await disableUser(employee.email);

        // Step 2: Deactivate Mattermost account
        const mmResult = await mmDeactivate(employee.email);

        // Step 3: Create workflow execution record for tracking
        const workflow = await createWorkflowExecutionRecord({
          type: "OFFBOARDING",
          employeeId: employee.id,
          initiatedBy: "dashboard_api",
          payload: { email: employee.email, department: employee.department.name },
        });
        workflowId = workflow.id;

        // Update workflow step statuses
        await updateWorkflowStepStatus({
          workflowId: workflow.id,
          stepKey: "disable_sso_account",
          status: kcResult.ok ? "COMPLETED" : "FAILED",
          errorCode: kcResult.ok ? undefined : kcResult.action,
          errorMessage: kcResult.ok ? undefined : (kcResult.error ?? `SSO ${kcResult.action}`),
        });

        // Step 4: Send consolidated Mattermost notification
        notifyStatusChange({
          employeeName: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department.name,
          fromStatus: before.status,
          toStatus: body.status,
          keycloakResult: kcResult.ok ? "🔒 Đã vô hiệu hóa tài khoản" : `❌ ${kcResult.error ?? kcResult.action}`,
          mattermostResult: mmResult.ok ? "🔒 Đã vô hiệu hóa tài khoản" : `❌ ${mmResult.error ?? mmResult.action}`,
        // TODO: Use waitUntil() when deploying to serverless (Vercel/Cloudflare)
        }).catch(err => console.error("[mattermost] notification error:", err));
      }

      // ── Re-activation: TERMINATED → ACTIVE ────────────────────────
      else if (before.status === "TERMINATED" && body.status === "ACTIVE") {
        // Step 1: Enable Keycloak SSO account
        const kcResult = await enableUser(employee.email);

        // Step 2: Reactivate Mattermost account
        const mmResult = await mmActivate(employee.email);

        // Step 3: Create workflow execution record
        const workflow = await createWorkflowExecutionRecord({
          type: "ACTIVATION",
          employeeId: employee.id,
          initiatedBy: "dashboard_api",
          payload: { email: employee.email, department: employee.department.name },
        });
        workflowId = workflow.id;

        // Update workflow step statuses
        await updateWorkflowStepStatus({
          workflowId: workflow.id,
          stepKey: "enable_sso_account",
          status: kcResult.ok ? "COMPLETED" : "FAILED",
          errorCode: kcResult.ok ? undefined : kcResult.action,
          errorMessage: kcResult.ok ? undefined : (kcResult.error ?? `SSO ${kcResult.action}`),
        });

        // Step 4: Send consolidated Mattermost notification
        notifyStatusChange({
          employeeName: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department.name,
          fromStatus: before.status,
          toStatus: body.status,
          keycloakResult: kcResult.ok ? "🔓 Đã kích hoạt lại tài khoản" : `❌ ${kcResult.error ?? kcResult.action}`,
          mattermostResult: mmResult.ok ? "🔓 Đã kích hoạt lại tài khoản" : `❌ ${mmResult.error ?? mmResult.action}`,
        // TODO: Use waitUntil() when deploying to serverless (Vercel/Cloudflare)
        }).catch(err => console.error("[mattermost] notification error:", err));
      }

      // ── Other status changes (e.g., ACTIVE ↔ ON_LEAVE) ───────────
      else {
        notifyStatusChange({
          employeeName: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department.name,
          fromStatus: before.status,
          toStatus: body.status,
        // TODO: Use waitUntil() when deploying to serverless (Vercel/Cloudflare)
        }).catch(err => console.error("[mattermost] notification error:", err));
      }
    }

    return NextResponse.json({ ...employee, workflowId });
  } catch (error) {
    console.error("Failed to update employee:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật nhân viên" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole("admin");
    if (!authResult.ok) return authResult.response;

    const { id } = await params;

    const employee = await prisma.employee.update({
      where: { id },
      data: { status: "TERMINATED" },
      include: { department: true },
    });

    // Create tracked offboarding workflow
    const workflow = await createWorkflowExecutionRecord({
      type: "OFFBOARDING",
      employeeId: employee.id,
      initiatedBy: "dashboard_api",
      payload: { email: employee.email, department: employee.department.name },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: "EMPLOYEE_TERMINATED",
        message: `Nhân viên nghỉ việc: ${employee.firstName} ${employee.lastName}`,
        metadata: {
          employeeId: employee.id,
          email: employee.email,
          workflowId: workflow.id,
        },
      },
    });

    // Trigger offboarding webhook
    const webhookResult = await triggerOffboarding({
      workflowId: workflow.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      department: employee.department.name,
    });

    if (!webhookResult.ok) {
      await updateWorkflowStepStatus({
        workflowId: workflow.id,
        stepKey: "disable_sso_account",
        status: "FAILED",
        errorCode: webhookResult.reason,
        errorMessage:
          webhookResult.reason === "network_error"
            ? webhookResult.errorMessage
            : `Webhook failed: ${webhookResult.reason}`,
      });
    }

    return NextResponse.json({ ...employee, workflowId: workflow.id });
  } catch (error) {
    console.error("Failed to terminate employee:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật trạng thái nhân viên" },
      { status: 500 }
    );
  }
}
