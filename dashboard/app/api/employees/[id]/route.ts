// ==============================================================================
// OpenDX-Lab Dashboard - Single Employee API Routes
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerOffboarding, triggerActivation } from "@/lib/activepieces";
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

      // Trigger tracked offboarding workflow if terminated
      if (body.status === "TERMINATED") {
        const workflow = await createWorkflowExecutionRecord({
          type: "OFFBOARDING",
          employeeId: employee.id,
          initiatedBy: "dashboard_api",
          payload: { email: employee.email, department: employee.department.name },
        });
        workflowId = workflow.id;

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
      }

      // Trigger tracked activation workflow if reactivated
      if (before.status === "TERMINATED" && body.status === "ACTIVE") {
        const workflow = await createWorkflowExecutionRecord({
          type: "ACTIVATION",
          employeeId: employee.id,
          initiatedBy: "dashboard_api",
          payload: { email: employee.email, department: employee.department.name },
        });
        workflowId = workflow.id;

        const webhookResult = await triggerActivation({
          workflowId: workflow.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          department: employee.department.name,
        });

        if (!webhookResult.ok) {
          await updateWorkflowStepStatus({
            workflowId: workflow.id,
            stepKey: "enable_sso_account",
            status: "FAILED",
            errorCode: webhookResult.reason,
            errorMessage:
              webhookResult.reason === "network_error"
                ? webhookResult.errorMessage
                : `Webhook failed: ${webhookResult.reason}`,
          });
        }
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
