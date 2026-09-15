// ==============================================================================
// OpenDX-Lab Dashboard - Keycloak Admin API Client
// SPDX-License-Identifier: GPL-3.0-or-later
//
// NOTE: External API calls in this module do not retry on failure.
// TODO: Add exponential backoff (p-retry) for production resilience.
//
// Provides admin operations for user lifecycle management:
//   - disableUser(email)  → Set enabled=false (offboarding)
//   - enableUser(email)   → Set enabled=true (re-activation)
//
// Uses Resource Owner Password Grant to get admin token.
// ==============================================================================

const KEYCLOAK_URL = process.env.KEYCLOAK_URL ?? "http://keycloak:8080";
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN ?? "admin";
const KEYCLOAK_ADMIN_PASSWORD = process.env.KEYCLOAK_ADMIN_PASSWORD ?? "admin123";
const KEYCLOAK_REALM = "opendx";

// Cache admin token to avoid repeated auth calls
let cachedToken: { token: string; expiresAt: number } | null = null;
let pendingTokenRequest: Promise<string> | null = null;

/**
 * Get an admin access token from Keycloak master realm.
 */
async function getAdminToken(): Promise<string> {
  // Reuse valid cached token (with 30s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token;
  }

  // Prevent thundering herd: reuse in-flight request
  if (pendingTokenRequest) return pendingTokenRequest;

  pendingTokenRequest = fetchAdminToken().finally(() => {
    pendingTokenRequest = null;
  });

  return pendingTokenRequest;
}

async function fetchAdminToken(): Promise<string> {
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: "admin-cli",
        username: KEYCLOAK_ADMIN,
        password: KEYCLOAK_ADMIN_PASSWORD,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Keycloak admin auth failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Find a Keycloak user by email in the opendx realm.
 * Returns the user object or null if not found.
 */
async function findUserByEmail(
  email: string
): Promise<{ id: string; enabled: boolean; username: string } | null> {
  const token = await getAdminToken();
  const res = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?email=${encodeURIComponent(email)}&exact=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Keycloak user lookup failed (${res.status}): ${err}`);
  }

  const users = await res.json();
  return users.length > 0 ? users[0] : null;
}

/**
 * Update a Keycloak user's enabled status.
 */
async function setUserEnabled(userId: string, enabled: boolean): Promise<void> {
  const token = await getAdminToken();
  const res = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${userId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(
      `Keycloak user ${enabled ? "enable" : "disable"} failed (${res.status}): ${err}`
    );
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface KeycloakResult {
  ok: boolean;
  action: "disabled" | "enabled" | "not_found" | "error";
  username?: string;
  error?: string;
}

/**
 * Disable a Keycloak user by email (offboarding).
 * The account is preserved for audit trail, but login is blocked.
 */
export async function disableUser(email: string): Promise<KeycloakResult> {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      console.warn(`[keycloak] User not found: ${email}`);
      return { ok: false, action: "not_found" };
    }

    if (!user.enabled) {
      console.log(`[keycloak] User already disabled: ${email}`);
      return { ok: true, action: "disabled", username: user.username };
    }

    await setUserEnabled(user.id, false);
    console.log(`[keycloak] Disabled user: ${email} (${user.username})`);
    return { ok: true, action: "disabled", username: user.username };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[keycloak] Error disabling user ${email}:`, msg);
    return { ok: false, action: "error", error: msg };
  }
}

/**
 * Enable a Keycloak user by email (re-activation).
 */
export async function enableUser(email: string): Promise<KeycloakResult> {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      console.warn(`[keycloak] User not found: ${email}`);
      return { ok: false, action: "not_found" };
    }

    if (user.enabled) {
      console.log(`[keycloak] User already enabled: ${email}`);
      return { ok: true, action: "enabled", username: user.username };
    }

    await setUserEnabled(user.id, true);
    console.log(`[keycloak] Enabled user: ${email} (${user.username})`);
    return { ok: true, action: "enabled", username: user.username };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[keycloak] Error enabling user ${email}:`, msg);
    return { ok: false, action: "error", error: msg };
  }
}
