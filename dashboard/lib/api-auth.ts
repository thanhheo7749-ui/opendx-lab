// ==============================================================================
// OpenDX-Lab Dashboard - API Route Authentication Helpers
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Require authenticated session for API routes.
 * Returns the session if authenticated, or a 401 Response.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true as const, session };
}

/**
 * Require authenticated session with specific role.
 * Returns 401 if not authenticated, 403 if missing required role.
 */
export async function requireRole(role: string) {
  const session = await auth();
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!session.user.roles?.includes(role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true as const, session };
}
