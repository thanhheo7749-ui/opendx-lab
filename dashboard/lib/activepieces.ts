// ==============================================================================
// OpenDX-Lab Dashboard - Activepieces Webhook Helper
// SPDX-License-Identifier: GPL-3.0-or-later
// ==============================================================================

// ── Webhook Payload Builder ─────────────────────────────────────────────────

export function buildWorkflowWebhookPayload(input: {
  event: "employee.onboarding" | "employee.offboarding" | "employee.activation";
  workflowId: string;
  data: Record<string, unknown>;
}) {
  return {
    event: input.event,
    workflowId: input.workflowId,
    timestamp: new Date().toISOString(),
    data: input.data,
  };
}

// ── Generic Webhook Trigger ─────────────────────────────────────────────────

export type WebhookResult =
  | { ok: true; reason: "delivered"; status: number }
  | { ok: false; reason: "missing_webhook_url" }
  | { ok: false; reason: "webhook_failed"; status: number }
  | { ok: false; reason: "network_error"; errorMessage: string };

export async function triggerWorkflowWebhook(input: {
  webhookUrl?: string;
  payload: Record<string, unknown>;
}): Promise<WebhookResult> {
  if (!input.webhookUrl) {
    return { ok: false, reason: "missing_webhook_url" };
  }

  try {
    const response = await fetch(input.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.payload),
    });

    return response.ok
      ? { ok: true, reason: "delivered", status: response.status }
      : { ok: false, reason: "webhook_failed", status: response.status };
  } catch (error) {
    return {
      ok: false,
      reason: "network_error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ── Typed Workflow Triggers ─────────────────────────────────────────────────

export async function triggerOnboarding(employeeData: {
  workflowId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
}): Promise<WebhookResult> {
  const payload = buildWorkflowWebhookPayload({
    event: "employee.onboarding",
    workflowId: employeeData.workflowId,
    data: employeeData,
  });

  return triggerWorkflowWebhook({
    webhookUrl: process.env.ACTIVEPIECES_ONBOARDING_WEBHOOK_URL,
    payload,
  });
}

export async function triggerOffboarding(employeeData: {
  workflowId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}): Promise<WebhookResult> {
  const payload = buildWorkflowWebhookPayload({
    event: "employee.offboarding",
    workflowId: employeeData.workflowId,
    data: employeeData,
  });

  return triggerWorkflowWebhook({
    webhookUrl: process.env.ACTIVEPIECES_OFFBOARDING_WEBHOOK_URL,
    payload,
  });
}

export async function triggerActivation(employeeData: {
  workflowId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
}): Promise<WebhookResult> {
  const payload = buildWorkflowWebhookPayload({
    event: "employee.activation",
    workflowId: employeeData.workflowId,
    data: employeeData,
  });

  return triggerWorkflowWebhook({
    webhookUrl: process.env.ACTIVEPIECES_ACTIVATION_WEBHOOK_URL,
    payload,
  });
}
