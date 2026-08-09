// ==============================================================================
// OpenDX-Lab Dashboard - NextAuth.js Configuration
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

// ---------------------------------------------------------------------------
// Docker networking: The container uses `extra_hosts` to map `localhost` to
// the Docker host gateway, so it can reach Keycloak at localhost:8080 just
// like the browser does. This avoids the dual-hostname issuer mismatch.
// ---------------------------------------------------------------------------
const issuer = process.env.KEYCLOAK_ISSUER!; // http://localhost:8080/realms/opendx

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer,
    }),
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Extract Keycloak realm roles
        const keycloakProfile = profile as Record<string, unknown>;
        const realmAccess = keycloakProfile.realm_access as
          | { roles?: string[] }
          | undefined;
        token.roles = realmAccess?.roles ?? [];
        token.sub = profile.sub as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.roles = (token.roles as string[]) ?? [];
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});
