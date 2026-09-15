// ==============================================================================
// OpenDX-Lab Dashboard - Metabase Embed Token API
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import jwt from "jsonwebtoken";

const METABASE_SECRET_KEY = process.env.METABASE_SECRET_KEY || "";
const METABASE_SITE_URL = process.env.METABASE_SITE_URL || "http://localhost:3300";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { searchParams } = new URL(request.url);
  const dashboardId = parseInt(searchParams.get("dashboard") || "1", 10);

  if (!METABASE_SECRET_KEY) {
    return NextResponse.json(
      { error: "METABASE_SECRET_KEY is not configured" },
      { status: 500 },
    );
  }

  // Metabase requires a 64-character hex-encoded key. If METABASE_SECRET_KEY
  // is configured as a plain ASCII string (like the default "metabase_dashboard_embed_secret_"),
  // we automatically encode it to hex to match the key configured in Metabase.
  let signingKey = METABASE_SECRET_KEY;
  if (!/^[0-9a-fA-F]{64}$/.test(signingKey)) {
    signingKey = Buffer.from(signingKey, "utf-8").toString("hex");
  }

  const payload = {
    resource: { dashboard: dashboardId },
    params: {},
    exp: Math.round(Date.now() / 1000) + 10 * 60, // 10 min
  };

  const token = jwt.sign(payload, signingKey);

  return NextResponse.json({
    iframeUrl: `${METABASE_SITE_URL}/embed/dashboard/${token}#bordered=false&titled=true`,
  });
}
