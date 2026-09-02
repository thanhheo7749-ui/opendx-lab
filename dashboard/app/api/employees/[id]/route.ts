// ==============================================================================
// OpenDX-Lab Dashboard - Single Employee API Routes
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disableUser, enableUser } from "@/lib/keycloak-admin";
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
    const { id } = await params;
    const body = await request.json();

    // Get the employee BEFORE update to detect status changes
    const before = await prisma.employee.findUnique({
      where: { id },
      include: { department: true },
    });

    if (!before) {
      return NextResponse.json({ error: "Không tìm thấy nhân viên" }, { status: 404 });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: body,
      include: { department: true },
    });

    let workflowId: string | null = null;

    // Log activity for status changes
    if (body.status && body.status !== before.status) {
      const statusLabels: Record<string, string> = {
        ACTIVE: "Hoạt động",
        ON_LEAVE: "Nghỉ phép",
        TERMINATED: "Đã nghỉ việc",
      };
      await prisma.activityLog.create({
        data: {
          type: body.status === "TERMINATED" ? "EMPLOYEE_TERMINATED" : "EMPLOYEE_STATUS_CHANGE",
          message: `${employee.firstName} ${employee.lastName}: ${statusLabels[before.status]} → ${statusLabels[body.status]}`,
          metadata: { employeeId: employee.id, email: employee.email, from: before.status, to: body.status },
        },
      });

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
        }).catch(err => console.error("[mattermost] notification error:", err));
      }
    }

    // Log activity for info changes (non-status)
    if (!body.status || body.status === before.status) {
      const changes: string[] = [];
      if (body.firstName && body.firstName !== before.firstName) changes.push("họ");
      if (body.lastName && body.lastName !== before.lastName) changes.push("tên");
      if (body.email && body.email !== before.email) changes.push("email");
      if (body.position && body.position !== before.position) changes.push("vị trí");
      if (body.departmentId && body.departmentId !== before.departmentId) changes.push("phòng ban");

      if (changes.length > 0) {
        await prisma.activityLog.create({
          data: {
            type: "EMPLOYEE_UPDATED",
            message: `Cập nhật ${employee.firstName} ${employee.lastName}: ${changes.join(", ")}`,
            metadata: { employeeId: employee.id },
          },
        });
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
