// ==============================================================================
// OpenDX-Lab Dashboard - Mattermost Integration
// SPDX-License-Identifier: GPL-3.0-or-later
//
// NOTE: External API calls in this module do not retry on failure.
// TODO: Add exponential backoff (p-retry) for production resilience.
//
// Provides:
//   - notifyStatusChange()  → Send status change notification via Incoming Webhook
//   - deactivateUser(email) → Deactivate a Mattermost user (offboarding)
//   - activateUser(email)   → Reactivate a Mattermost user (re-onboarding)
// ==============================================================================

const MATTERMOST_URL = process.env.MATTERMOST_URL ?? "http://mattermost:8065";
const MATTERMOST_WEBHOOK_URL =
  process.env.MATTERMOST_WEBHOOK_URL ?? "http://mattermost:8065/hooks/1tweywjun7dk9kph3qyyq4odjh";

// ── Admin Token Management ──────────────────────────────────────────────────

let cachedAdminToken: { token: string; expiresAt: number } | null = null;
let pendingTokenRequest: Promise<string> | null = null;

/**
 * Get admin session token via login.
 * Mattermost admin uses SSO, so we fall back to local socket or personal access token.
 * For now, we'll use the bot's personal access token approach.
 */
async function getAdminToken(): Promise<string> {
  // Reuse valid cached token (with 60s buffer)
  if (cachedAdminToken && Date.now() < cachedAdminToken.expiresAt - 60_000) {
    return cachedAdminToken.token;
  }

  // Prevent thundering herd: reuse in-flight request
  if (pendingTokenRequest) return pendingTokenRequest;

  pendingTokenRequest = fetchAdminToken().finally(() => {
    pendingTokenRequest = null;
  });

  return pendingTokenRequest;
}

async function fetchAdminToken(): Promise<string> {
  // Try logging in with local admin (non-SSO)
  // If SSO is enabled, this may fail — in that case, use MATTERMOST_ADMIN_TOKEN env var
  const envToken = process.env.MATTERMOST_ADMIN_TOKEN;
  if (envToken) {
    // Personal access tokens don't expire in normal usage, set 24h cache
    cachedAdminToken = { token: envToken, expiresAt: Date.now() + 86_400_000 };
    return envToken;
  }

  // Attempt login with admin credentials
  const res = await fetch(`${MATTERMOST_URL}/api/v4/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login_id: process.env.MATTERMOST_ADMIN_USER ?? "admin",
      password: process.env.MATTERMOST_ADMIN_PASSWORD ?? "admin123",
    }),
  });

  if (!res.ok) {
    throw new Error(`Mattermost admin login failed (${res.status})`);
  }

  const token = res.headers.get("token");
  if (!token) throw new Error("No token in Mattermost login response");

  // Mattermost session tokens last ~24h by default, cache for 12h
  cachedAdminToken = { token, expiresAt: Date.now() + 43_200_000 };
  return token;
}

// ── User Lifecycle ──────────────────────────────────────────────────────────

export interface MattermostResult {
  ok: boolean;
  action: "deactivated" | "activated" | "not_found" | "error";
  username?: string;
  error?: string;
}

/**
 * Find a Mattermost user by email.
 */
async function findUserByEmail(email: string): Promise<{ id: string; username: string; delete_at: number } | null> {
  try {
    const token = await getAdminToken();
    const res = await fetch(
      `${MATTERMOST_URL}/api/v4/users/email/${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MM user lookup failed (${res.status}): ${err}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`[mattermost] Error finding user ${email}:`, err);
    return null;
  }
}

/**
 * Deactivate a Mattermost user (offboarding).
 * Uses DELETE /api/v4/users/{user_id} which soft-deletes (deactivates).
 */
export async function deactivateUser(email: string): Promise<MattermostResult> {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      console.warn(`[mattermost] User not found for deactivation: ${email}`);
      return { ok: false, action: "not_found" };
    }

    if (user.delete_at > 0) {
      console.log(`[mattermost] User already deactivated: ${email}`);
      return { ok: true, action: "deactivated", username: user.username };
    }

    const token = await getAdminToken();
    const res = await fetch(`${MATTERMOST_URL}/api/v4/users/${user.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MM deactivate failed (${res.status}): ${err}`);
    }

    console.log(`[mattermost] Deactivated user: ${email} (${user.username})`);
    return { ok: true, action: "deactivated", username: user.username };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[mattermost] Error deactivating ${email}:`, msg);
    return { ok: false, action: "error", error: msg };
  }
}

/**
 * Reactivate a Mattermost user (re-onboarding).
 * Uses PUT /api/v4/users/{user_id}/active with active=true.
 */
export async function activateUser(email: string): Promise<MattermostResult> {
  try {
    const user = await findUserByEmail(email);
    if (!user) {
      console.warn(`[mattermost] User not found for activation: ${email}`);
      return { ok: false, action: "not_found" };
    }

    if (user.delete_at === 0) {
      console.log(`[mattermost] User already active: ${email}`);
      return { ok: true, action: "activated", username: user.username };
    }

    const token = await getAdminToken();
    const res = await fetch(`${MATTERMOST_URL}/api/v4/users/${user.id}/active`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ active: true }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`MM activate failed (${res.status}): ${err}`);
    }

    console.log(`[mattermost] Activated user: ${email} (${user.username})`);
    return { ok: true, action: "activated", username: user.username };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[mattermost] Error activating ${email}:`, msg);
    return { ok: false, action: "error", error: msg };
  }
}

// ── Notifications ───────────────────────────────────────────────────────────

interface StatusChangeNotification {
  employeeName: string;
  email: string;
  department: string;
  fromStatus: string;
  toStatus: string;
  keycloakResult?: string;
  mattermostResult?: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "✅ Hoạt động",
  ON_LEAVE: "🏖️ Nghỉ phép",
  TERMINATED: "⚠️ Nghỉ việc",
};

const STATUS_EMOJI: Record<string, string> = {
  ACTIVE: "🟢",
  ON_LEAVE: "🟡",
  TERMINATED: "🔴",
};

/**
 * Send a status change notification to Mattermost via Incoming Webhook.
 */
export async function notifyStatusChange(data: StatusChangeNotification): Promise<boolean> {
  const emoji = STATUS_EMOJI[data.toStatus] || "🔄";
  const fromLabel = STATUS_LABELS[data.fromStatus] || data.fromStatus;
  const toLabel = STATUS_LABELS[data.toStatus] || data.toStatus;

  // Build system actions summary
  let actionsText = "";
  if (data.toStatus === "TERMINATED") {
    actionsText = `\n\n**🔒 Hành động tự động:**\n- Keycloak SSO: ${data.keycloakResult ?? "N/A"}\n- Mattermost: ${data.mattermostResult ?? "N/A"}`;
  } else if (data.fromStatus === "TERMINATED" && data.toStatus === "ACTIVE") {
    actionsText = `\n\n**🔓 Hành động tự động:**\n- Keycloak SSO: ${data.keycloakResult ?? "N/A"}\n- Mattermost: ${data.mattermostResult ?? "N/A"}`;
  }

  const text = `${emoji} **Thay đổi trạng thái nhân viên**

| Thông tin | Chi tiết |
|:---|:---|
| Họ tên | ${data.employeeName} |
| Email | ${data.email} |
| Phòng ban | ${data.department} |
| Trạng thái cũ | ${fromLabel} |
| Trạng thái mới | ${toLabel} |${actionsText}`;

  try {
    const res = await fetch(MATTERMOST_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "DX-OS Bot",
        icon_url: "",
        text,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[mattermost] Failed to send notification: ${res.status} ${errText}`);
      return false;
    }

    console.log(`[mattermost] Status change notification sent for ${data.employeeName}`);
    return true;
  } catch (err) {
    console.error("[mattermost] Network error sending notification:", err);
    return false;
  }
}
