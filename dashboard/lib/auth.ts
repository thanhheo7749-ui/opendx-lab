// ==============================================================================
// ShopWise — NextAuth.js Configuration (Keycloak OIDC)
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

// ---------------------------------------------------------------------------
// Docker dual-hostname fix:
// - Browser redirects to http://localhost:8080 (KEYCLOAK_ISSUER)
// - Server-side token exchange uses http://keycloak:8080 (KEYCLOAK_ISSUER_INTERNAL)
//
// We configure the provider's `issuer` with the browser URL so the
// authorization_endpoint (browser redirect) works correctly.
// Then we override the `token` and `userinfo` endpoints to use the
// internal Docker hostname so the server-side calls work.
// ---------------------------------------------------------------------------

const browserIssuer = process.env.KEYCLOAK_ISSUER!; // http://localhost:8080/realms/opendx
const internalIssuer = process.env.KEYCLOAK_ISSUER_INTERNAL || browserIssuer; // http://keycloak:8080/realms/opendx

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: browserIssuer,
      // Override server-side endpoints to use internal Docker hostname
      token: `${internalIssuer}/protocol/openid-connect/token`,
      userinfo: {
        url: `${internalIssuer}/protocol/openid-connect/userinfo`,
      },
      jwks_endpoint: `${internalIssuer}/protocol/openid-connect/certs`,
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
