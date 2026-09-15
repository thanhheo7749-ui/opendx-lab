// ==============================================================================
// OpenDX-Lab Dashboard - Dashboard Stats API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const [
      employeeCount,
      departmentCount,
      activeCount,
      onLeaveCount,
      terminatedCount,
      recentLogs,
      departments,
      recentHires,
      pendingWorkflows,
      failedWorkflows,
      completedWorkflows,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.department.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.employee.count({ where: { status: "ON_LEAVE" } }),
      prisma.employee.count({ where: { status: "TERMINATED" } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
      prisma.department.findMany({
        include: { employees: { select: { status: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.employee.findMany({
        orderBy: { hireDate: "desc" },
        take: 5,
        include: { department: true },
      }),
      prisma.workflowExecution.count({ where: { status: "PENDING" } }),
      prisma.workflowExecution.count({ where: { status: "FAILED" } }),
      prisma.workflowExecution.count({ where: { status: "COMPLETED" } }),
    ]);

    const deptStats = departments.map((d) => ({
      name: d.name,
      code: d.code,
      total: d.employees.length,
      active: d.employees.filter((e) => e.status === "ACTIVE").length,
      onLeave: d.employees.filter((e) => e.status === "ON_LEAVE").length,
      terminated: d.employees.filter((e) => e.status === "TERMINATED").length,
    }));

    return NextResponse.json({
      employeeCount,
      departmentCount,
      activeCount,
      onLeaveCount,
      terminatedCount,
      recentLogs,
      deptStats,
      recentHires,
      workflowSummary: {
        pending: pendingWorkflows,
        failed: failedWorkflows,
        completed: completedWorkflows,
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
