# OpenDX-Lab Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade OpenDX-Lab from an integration demo into a business-facing digital operations platform centered on realistic onboarding/offboarding, workflow observability, and AI-assisted internal operations.

**Architecture:** Extend the existing Next.js Dashboard + Prisma + Activepieces + Keycloak + Wiki.js stack instead of replacing it. Add workflow execution tracking in the Dashboard database, surface workflow state through APIs and UI, then evolve AI Chat from SQL-only Q&A into a workflow-aware and knowledge-aware operations assistant that can explain status and recommend next actions.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, PostgreSQL, Activepieces webhooks, Ollama, existing Graph RAG knowledge stack, Keycloak OIDC, Wiki.js integration.

---

## File Structure Map

### Existing files to modify

- `dashboard/prisma/schema.prisma` — add workflow execution models, onboarding step models, optional knowledge linkage, and approval-ready status fields.
- `dashboard/app/api/employees/route.ts` — validate duplicate employee inputs, create workflow execution records, trigger onboarding via a tracked operation.
- `dashboard/app/api/employees/[id]/route.ts` — trigger tracked offboarding and activation flows, write workflow-related audit logs.
- `dashboard/lib/activepieces.ts` — centralize webhook triggers, add correlation IDs, normalize payloads, and return structured results.
- `dashboard/lib/activity.ts` — standardize activity logging helpers for workflow, AI, and employee events.
- `dashboard/app/api/dashboard/route.ts` — expose workflow counts, pending approvals, failed steps, and operational summaries.
- `dashboard/app/(dashboard)/workflows/page.tsx` — replace static cards with tracked workflow state and failure/approval visibility.
- `dashboard/app/api/ai/chat/route.ts` — add workflow-status questions, source summaries, next-action suggestions, and safer routing.
- `dashboard/lib/knowledge/rag-query.ts` — support knowledge results that can be summarized as sources for AI answers.
- `dashboard/app/(dashboard)/ai-chat/page.tsx` — render source summaries, suggested next actions, and richer operations-oriented prompts.
- `dashboard/app/(dashboard)/page.tsx` — surface operational KPIs tied to onboarding/offboarding and workflow state.
- `docs/demo-script.md` — update demo story to focus on fragmented operations and flagship workflow proof.
- `docs/architecture.md` — update architecture and flow docs to include tracked workflow execution, failure handling, and AI operations assistance.

### New files to create

- `dashboard/prisma/migrations/<timestamp>_workflow_tracking/migration.sql` — schema migration for workflow tracking.
- `dashboard/lib/workflows/types.ts` — shared workflow step, execution, and summary types.
- `dashboard/lib/workflows/service.ts` — create/update workflow execution records and step transitions.
- `dashboard/lib/workflows/onboarding.ts` — orchestration helper for onboarding execution lifecycle.
- `dashboard/lib/workflows/offboarding.ts` — orchestration helper for offboarding execution lifecycle.
- `dashboard/app/api/workflows/route.ts` — list tracked workflows with filtering by status and type.
- `dashboard/app/api/workflows/[id]/route.ts` — fetch workflow detail and allow safe retry/resolve actions if implemented.
- `dashboard/app/api/workflows/summary/route.ts` — lightweight workflow counts for dashboard cards and AI health.
- `dashboard/components/workflows/WorkflowStatusCard.tsx` — workflow card component with counts and status badges.
- `dashboard/components/workflows/WorkflowExecutionTable.tsx` — tabular view of recent workflow executions.
- `dashboard/components/workflows/WorkflowExecutionTimeline.tsx` — step-by-step execution detail.
- `dashboard/components/ai/SourceSummary.tsx` — display AI answer sources and confidence framing.
- `dashboard/components/ai/NextActionChips.tsx` — render suggested next actions from AI responses.
- `dashboard/lib/ai/workflow-query.ts` — answer operational workflow questions from Prisma data.
- `dashboard/lib/ai/source-summary.ts` — normalize AI answer source metadata across DB/workflow/knowledge results.
- `dashboard/lib/wiki/onboarding-page.ts` — helper for onboarding wiki-page creation payloads and naming rules.
- `dashboard/app/api/knowledge/onboarding-page/route.ts` — endpoint or internal route to create/update onboarding SOP pages if the integration is wired in-app.
- `docs/superpowers/specs/2026-08-08-opendx-upgrade-design.md` — already approved source spec; do not modify unless spec changes.

### Tests to create

- `dashboard/lib/workflows/service.test.ts` — workflow record creation and step transitions.
- `dashboard/lib/activepieces.test.ts` — webhook payload normalization and error handling.
- `dashboard/app/api/employees/route.test.ts` — onboarding creation path, duplicate-email rejection, tracked workflow bootstrap.
- `dashboard/app/api/employees/[id]/route.test.ts` — offboarding path and workflow tracking.
- `dashboard/app/api/workflows/summary/route.test.ts` — workflow summary aggregation.
- `dashboard/lib/ai/workflow-query.test.ts` — workflow-aware AI answer data assembly.
- `dashboard/app/api/ai/chat/route.test.ts` — workflow question routing, source summaries, and next-action suggestions.

---

## Delivery Phases and Importance

### Phase 1 — Critical / P1
Build business-realistic workflow tracking for onboarding and offboarding. This is the most important phase because it turns the current happy-path demo into a defensible enterprise operations story.

### Phase 2 — High / P1
Upgrade AI Chat into an operations assistant that understands workflow state, explains its sources, and recommends next actions.

### Phase 3 — High / P1-P2
Connect knowledge and SOP support to onboarding so the wiki layer becomes part of the business flow instead of a parallel feature.

### Phase 4 — Medium / P2
Improve dashboard observability, role-oriented operational visibility, and demo/documentation alignment.

### Phase 5 — Optional / P3
Extend to approval-based workflows and broader operational templates once the flagship flow is solid.

---

## Phase 1 — Workflow Tracking and Operational Reality (Critical / P1)

### Task 1: Add workflow execution schema

**Files:**
- Modify: `dashboard/prisma/schema.prisma`
- Create: `dashboard/prisma/migrations/<timestamp>_workflow_tracking/migration.sql`
- Test: `dashboard/lib/workflows/service.test.ts`

- [ ] **Step 1: Write the failing workflow service test**

```ts
import { describe, expect, it } from "node:test";
import { createWorkflowExecutionRecord } from "@/lib/workflows/service";

describe("createWorkflowExecutionRecord", () => {
  it("creates a pending onboarding workflow with an initial step", async () => {
    const result = await createWorkflowExecutionRecord({
      type: "ONBOARDING",
      employeeId: "emp_123",
      initiatedBy: "system",
      payload: { email: "demo@opendx.local" },
    });

    expect(result.type).toBe("ONBOARDING");
    expect(result.status).toBe("PENDING");
    expect(result.steps[0]?.stepKey).toBe("employee_record_created");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/lib/workflows/service.test.ts`
Expected: FAIL with module or function not found for `@/lib/workflows/service`

- [ ] **Step 3: Add Prisma models and enums in schema**

```prisma
model WorkflowExecution {
  id          String                 @id @default(cuid())
  type        WorkflowType
  status      WorkflowExecutionStatus @default(PENDING)
  employeeId  String?
  payload     Json                   @default("{}")
  summary     String?
  initiatedBy String?
  startedAt   DateTime               @default(now())
  finishedAt  DateTime?
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt
  steps       WorkflowStepExecution[]

  @@index([type, status])
  @@index([employeeId])
  @@map("workflow_executions")
}

model WorkflowStepExecution {
  id          String                 @id @default(cuid())
  workflowId  String
  stepKey     String
  title       String
  owner       String?
  status      WorkflowExecutionStatus @default(PENDING)
  details     Json                   @default("{}")
  errorCode   String?
  errorMessage String?
  startedAt   DateTime               @default(now())
  finishedAt  DateTime?
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt

  workflow WorkflowExecution @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@index([workflowId, status])
  @@map("workflow_step_executions")
}

enum WorkflowType {
  ONBOARDING
  OFFBOARDING
  ACTIVATION
}

enum WorkflowExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  WAITING_APPROVAL
  NEEDS_RETRY
}
```

- [ ] **Step 4: Create the migration SQL**

```sql
CREATE TYPE "WorkflowType" AS ENUM ('ONBOARDING', 'OFFBOARDING', 'ACTIVATION');
CREATE TYPE "WorkflowExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'WAITING_APPROVAL', 'NEEDS_RETRY');

CREATE TABLE "workflow_executions" (
  "id" TEXT PRIMARY KEY,
  "type" "WorkflowType" NOT NULL,
  "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "employeeId" TEXT,
  "payload" JSONB NOT NULL DEFAULT '{}',
  "summary" TEXT,
  "initiatedBy" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "workflow_step_executions" (
  "id" TEXT PRIMARY KEY,
  "workflowId" TEXT NOT NULL REFERENCES "workflow_executions"("id") ON DELETE CASCADE,
  "stepKey" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "owner" TEXT,
  "status" "WorkflowExecutionStatus" NOT NULL DEFAULT 'PENDING',
  "details" JSONB NOT NULL DEFAULT '{}',
  "errorCode" TEXT,
  "errorMessage" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "workflow_executions_type_status_idx" ON "workflow_executions"("type", "status");
CREATE INDEX "workflow_executions_employeeId_idx" ON "workflow_executions"("employeeId");
CREATE INDEX "workflow_step_executions_workflowId_status_idx" ON "workflow_step_executions"("workflowId", "status");
```

- [ ] **Step 5: Run Prisma format and generate**

Run: `npx prisma format && npx prisma generate`
Expected: Prisma schema formats successfully and Prisma Client regenerates without errors.

- [ ] **Step 6: Commit**

```bash
git add dashboard/prisma/schema.prisma dashboard/prisma/migrations
git commit -m "feat: add workflow execution schema"
```

### Task 2: Build workflow service helpers

**Files:**
- Create: `dashboard/lib/workflows/types.ts`
- Create: `dashboard/lib/workflows/service.ts`
- Test: `dashboard/lib/workflows/service.test.ts`

- [ ] **Step 1: Expand the failing test to cover step transitions**

```ts
import { describe, expect, it } from "node:test";
import {
  createWorkflowExecutionRecord,
  updateWorkflowStepStatus,
} from "@/lib/workflows/service";

describe("workflow service", () => {
  it("marks a step failed and updates the workflow status", async () => {
    const workflow = await createWorkflowExecutionRecord({
      type: "OFFBOARDING",
      employeeId: "emp_terminate_1",
      initiatedBy: "admin",
      payload: { email: "old@opendx.local" },
    });

    const updated = await updateWorkflowStepStatus({
      workflowId: workflow.id,
      stepKey: "disable_sso_account",
      status: "FAILED",
      errorCode: "KEYCLOAK_TIMEOUT",
      errorMessage: "Keycloak API timed out",
    });

    expect(updated.status).toBe("FAILED");
    expect(updated.steps.some((step) => step.errorCode === "KEYCLOAK_TIMEOUT")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/lib/workflows/service.test.ts`
Expected: FAIL because `updateWorkflowStepStatus` does not exist yet.

- [ ] **Step 3: Create workflow shared types**

```ts
export type WorkflowRecordType = "ONBOARDING" | "OFFBOARDING" | "ACTIVATION";
export type WorkflowRecordStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "WAITING_APPROVAL"
  | "NEEDS_RETRY";

export interface WorkflowSeedStep {
  stepKey: string;
  title: string;
  owner?: string;
  status?: WorkflowRecordStatus;
  details?: Record<string, unknown>;
}
```

- [ ] **Step 4: Implement workflow service helpers**

```ts
import { prisma } from "@/lib/prisma";
import type { WorkflowRecordType, WorkflowRecordStatus, WorkflowSeedStep } from "@/lib/workflows/types";

const DEFAULT_STEPS: Record<WorkflowRecordType, WorkflowSeedStep[]> = {
  ONBOARDING: [
    { stepKey: "employee_record_created", title: "Employee record created", status: "COMPLETED" },
    { stepKey: "create_sso_account", title: "Create SSO account" },
    { stepKey: "send_welcome_notification", title: "Send welcome notification" },
    { stepKey: "create_onboarding_page", title: "Create onboarding page" },
    { stepKey: "notify_manager", title: "Notify manager" },
  ],
  OFFBOARDING: [
    { stepKey: "request_received", title: "Offboarding request received", status: "COMPLETED" },
    { stepKey: "disable_sso_account", title: "Disable SSO account" },
    { stepKey: "notify_team", title: "Notify team" },
    { stepKey: "archive_knowledge", title: "Archive knowledge ownership" },
  ],
  ACTIVATION: [
    { stepKey: "request_received", title: "Activation request received", status: "COMPLETED" },
    { stepKey: "enable_sso_account", title: "Enable SSO account" },
    { stepKey: "notify_team", title: "Notify team" },
  ],
};

export async function createWorkflowExecutionRecord(input: {
  type: WorkflowRecordType;
  employeeId?: string;
  initiatedBy?: string;
  payload?: Record<string, unknown>;
}) {
  return prisma.workflowExecution.create({
    data: {
      type: input.type,
      employeeId: input.employeeId,
      initiatedBy: input.initiatedBy,
      payload: input.payload ?? {},
      steps: {
        create: DEFAULT_STEPS[input.type].map((step) => ({
          stepKey: step.stepKey,
          title: step.title,
          owner: step.owner,
          status: step.status ?? "PENDING",
          details: step.details ?? {},
        })),
      },
    },
    include: { steps: true },
  });
}

export async function updateWorkflowStepStatus(input: {
  workflowId: string;
  stepKey: string;
  status: WorkflowRecordStatus;
  details?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
}) {
  await prisma.workflowStepExecution.updateMany({
    where: { workflowId: input.workflowId, stepKey: input.stepKey },
    data: {
      status: input.status,
      details: input.details ?? {},
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      finishedAt: ["COMPLETED", "FAILED", "NEEDS_RETRY"].includes(input.status) ? new Date() : null,
    },
  });

  const nextWorkflowStatus = input.status === "FAILED" ? "FAILED" : input.status === "NEEDS_RETRY" ? "NEEDS_RETRY" : "RUNNING";

  return prisma.workflowExecution.update({
    where: { id: input.workflowId },
    data: { status: nextWorkflowStatus },
    include: { steps: true },
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- dashboard/lib/workflows/service.test.ts`
Expected: PASS for workflow record creation and step status transitions.

- [ ] **Step 6: Commit**

```bash
git add dashboard/lib/workflows/types.ts dashboard/lib/workflows/service.ts dashboard/lib/workflows/service.test.ts
git commit -m "feat: add workflow tracking service"
```

### Task 3: Normalize Activepieces webhook triggers with correlation IDs

**Files:**
- Modify: `dashboard/lib/activepieces.ts`
- Create: `dashboard/lib/activepieces.test.ts`
- Modify: `dashboard/lib/workflows/onboarding.ts`
- Modify: `dashboard/lib/workflows/offboarding.ts`

- [ ] **Step 1: Write the failing webhook helper test**

```ts
import { describe, expect, it } from "node:test";
import { buildWorkflowWebhookPayload } from "@/lib/activepieces";

describe("buildWorkflowWebhookPayload", () => {
  it("includes workflowId, event type, and employee data", () => {
    const payload = buildWorkflowWebhookPayload({
      event: "employee.onboarding",
      workflowId: "wf_123",
      data: { email: "demo@opendx.local", department: "Kỹ thuật" },
    });

    expect(payload.workflowId).toBe("wf_123");
    expect(payload.event).toBe("employee.onboarding");
    expect(payload.data.email).toBe("demo@opendx.local");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/lib/activepieces.test.ts`
Expected: FAIL because `buildWorkflowWebhookPayload` does not exist.

- [ ] **Step 3: Add normalized webhook payload builder**

```ts
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
```

- [ ] **Step 4: Refactor trigger helpers to return structured results**

```ts
export async function triggerWorkflowWebhook(input: {
  webhookUrl?: string;
  payload: Record<string, unknown>;
}) {
  if (!input.webhookUrl) {
    return { ok: false, reason: "missing_webhook_url" as const };
  }

  try {
    const response = await fetch(input.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.payload),
    });

    return {
      ok: response.ok,
      reason: response.ok ? "delivered" as const : "webhook_failed" as const,
      status: response.status,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "network_error" as const,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

- [ ] **Step 5: Update onboarding/offboarding orchestration callers**

```ts
const payload = buildWorkflowWebhookPayload({
  event: "employee.onboarding",
  workflowId,
  data: employeeData,
});

const webhookResult = await triggerWorkflowWebhook({
  webhookUrl: process.env.ACTIVEPIECES_ONBOARDING_WEBHOOK_URL,
  payload,
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- dashboard/lib/activepieces.test.ts`
Expected: PASS and payload contains the workflow correlation ID.

- [ ] **Step 7: Commit**

```bash
git add dashboard/lib/activepieces.ts dashboard/lib/activepieces.test.ts dashboard/lib/workflows/onboarding.ts dashboard/lib/workflows/offboarding.ts
git commit -m "feat: normalize workflow webhook payloads"
```

### Task 4: Track onboarding from employee creation API

**Files:**
- Modify: `dashboard/app/api/employees/route.ts`
- Modify: `dashboard/lib/activity.ts`
- Test: `dashboard/app/api/employees/route.test.ts`

- [ ] **Step 1: Write the failing employee route test**

```ts
import { describe, expect, it } from "node:test";
import { POST } from "@/app/api/employees/route";

const requestBody = {
  firstName: "Nguyễn",
  lastName: "Demo",
  email: "demo@opendx.local",
  position: "Developer",
  departmentId: "dep_1",
};

describe("POST /api/employees", () => {
  it("creates a workflow execution when onboarding starts", async () => {
    const request = new Request("http://localhost:3000/api/employees", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.workflowId).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/app/api/employees/route.test.ts`
Expected: FAIL because the route response does not contain `workflowId`.

- [ ] **Step 3: Add duplicate email validation before create**

```ts
const existingEmployee = await prisma.employee.findUnique({ where: { email } });
if (existingEmployee) {
  return NextResponse.json(
    { error: "Email nhân viên đã tồn tại" },
    { status: 409 }
  );
}
```

- [ ] **Step 4: Create workflow execution and enrich response**

```ts
const workflow = await createWorkflowExecutionRecord({
  type: "ONBOARDING",
  employeeId: employee.id,
  initiatedBy: "dashboard_api",
  payload: {
    firstName,
    lastName,
    email,
    departmentId,
    position,
  },
});

await logActivity("WORKFLOW_STARTED", `Khởi tạo onboarding cho ${firstName} ${lastName}`, undefined, {
  workflowId: workflow.id,
  employeeId: employee.id,
  workflowType: workflow.type,
});
```

- [ ] **Step 5: Trigger onboarding with workflow ID and map failure state**

```ts
const webhookResult = await triggerOnboarding({
  workflowId: workflow.id,
  firstName,
  lastName,
  email,
  department: employee.department.name,
  position,
});

if (!webhookResult?.ok) {
  await updateWorkflowStepStatus({
    workflowId: workflow.id,
    stepKey: "create_sso_account",
    status: "NEEDS_RETRY",
    errorCode: webhookResult?.reason ?? "unknown",
    errorMessage: webhookResult?.errorMessage,
  });
}

return NextResponse.json({ ...employee, workflowId: workflow.id }, { status: 201 });
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- dashboard/app/api/employees/route.test.ts`
Expected: PASS and the response body includes `workflowId`.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/api/employees/route.ts dashboard/lib/activity.ts dashboard/app/api/employees/route.test.ts
git commit -m "feat: track onboarding workflow from employee api"
```

### Task 5: Track offboarding and activation in employee update API

**Files:**
- Modify: `dashboard/app/api/employees/[id]/route.ts`
- Modify: `dashboard/lib/workflows/offboarding.ts`
- Test: `dashboard/app/api/employees/[id]/route.test.ts`

- [ ] **Step 1: Write the failing offboarding route test**

```ts
import { describe, expect, it } from "node:test";
import { PATCH } from "@/app/api/employees/[id]/route";

describe("PATCH /api/employees/[id]", () => {
  it("creates a tracked offboarding workflow on termination", async () => {
    const request = new Request("http://localhost:3000/api/employees/emp_123", {
      method: "PATCH",
      body: JSON.stringify({ status: "TERMINATED" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PATCH(request as any, { params: Promise.resolve({ id: "emp_123" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.workflowId).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/app/api/employees/[id]/route.test.ts`
Expected: FAIL because the route does not return workflow metadata.

- [ ] **Step 3: Create an offboarding execution on termination**

```ts
let workflowId: string | null = null;

if (body.status === "TERMINATED") {
  const workflow = await createWorkflowExecutionRecord({
    type: "OFFBOARDING",
    employeeId: employee.id,
    initiatedBy: "dashboard_api",
    payload: { email: employee.email, department: employee.department.name },
  });
  workflowId = workflow.id;
}
```

- [ ] **Step 4: Trigger offboarding with correlation and record failure states**

```ts
const webhookResult = await triggerOffboarding({
  workflowId: workflowId!,
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  department: employee.department.name,
});

if (!webhookResult?.ok) {
  await updateWorkflowStepStatus({
    workflowId: workflowId!,
    stepKey: "disable_sso_account",
    status: "FAILED",
    errorCode: webhookResult?.reason ?? "unknown",
    errorMessage: webhookResult?.errorMessage,
  });
}
```

- [ ] **Step 5: Return workflow metadata in status-changing responses**

```ts
return NextResponse.json({
  ...employee,
  workflowId,
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- dashboard/app/api/employees/[id]/route.test.ts`
Expected: PASS and terminated employees return an associated workflow ID.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/api/employees/[id]/route.ts dashboard/lib/workflows/offboarding.ts dashboard/app/api/employees/[id]/route.test.ts
git commit -m "feat: track offboarding workflow state"
```

### Task 6: Add workflow listing and summary APIs

**Files:**
- Create: `dashboard/app/api/workflows/route.ts`
- Create: `dashboard/app/api/workflows/[id]/route.ts`
- Create: `dashboard/app/api/workflows/summary/route.ts`
- Test: `dashboard/app/api/workflows/summary/route.test.ts`

- [ ] **Step 1: Write the failing workflow summary test**

```ts
import { describe, expect, it } from "node:test";
import { GET } from "@/app/api/workflows/summary/route";

describe("GET /api/workflows/summary", () => {
  it("returns counts for pending, failed, and completed workflows", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.pending).toBe("number");
    expect(typeof data.failed).toBe("number");
    expect(typeof data.completed).toBe("number");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/app/api/workflows/summary/route.test.ts`
Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement workflow summary route**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [pending, failed, completed, waitingApproval] = await Promise.all([
    prisma.workflowExecution.count({ where: { status: "PENDING" } }),
    prisma.workflowExecution.count({ where: { status: "FAILED" } }),
    prisma.workflowExecution.count({ where: { status: "COMPLETED" } }),
    prisma.workflowExecution.count({ where: { status: "WAITING_APPROVAL" } }),
  ]);

  return NextResponse.json({ pending, failed, completed, waitingApproval });
}
```

- [ ] **Step 4: Implement workflow list route with filters**

```ts
const type = searchParams.get("type") ?? undefined;
const status = searchParams.get("status") ?? undefined;

const items = await prisma.workflowExecution.findMany({
  where: {
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
  },
  include: { steps: true },
  orderBy: { createdAt: "desc" },
  take: 50,
});
```

- [ ] **Step 5: Implement workflow detail route**

```ts
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.workflowExecution.findUnique({
    where: { id },
    include: { steps: { orderBy: { createdAt: "asc" } } },
  });

  if (!item) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- dashboard/app/api/workflows/summary/route.test.ts`
Expected: PASS and the summary route returns numeric counts.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/api/workflows dashboard/app/api/workflows/summary/route.test.ts
git commit -m "feat: add workflow tracking apis"
```

### Task 7: Replace static workflow page with live operational workflow UI

**Files:**
- Modify: `dashboard/app/(dashboard)/workflows/page.tsx`
- Create: `dashboard/components/workflows/WorkflowStatusCard.tsx`
- Create: `dashboard/components/workflows/WorkflowExecutionTable.tsx`
- Create: `dashboard/components/workflows/WorkflowExecutionTimeline.tsx`

- [ ] **Step 1: Write the failing UI behavior test or acceptance checklist**

```md
Acceptance checks:
- Workflow page loads summary counts from `/api/workflows/summary`.
- Workflow page shows recent tracked workflow executions instead of static hardcoded arrays.
- Failed workflows display a red badge and visible error text.
```

- [ ] **Step 2: Run the page manually to verify current behavior is static**

Run: `npm run dev`
Expected: `/workflows` shows hardcoded onboarding/offboarding cards with fixed steps and no runtime state.

- [ ] **Step 3: Create reusable workflow status card component**

```tsx
export function WorkflowStatusCard({ label, value, tone }: { label: string; value: number; tone: "default" | "danger" | "success" | "warning" }) {
  const toneClasses = {
    default: "border-border",
    danger: "border-red-300 bg-red-50 dark:bg-red-900/20",
    success: "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20",
    warning: "border-amber-300 bg-amber-50 dark:bg-amber-900/20",
  };

  return (
    <Card className={toneClasses[tone]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create a workflow execution table component**

```tsx
export function WorkflowExecutionTable({ items }: { items: Array<{ id: string; type: string; status: string; summary?: string | null }> }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{item.type}</p>
                <p className="text-sm text-muted-foreground">{item.summary ?? item.id}</p>
              </div>
              <Badge variant={item.status === "FAILED" ? "destructive" : "secondary"}>{item.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Replace static page data with fetches to the new APIs**

```tsx
const [summaryRes, workflowRes] = await Promise.all([
  fetch("http://localhost:3000/api/workflows/summary", { cache: "no-store" }),
  fetch("http://localhost:3000/api/workflows", { cache: "no-store" }),
]);

const summary = await summaryRes.json();
const workflows = await workflowRes.json();
```

- [ ] **Step 6: Run the page and verify live workflow state**

Run: `npm run dev`
Expected: `/workflows` shows live counts for pending/failed/completed and recent workflow executions from the database.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/(dashboard)/workflows/page.tsx dashboard/components/workflows
git commit -m "feat: show live workflow execution state"
```

---

## Phase 2 — AI Operations Assistant (High / P1)

### Task 8: Add workflow-aware AI query helper

**Files:**
- Create: `dashboard/lib/ai/workflow-query.ts`
- Create: `dashboard/lib/ai/workflow-query.test.ts`

- [ ] **Step 1: Write the failing workflow query helper test**

```ts
import { describe, expect, it } from "node:test";
import { answerWorkflowQuestion } from "@/lib/ai/workflow-query";

describe("answerWorkflowQuestion", () => {
  it("returns incomplete onboarding workflows and recommended next actions", async () => {
    const result = await answerWorkflowQuestion("Những onboarding nào còn dang dở?");

    expect(result.intent).toBe("WORKFLOW_STATUS");
    expect(Array.isArray(result.nextActions)).toBe(true);
    expect(result.sources.some((source) => source.type === "workflow")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/lib/ai/workflow-query.test.ts`
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement workflow-aware query helper**

```ts
import { prisma } from "@/lib/prisma";

export async function answerWorkflowQuestion(question: string) {
  const incomplete = await prisma.workflowExecution.findMany({
    where: { status: { in: ["PENDING", "RUNNING", "FAILED", "NEEDS_RETRY", "WAITING_APPROVAL"] } },
    include: { steps: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return {
    intent: "WORKFLOW_STATUS" as const,
    summary: `Có ${incomplete.length} workflow chưa hoàn tất.`,
    items: incomplete,
    sources: incomplete.map((workflow) => ({
      type: "workflow" as const,
      label: `${workflow.type} · ${workflow.status}`,
      ref: workflow.id,
    })),
    nextActions: [
      "Mở trang Workflows để xem chi tiết",
      "Kiểm tra các bước FAILED hoặc NEEDS_RETRY",
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- dashboard/lib/ai/workflow-query.test.ts`
Expected: PASS and the helper returns workflow sources and next actions.

- [ ] **Step 5: Commit**

```bash
git add dashboard/lib/ai/workflow-query.ts dashboard/lib/ai/workflow-query.test.ts
git commit -m "feat: add workflow-aware ai query helper"
```

### Task 9: Extend AI API routing with workflow-status answers and source summaries

**Files:**
- Modify: `dashboard/app/api/ai/chat/route.ts`
- Create: `dashboard/lib/ai/source-summary.ts`
- Test: `dashboard/app/api/ai/chat/route.test.ts`

- [ ] **Step 1: Write the failing AI route test**

```ts
import { describe, expect, it } from "node:test";
import { POST } from "@/app/api/ai/chat/route";

describe("POST /api/ai/chat", () => {
  it("routes workflow-status questions to workflow data with sources", async () => {
    const request = new Request("http://localhost:3000/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ question: "Những workflow nào bị lỗi hôm nay?" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request as any);

    expect(response.headers.get("X-AI-Intent")).toBe("WORKFLOW");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/app/api/ai/chat/route.test.ts`
Expected: FAIL because workflow questions currently trigger generic webhooks or DB paths without source summaries.

- [ ] **Step 3: Add a source summary normalizer**

```ts
export interface AnswerSourceSummary {
  type: "sql" | "workflow" | "knowledge" | "health";
  label: string;
  ref?: string;
}

export function serializeSourceSummaries(sources: AnswerSourceSummary[]) {
  return JSON.stringify(sources);
}
```

- [ ] **Step 4: Route workflow-status questions to the helper instead of trigger-only flow**

```ts
if (/workflow|onboarding|offboarding|phê duyệt|bị lỗi|dang dở/i.test(userQuestion)) {
  const result = await answerWorkflowQuestion(userQuestion);
  return streamTextWithMeta(
    ["[STEP:workflow]", "[STEP:answering]", `${result.summary}\n\n- ${result.nextActions.join("\n- ")}`],
    "WORKFLOW",
    result.sources
  );
}
```

- [ ] **Step 5: Add source metadata to streaming responses**

```ts
return new Response(stream, {
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache",
    "X-AI-Intent": intent,
    "X-AI-Sources": serializeSourceSummaries(sources),
  },
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- dashboard/app/api/ai/chat/route.test.ts`
Expected: PASS and workflow-status questions set `X-AI-Intent: WORKFLOW`.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/api/ai/chat/route.ts dashboard/lib/ai/source-summary.ts dashboard/app/api/ai/chat/route.test.ts
git commit -m "feat: add workflow-aware ai chat responses"
```

### Task 10: Render AI source summaries and next-action chips in the chat UI

**Files:**
- Modify: `dashboard/app/(dashboard)/ai-chat/page.tsx`
- Create: `dashboard/components/ai/SourceSummary.tsx`
- Create: `dashboard/components/ai/NextActionChips.tsx`
- Modify: `dashboard/components/ai/ChatProvider.tsx`

- [ ] **Step 1: Write the UI acceptance checklist**

```md
Acceptance checks:
- AI assistant messages can display sources such as workflow, SQL, and knowledge.
- Workflow answers render suggested next-action chips.
- Clicking a next-action chip prefills or triggers a follow-up question.
```

- [ ] **Step 2: Verify current UI lacks sources and next actions**

Run: `npm run dev`
Expected: AI Chat shows content and SQL details only; it does not show source summaries or recommended actions.

- [ ] **Step 3: Add source summary component**

```tsx
export function SourceSummary({ sources }: { sources: Array<{ type: string; label: string; ref?: string }> }) {
  if (!sources.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {sources.map((source) => (
        <span key={`${source.type}-${source.label}`} className="rounded-md border px-2 py-1 text-[10px] text-muted-foreground">
          {source.type}: {source.label}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Add next-action chips component**

```tsx
export function NextActionChips({ actions, onSelect }: { actions: string[]; onSelect: (value: string) => void }) {
  if (!actions.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action} type="button" variant="outline" size="sm" onClick={() => onSelect(action)}>
          {action}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Extend chat message state to store `sources` and `nextActions`**

```ts
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  intent?: string;
  sql?: string;
  sources?: Array<{ type: string; label: string; ref?: string }>;
  nextActions?: string[];
}
```

- [ ] **Step 6: Render the new metadata in assistant bubbles**

```tsx
{!isUser && msg.sources?.length ? <SourceSummary sources={msg.sources} /> : null}
{!isUser && msg.nextActions?.length ? <NextActionChips actions={msg.nextActions} onSelect={setInput} /> : null}
```

- [ ] **Step 7: Run the UI and verify richer operations answers**

Run: `npm run dev`
Expected: workflow-related AI answers show sources and suggested next steps below the answer text.

- [ ] **Step 8: Commit**

```bash
git add dashboard/app/(dashboard)/ai-chat/page.tsx dashboard/components/ai dashboard/components/ai/ChatProvider.tsx
git commit -m "feat: show ai sources and next actions"
```

---

## Phase 3 — Knowledge and SOP Integration (High / P1-P2)

### Task 11: Add onboarding page helper for Wiki.js-linked SOP support

**Files:**
- Create: `dashboard/lib/wiki/onboarding-page.ts`
- Create: `dashboard/app/api/knowledge/onboarding-page/route.ts`
- Modify: `dashboard/lib/workflows/onboarding.ts`

- [ ] **Step 1: Write the helper acceptance checklist**

```md
Acceptance checks:
- Onboarding helper can build a page title and markdown body for a new employee.
- The body includes welcome text, checklist items, and links to key systems.
- The workflow can mark the knowledge step complete or failed.
```

- [ ] **Step 2: Create onboarding wiki page builder**

```ts
export function buildOnboardingPage(input: {
  fullName: string;
  department: string;
  position: string;
}) {
  return {
    title: `Onboarding - ${input.fullName}`,
    content: `# Welcome ${input.fullName}\n\n## Department\n- ${input.department}\n\n## Position\n- ${input.position}\n\n## Checklist\n- [ ] Sign in with SSO\n- [ ] Join department chat\n- [ ] Review team SOP\n- [ ] Confirm first-week tasks`,
  };
}
```

- [ ] **Step 3: Create a lightweight onboarding page route**

```ts
import { NextResponse } from "next/server";
import { buildOnboardingPage } from "@/lib/wiki/onboarding-page";

export async function POST(request: Request) {
  const { fullName, department, position } = await request.json();
  return NextResponse.json(buildOnboardingPage({ fullName, department, position }));
}
```

- [ ] **Step 4: Wire the onboarding workflow knowledge step**

```ts
await updateWorkflowStepStatus({
  workflowId,
  stepKey: "create_onboarding_page",
  status: "COMPLETED",
  details: {
    title: page.title,
  },
});
```

- [ ] **Step 5: Verify the route manually**

Run: `curl -X POST http://localhost:3000/api/knowledge/onboarding-page -H "Content-Type: application/json" -d '{"fullName":"Nguyen Demo","department":"Kỹ thuật","position":"Developer"}'`
Expected: JSON response with a title and markdown onboarding content.

- [ ] **Step 6: Commit**

```bash
git add dashboard/lib/wiki/onboarding-page.ts dashboard/app/api/knowledge/onboarding-page/route.ts dashboard/lib/workflows/onboarding.ts
git commit -m "feat: add onboarding knowledge page helper"
```

### Task 12: Make AI knowledge answers cite workflow-linked SOP sources

**Files:**
- Modify: `dashboard/lib/knowledge/rag-query.ts`
- Modify: `dashboard/app/api/ai/chat/route.ts`

- [ ] **Step 1: Write the acceptance checklist**

```md
Acceptance checks:
- Knowledge answers return at least one source node label.
- AI route includes knowledge source summaries in the response metadata.
- SOP-related questions can mention workflow-linked docs when available.
```

- [ ] **Step 2: Expand RAG result metadata**

```ts
export interface RagQueryResult {
  chunks: ChunkWithContext[];
  sourceNodes: { id: string; name: string; type: string; source?: string | null; sourceUrl?: string | null }[];
}
```

- [ ] **Step 3: Add knowledge source summary construction in AI route**

```ts
const result = await queryKnowledge(userQuestion);
const sourceSummaries = result.sourceNodes.slice(0, 4).map((node) => ({
  type: "knowledge" as const,
  label: `${node.type}: ${node.name}`,
  ref: node.sourceUrl ?? node.id,
}));
```

- [ ] **Step 4: Return source metadata with knowledge answers**

```ts
return streamTextWithMeta(streamSegments, "KNOWLEDGE_QUERY", sourceSummaries);
```

- [ ] **Step 5: Verify with a knowledge question**

Run: `npm run dev`
Expected: asking a SOP/policy question in AI Chat shows knowledge sources below the answer.

- [ ] **Step 6: Commit**

```bash
git add dashboard/lib/knowledge/rag-query.ts dashboard/app/api/ai/chat/route.ts
git commit -m "feat: cite workflow-linked knowledge sources in ai"
```

---

## Phase 4 — Operational Dashboard and Demo Alignment (Medium / P2)

### Task 13: Surface workflow KPIs on the dashboard homepage

**Files:**
- Modify: `dashboard/app/api/dashboard/route.ts`
- Modify: `dashboard/app/(dashboard)/page.tsx`

- [ ] **Step 1: Write the acceptance checklist**

```md
Acceptance checks:
- Dashboard API returns workflow counts and failed/pending workflow summaries.
- Homepage shows at least two workflow KPI cards.
- Homepage includes a short list of recent failed or pending workflow items.
```

- [ ] **Step 2: Add workflow counts to the dashboard API**

```ts
const [pendingWorkflows, failedWorkflows, completedWorkflows] = await Promise.all([
  prisma.workflowExecution.count({ where: { status: "PENDING" } }),
  prisma.workflowExecution.count({ where: { status: "FAILED" } }),
  prisma.workflowExecution.count({ where: { status: "COMPLETED" } }),
]);
```

- [ ] **Step 3: Include workflow summary in the response payload**

```ts
return NextResponse.json({
  employeeCount,
  departmentCount,
  activeCount,
  onLeaveCount,
  terminatedCount,
  recentLogs,
  deptStats,
  recentHires,
  workflowSummary: {
    pending: pendingWorkflows,
    failed: failedWorkflows,
    completed: completedWorkflows,
  },
});
```

- [ ] **Step 4: Render workflow KPI cards on the homepage**

```tsx
<Card>
  <CardHeader><CardTitle>Workflow Pending</CardTitle></CardHeader>
  <CardContent><p className="text-2xl font-bold">{data.workflowSummary.pending}</p></CardContent>
</Card>
```

- [ ] **Step 5: Run the homepage and verify operational KPIs**

Run: `npm run dev`
Expected: homepage shows workflow metrics alongside employee and department summaries.

- [ ] **Step 6: Commit**

```bash
git add dashboard/app/api/dashboard/route.ts dashboard/app/(dashboard)/page.tsx
git commit -m "feat: surface workflow kpis on dashboard"
```

### Task 14: Update architecture and demo docs to match the new product story

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/demo-script.md`

- [ ] **Step 1: Write the documentation acceptance checklist**

```md
Acceptance checks:
- Architecture doc describes tracked workflow execution, failure handling, and onboarding knowledge pages.
- Demo script starts from the business pain point of fragmented internal operations.
- Demo script highlights onboarding workflow status and AI operational assistance.
```

- [ ] **Step 2: Update architecture flow section**

```md
[Dashboard Next.js] -> [WorkflowExecution record in PostgreSQL] -> [Activepieces Webhook]
  -> Step A: Keycloak account action
  -> Step B: Mattermost notification
  -> Step C: Wiki.js onboarding page
  -> Step D: Dashboard status + audit visibility
```

- [ ] **Step 3: Update AI architecture text**

```md
The AI assistant now routes questions across SQL, workflow state, health data, and knowledge documents, then returns both an answer and action-oriented follow-up guidance.
```

- [ ] **Step 4: Rewrite demo script around the anchor business case**

```md
Demo 1: Explain the pain point — fragmented internal operations.
Demo 2: Create a new employee and show tracked onboarding state.
Demo 3: Show failed/pending workflow visibility.
Demo 4: Ask AI which onboarding cases are incomplete and what to do next.
```

- [ ] **Step 5: Review the docs in the IDE**

Expected: docs tell one focused story: fragmented operations -> tracked onboarding -> visible status -> AI-assisted follow-up.

- [ ] **Step 6: Commit**

```bash
git add docs/architecture.md docs/demo-script.md
git commit -m "docs: align architecture and demo with operations story"
```

---

## Phase 5 — Approval Flows and Expansion (Optional / P3)

### Task 15: Design and scaffold one approval-based workflow

**Files:**
- Modify: `dashboard/prisma/schema.prisma`
- Create: `dashboard/app/api/approvals/route.ts`
- Create: `dashboard/app/(dashboard)/approvals/page.tsx`

- [ ] **Step 1: Write the acceptance checklist**

```md
Acceptance checks:
- One approval workflow type exists (recommended: leave request or access request).
- Workflow execution can enter WAITING_APPROVAL.
- Approver can approve or reject through a Dashboard view.
```

- [ ] **Step 2: Add a simple approval request model**

```prisma
model ApprovalRequest {
  id          String   @id @default(cuid())
  workflowId  String
  requestType String
  status      String   @default("PENDING")
  requestedBy String?
  approverId  String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- [ ] **Step 3: Add approval list API**

```ts
export async function GET() {
  const items = await prisma.approvalRequest.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json(items);
}
```

- [ ] **Step 4: Create a simple approvals page**

```tsx
export default async function ApprovalsPage() {
  const res = await fetch("http://localhost:3000/api/approvals", { cache: "no-store" });
  const approvals = await res.json();
  return <pre>{JSON.stringify(approvals, null, 2)}</pre>;
}
```

- [ ] **Step 5: Verify the scaffold manually**

Run: `npm run dev`
Expected: `/approvals` renders approval records, even if the workflow is still basic.

- [ ] **Step 6: Commit**

```bash
git add dashboard/prisma/schema.prisma dashboard/app/api/approvals/route.ts dashboard/app/(dashboard)/approvals/page.tsx
git commit -m "feat: scaffold approval workflow support"
```

---

## Plan Coverage Check

### Spec requirements covered

- **Business-realistic workflow automation** → Phase 1 tasks 1-7.
- **Offboarding risk control** → Phase 1 task 5.
- **Workflow observability** → Phase 1 tasks 6-7 and Phase 4 task 13.
- **AI operations assistant** → Phase 2 tasks 8-10.
- **Knowledge and SOP linkage** → Phase 3 tasks 11-12.
- **Competition story alignment** → Phase 4 task 14.
- **Approval-based workflow expansion** → Phase 5 task 15.

### Gaps intentionally left out of the first pass

- Full role-based access views are not fully implemented in this plan; they can be added after Phase 4 if time remains.
- Deep autonomous AI actions are intentionally excluded; the plan keeps AI in a safer assistant role.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each task includes exact file paths, runnable commands, and concrete code snippets.

### Type consistency check

- Workflow statuses are consistently defined as `PENDING | RUNNING | COMPLETED | FAILED | WAITING_APPROVAL | NEEDS_RETRY`.
- Workflow types are consistently defined as `ONBOARDING | OFFBOARDING | ACTIVATION`.
- AI source summaries consistently use `sql | workflow | knowledge | health`.

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-08-opendx-upgrade-phased-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
