// ==============================================================================
// OpenDX-Lab Dashboard - Activity Logging Helper
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { prisma } from "@/lib/prisma";

/**
 * Log an activity event to the database.
 * This is a fire-and-forget operation — errors are silently caught.
 */
export async function logActivity(
  type: string,
  message: string,
  userId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        type,
        message,
        userId: userId ?? null,
        metadata: metadata as any,
      },
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
