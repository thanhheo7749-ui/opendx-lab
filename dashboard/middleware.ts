// ==============================================================================
// OpenDX-Lab Dashboard - Auth Middleware
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect all routes except login, API auth, static assets
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
