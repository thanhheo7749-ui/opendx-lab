// ==============================================================================
// OpenDX-Lab Dashboard - Employee API Routes
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { triggerOnboarding } from "@/lib/activepieces";
import { createEmployeeSchema } from "@/lib/validations/employee";
import {
  createWorkflowExecutionRecord,
  updateWorkflowStepStatus,
} from "@/lib/workflows/service";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const department = searchParams.get("department") ?? "";
  const status = searchParams.get("status") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (department) {
    where.departmentId = department;
  }

  if (status) {
    where.status = status;
  }

  const employees = await prisma.employee.findMany({
    where,
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(employees);
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole("admin");
    if (!authResult.ok) return authResult.response;

    const body = await request.json();
    const parseResult = createEmployeeSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Dữ liệu không hợp lệ", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { firstName, lastName, email, position, departmentId } = parseResult.data;

    // Duplicate email check
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });
    if (existingEmployee) {
      return NextResponse.json(
        { error: "Email nhân viên đã tồn tại" },
        { status: 409 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        position,
        departmentId,
        hireDate: new Date(),
      },
      include: { department: true },
    });

    // Create tracked workflow execution
    const workflow = await createWorkflowExecutionRecord({
      type: "ONBOARDING",
      employeeId: employee.id,
      initiatedBy: "dashboard_api",
      payload: { firstName, lastName, email, departmentId, position },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: "WORKFLOW_STARTED",
        message: `Khởi tạo onboarding cho ${firstName} ${lastName} (${employee.department.name})`,
        metadata: {
          employeeId: employee.id,
          email,
          workflowId: workflow.id,
          workflowType: "ONBOARDING",
        },
      },
    });

    // Trigger Activepieces onboarding webhook with correlation ID
    const webhookResult = await triggerOnboarding({
      workflowId: workflow.id,
      firstName,
      lastName,
      email,
      department: employee.department.name,
      position,
    });

    if (!webhookResult.ok) {
      await updateWorkflowStepStatus({
        workflowId: workflow.id,
        stepKey: "create_sso_account",
        status: "NEEDS_RETRY",
        errorCode: webhookResult.reason,
        errorMessage:
          webhookResult.reason === "network_error"
            ? webhookResult.errorMessage
            : `Webhook failed: ${webhookResult.reason}`,
      });
    }

    // Create onboarding knowledge page
    try {
      const { buildOnboardingPage } = await import("@/lib/wiki/onboarding-page");
      const page = buildOnboardingPage({
        fullName: `${firstName} ${lastName}`,
        department: employee.department.name,
        position,
      });
      await updateWorkflowStepStatus({
        workflowId: workflow.id,
        stepKey: "create_onboarding_page",
        status: "COMPLETED",
        details: { title: page.title },
      });
    } catch {
      await updateWorkflowStepStatus({
        workflowId: workflow.id,
        stepKey: "create_onboarding_page",
        status: "FAILED",
        errorCode: "page_creation_failed",
        errorMessage: "Không thể tạo trang onboarding",
      });
    }

    return NextResponse.json(
      { ...employee, workflowId: workflow.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create employee:", error);
    return NextResponse.json(
      { error: "Không thể tạo nhân viên" },
      { status: 500 }
    );
  }
}
