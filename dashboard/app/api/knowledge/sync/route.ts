// ==============================================================================
// OpenDX-Lab Dashboard - Knowledge: Wiki.js Sync API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { syncFromWikiJs } from "@/lib/knowledge/wikijs-sync";

export async function POST() {
  try {
    const result = await syncFromWikiJs();

    return NextResponse.json({
      success: true,
      ...result,
      message: `Đồng bộ hoàn tất: ${result.synced} mới, ${result.updated} cập nhật, ${result.skipped} bỏ qua.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[knowledge/sync] Error:", message);
    return NextResponse.json(
      { error: `Đồng bộ thất bại: ${message}` },
      { status: 500 }
    );
  }
}
