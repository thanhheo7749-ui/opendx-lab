// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Onboarding Page API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { buildOnboardingPage } from "@/lib/wiki/onboarding-page";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  try {
    const { fullName, department, position } = await request.json();

    if (!fullName || !department || !position) {
      return NextResponse.json(
        { error: "Thiếu thông tin: fullName, department, position" },
        { status: 400 }
      );
    }

    const page = buildOnboardingPage({ fullName, department, position });
    return NextResponse.json(page);
  } catch (error) {
    console.error("[knowledge/onboarding-page] Error:", error);
    return NextResponse.json(
      { error: "Không thể tạo trang onboarding" },
      { status: 500 }
    );
  }
}
