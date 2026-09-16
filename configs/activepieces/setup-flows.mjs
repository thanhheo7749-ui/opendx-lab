// ==============================================================================
// OpenDX-Lab / ShopWise
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

// ==============================================================================
// OpenDX-Lab - Activepieces Workflow Setup Script
// Creates Employee Onboarding + Offboarding flows via API
// ==============================================================================

const AP_URL = "http://localhost:5678";
const AP_EMAIL = "admin@opendx-lab.local";
const AP_PASSWORD = "admin123456AZ@";

async function main() {
  // 1. Login
  console.log("🔑 Logging in to Activepieces...");
  const loginRes = await fetch(`${AP_URL}/api/v1/authentication/sign-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: AP_EMAIL, password: AP_PASSWORD }),
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  const projectId = loginData.projectId;
  console.log(`  ✅ Logged in. Project: ${projectId}`);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 2. Create Onboarding Flow
  console.log("\n📋 Creating Employee Onboarding flow...");
  const onboardingFlow = await fetch(`${AP_URL}/api/v1/flows`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      displayName: "Employee Onboarding",
      projectId,
    }),
  });
  const onboardingData = await onboardingFlow.json();
  console.log(`  ✅ Flow created: ${onboardingData.id}`);

  // Update with trigger + actions
  const onboardingVersion = {
    ...onboardingData.version,
    displayName: "Employee Onboarding",
    trigger: {
      name: "trigger",
      valid: true,
      displayName: "Webhook - New Employee",
      type: "PIECE_TRIGGER",
      settings: {
        pieceName: "@activepieces/piece-webhook",
        pieceVersion: "~0.4.0",
        triggerName: "catch_request",
        input: {},
      },
      nextAction: {
        name: "step_1",
        displayName: "Create Keycloak Account",
        type: "CODE",
        valid: true,
        settings: {
          sourceCode: {
            code: `
// Step 1: Create SSO account in Keycloak
export const code = async (inputs) => {
  const { firstName, lastName, email, department, position } = inputs;
  
  const keycloakUrl = "http://keycloak:8080";
  const realm = "opendx";
  
  // Get admin token
  const tokenRes = await fetch(keycloakUrl + "/realms/master/protocol/openid-connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&client_id=admin-cli&client_secret=admin",
  });
  
  if (!tokenRes.ok) {
    return { success: false, error: "Failed to get Keycloak token" };
  }
  
  const { access_token } = await tokenRes.json();
  
  // Create user
  const createRes = await fetch(keycloakUrl + "/admin/realms/" + realm + "/users", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + access_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: email,
      email: email,
      firstName: firstName,
      lastName: lastName,
      enabled: true,
      credentials: [{ type: "password", value: "Welcome@123", temporary: true }],
      attributes: { department: [department], position: [position] },
    }),
  });
  
  return {
    success: createRes.ok || createRes.status === 409,
    status: createRes.status,
    message: createRes.ok ? "User created" : "User may already exist",
    employee: { firstName, lastName, email, department, position },
  };
};
`,
            packageJson: "{}",
          },
          input: {
            firstName: "{{trigger.body.data.firstName}}",
            lastName: "{{trigger.body.data.lastName}}",
            email: "{{trigger.body.data.email}}",
            department: "{{trigger.body.data.department}}",
            position: "{{trigger.body.data.position}}",
          },
        },
        nextAction: {
          name: "step_2",
          displayName: "Notify Mattermost",
          type: "CODE",
          valid: true,
          settings: {
            sourceCode: {
              code: `
// Step 2: Send welcome message to Mattermost
export const code = async (inputs) => {
  const { firstName, lastName, email, department, position } = inputs;
  
  const webhookUrl = "http://mattermost:8065/hooks/onboarding";
  
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "town-square",
        username: "OpenDX Bot",
        icon_emoji: ":wave:",
        text: "🎉 **Chào mừng nhân viên mới!**\\n\\n" +
              "👤 **" + firstName + " " + lastName + "**\\n" +
              "📧 " + email + "\\n" +
              "🏢 " + department + " — " + position + "\\n\\n" +
              "Tài khoản SSO đã được tạo tự động. Mật khẩu tạm: \`Welcome@123\`",
      }),
    });
    return { notified: res.ok, status: res.status };
  } catch (e) {
    return { notified: false, error: String(e) };
  }
};
`,
              packageJson: "{}",
            },
            input: {
              firstName: "{{trigger.body.data.firstName}}",
              lastName: "{{trigger.body.data.lastName}}",
              email: "{{trigger.body.data.email}}",
              department: "{{trigger.body.data.department}}",
              position: "{{trigger.body.data.position}}",
            },
          },
        },
      },
    },
  };

  await fetch(`${AP_URL}/api/v1/flows/${onboardingData.id}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "LOCK_AND_PUBLISH",
      request: onboardingVersion,
    }),
  });
  console.log("  ✅ Onboarding flow published");

  // 3. Create Offboarding Flow
  console.log("\n📋 Creating Employee Offboarding flow...");
  const offboardingFlow = await fetch(`${AP_URL}/api/v1/flows`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      displayName: "Employee Offboarding",
      projectId,
    }),
  });
  const offboardingData = await offboardingFlow.json();
  console.log(`  ✅ Flow created: ${offboardingData.id}`);

  // Update with trigger + actions
  const offboardingVersion = {
    ...offboardingData.version,
    displayName: "Employee Offboarding",
    trigger: {
      name: "trigger",
      valid: true,
      displayName: "Webhook - Employee Terminated",
      type: "PIECE_TRIGGER",
      settings: {
        pieceName: "@activepieces/piece-webhook",
        pieceVersion: "~0.4.0",
        triggerName: "catch_request",
        input: {},
      },
      nextAction: {
        name: "step_1",
        displayName: "Disable Keycloak Account",
        type: "CODE",
        valid: true,
        settings: {
          sourceCode: {
            code: `
// Step 1: Disable SSO account in Keycloak
export const code = async (inputs) => {
  const { firstName, lastName, email, department } = inputs;
  
  const keycloakUrl = "http://keycloak:8080";
  const realm = "opendx";
  
  // Get admin token
  const tokenRes = await fetch(keycloakUrl + "/realms/master/protocol/openid-connect/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&client_id=admin-cli&client_secret=admin",
  });
  
  if (!tokenRes.ok) return { success: false, error: "Failed to get Keycloak token" };
  const { access_token } = await tokenRes.json();
  
  // Find user by email
  const searchRes = await fetch(
    keycloakUrl + "/admin/realms/" + realm + "/users?email=" + encodeURIComponent(email),
    { headers: { Authorization: "Bearer " + access_token } }
  );
  const users = await searchRes.json();
  
  if (!users.length) return { success: false, error: "User not found" };
  
  // Disable user
  const userId = users[0].id;
  const disableRes = await fetch(
    keycloakUrl + "/admin/realms/" + realm + "/users/" + userId,
    {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...users[0], enabled: false }),
    }
  );
  
  return {
    success: disableRes.ok,
    message: disableRes.ok ? "User disabled" : "Failed to disable",
    employee: { firstName, lastName, email, department },
  };
};
`,
            packageJson: "{}",
          },
          input: {
            firstName: "{{trigger.body.data.firstName}}",
            lastName: "{{trigger.body.data.lastName}}",
            email: "{{trigger.body.data.email}}",
            department: "{{trigger.body.data.department}}",
          },
        },
        nextAction: {
          name: "step_2",
          displayName: "Notify Mattermost - Offboarding",
          type: "CODE",
          valid: true,
          settings: {
            sourceCode: {
              code: `
// Step 2: Send offboarding notification to Mattermost
export const code = async (inputs) => {
  const { firstName, lastName, email, department } = inputs;
  
  const webhookUrl = "http://mattermost:8065/hooks/offboarding";
  
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "town-square",
        username: "OpenDX Bot",
        icon_emoji: ":wave:",
        text: "👋 **Thông báo nghỉ việc**\\n\\n" +
              "👤 **" + firstName + " " + lastName + "** (" + department + ")\\n" +
              "📧 " + email + "\\n\\n" +
              "Tài khoản SSO đã được vô hiệu hóa tự động.",
      }),
    });
    return { notified: res.ok, status: res.status };
  } catch (e) {
    return { notified: false, error: String(e) };
  }
};
`,
              packageJson: "{}",
            },
            input: {
              firstName: "{{trigger.body.data.firstName}}",
              lastName: "{{trigger.body.data.lastName}}",
              email: "{{trigger.body.data.email}}",
              department: "{{trigger.body.data.department}}",
            },
          },
        },
      },
    },
  };

  await fetch(`${AP_URL}/api/v1/flows/${offboardingData.id}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      type: "LOCK_AND_PUBLISH",
      request: offboardingVersion,
    }),
  });
  console.log("  ✅ Offboarding flow published");

  console.log("\n🎉 All workflows created successfully!");
  console.log("   Onboarding:  POST webhook → Create Keycloak user → Notify Mattermost");
  console.log("   Offboarding: POST webhook → Disable Keycloak user → Notify Mattermost");
}

main().catch(console.error);
