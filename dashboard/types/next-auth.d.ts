// ==============================================================================
// OpenDX-Lab Dashboard - NextAuth Type Extensions
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    roles?: string[];
  }
}
