// ==============================================================================
// OpenDX-Lab — Offboard API: Full employee offboarding workflow
// SPDX-License-Identifier: GPL-3.0-or-later
//
// POST /api/offboard → Disable Keycloak + Deactivate Mattermost + Audit Log
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disableUser as disableKeycloak } from "@/lib/keycloak-admin";
import { deactivateUser as deactivateMattermost, notifyStatusChange } from "@/lib/mattermost";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId } = body as { employeeId: string };

    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: "Missing employeeId" },
        { status: 400 }
      );
    }

    // 1. Find the employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    if (employee.status === "TERMINATED") {
      return NextResponse.json(
        { success: false, error: "Employee already terminated" },
        { status: 400 }
      );
    }

    const email = employee.email;
    const fullName = `${employee.firstName} ${employee.lastName}`;
    const results: Record<string, string> = {};

    // 2. Disable Keycloak SSO
    try {
      const kcResult = await disableKeycloak(email);
      results.keycloak = kcResult.ok
        ? `✅ Đã khóa SSO (${kcResult.username})`
        : `⚠️ ${kcResult.action}: ${kcResult.error ?? "User not found in Keycloak"}`;
    } catch (e) {
      results.keycloak = `❌ Lỗi: ${e instanceof Error ? e.message : "Unknown"}`;
    }

    // 3. Deactivate Mattermost
    try {
      const mmResult = await deactivateMattermost(email);
      results.mattermost = mmResult.ok
        ? `✅ Đã khóa Mattermost (${mmResult.username})`
        : `⚠️ ${mmResult.action}: ${mmResult.error ?? "User not found in Mattermost"}`;
    } catch (e) {
      results.mattermost = `❌ Lỗi: ${e instanceof Error ? e.message : "Unknown"}`;
    }

    // 4. Update employee status in DB
    const previousStatus = employee.status;
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: "TERMINATED" },
    });
    results.database = "✅ Đã cập nhật trạng thái → TERMINATED";

    // 5. Create audit log
    await prisma.activityLog.create({
      data: {
        type: "EMPLOYEE_TERMINATED",
        message: `🔒 Offboard: ${fullName} (${email}) — Keycloak: ${results.keycloak}, Mattermost: ${results.mattermost}`,
      },
    });
    results.auditLog = "✅ Đã ghi nhật ký kiểm toán";

    // 6. Notify Mattermost channel
    try {
      await notifyStatusChange({
        employeeName: fullName,
        email,
        department: employee.department?.name ?? "N/A",
        fromStatus: previousStatus,
        toStatus: "TERMINATED",
        keycloakResult: results.keycloak,
        mattermostResult: results.mattermost,
      });
      results.notification = "✅ Đã gửi thông báo Mattermost";
    } catch {
      results.notification = "⚠️ Gửi thông báo thất bại";
    }

    console.log(`[Offboard] Completed for ${fullName} (${email})`);

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        name: fullName,
        email,
        department: employee.department?.name,
      },
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Offboard] Failed:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Offboard failed" },
      { status: 500 }
    );
  }
}
