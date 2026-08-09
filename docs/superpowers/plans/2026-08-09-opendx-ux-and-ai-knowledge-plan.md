# OpenDX-Lab UX and AI Knowledge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade OpenDX-Lab into a more usable HR/Admin operations product with tighter onboarding/workflow UX and a stronger enterprise AI knowledge assistant.

**Architecture:** Keep the current Dashboard + Prisma + Activepieces + Ollama + knowledge-graph architecture, but shift the UX toward task-oriented HR/Admin flows. Add employee-centric workflow visibility, clearer post-action feedback, actionable dashboard surfaces, and a knowledge layer with governance metadata, source-aware retrieval, and workflow/SOP-aware AI responses.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, PostgreSQL, Activepieces webhooks, Ollama, Graph RAG, Wiki.js sync, existing shadcn/base-ui components.

---

## File Structure Map

### Existing files to modify

- `dashboard/prisma/schema.prisma` — extend knowledge metadata and optionally employee/workflow-visible relationships.
- `dashboard/app/api/employees/route.ts` — return stronger workflow bootstrap feedback on employee create.
- `dashboard/app/api/employees/[id]/route.ts` — return richer workflow state on status updates.
- `dashboard/app/api/dashboard/route.ts` — expose actionable HR/Admin summaries, including incomplete/failed workflow items.
- `dashboard/app/api/ai/chat/route.ts` — support SOP/policy/workflow-aware responses, source summaries, and next actions.
- `dashboard/app/api/knowledge/graph/route.ts` — expose richer metadata for graph and knowledge UI filters.
- `dashboard/app/api/knowledge/sync/route.ts` — return richer sync results once governance metadata is captured.
- `dashboard/lib/knowledge/wikijs-sync.ts` — ingest governance metadata from Wiki.js pages.
- `dashboard/lib/knowledge/rag-query.ts` — rank and filter chunks by business metadata and provide trustworthy source info.
- `dashboard/components/Sidebar.tsx` — shift labels/groupings toward task-centric navigation.
- `dashboard/components/Header.tsx` — surface more role-aware context if needed.
- `dashboard/app/(dashboard)/page.tsx` — make the homepage action-first for HR/Admin.
- `dashboard/app/(dashboard)/employees/page.tsx` — surface workflow state, next actions, and better post-create feedback.
- `dashboard/app/(dashboard)/workflows/page.tsx` — make workflows actionable rather than descriptive.
- `dashboard/app/(dashboard)/ai-chat/page.tsx` — surface source summaries, next actions, and operational prompts.
- `dashboard/app/(dashboard)/knowledge-graph/page.tsx` — evolve graph exploration toward enterprise knowledge usefulness, not only visualization.
- `dashboard/components/ai/ChatProvider.tsx` — store and display richer AI metadata.
- `docs/demo-script.md` — align demo around HR/Admin pain point and AI knowledge value.
- `docs/architecture.md` — align architecture docs with knowledge governance and workflow-aware AI.

### New files to create

- `dashboard/lib/knowledge/governance.ts` — normalize document type, owner, department, validity, and canonical-source logic.
- `dashboard/lib/knowledge/metadata-extractor.ts` — derive governance metadata from Wiki.js paths/frontmatter/content heuristics.
- `dashboard/lib/knowledge/query-intent.ts` — detect SOP/policy/workflow/knowledge-admin question types.
- `dashboard/lib/knowledge/answer-builder.ts` — build source summaries, confidence hints, and next-action suggestions.
- `dashboard/lib/ai/knowledge-admin-query.ts` — answer enterprise knowledge questions using workflow + graph + metadata context.
- `dashboard/components/employees/EmployeeWorkflowBadge.tsx` — small workflow-status badge for employee rows/cards.
- `dashboard/components/employees/EmployeeNextActionPanel.tsx` — show what HR/Admin should do after create/update.
- `dashboard/components/workflows/WorkflowActionQueue.tsx` — list failed/pending/manual-attention workflows.
- `dashboard/components/dashboard/AttentionList.tsx` — homepage panel for action-required items.
- `dashboard/components/ai/PromptShortcutBar.tsx` — contextual HR/Admin prompts for the AI assistant.
- `dashboard/components/knowledge/KnowledgeSourceBadge.tsx` — show governance metadata in graph and AI surfaces.
- `dashboard/app/api/knowledge/insights/route.ts` — expose simple knowledge quality/coverage insights.

### Tests to create

- `dashboard/lib/knowledge/governance.test.ts`
- `dashboard/lib/knowledge/query-intent.test.ts`
- `dashboard/lib/knowledge/answer-builder.test.ts`
- `dashboard/lib/ai/knowledge-admin-query.test.ts`
- `dashboard/app/api/employees/route.test.ts`
- `dashboard/app/api/dashboard/route.test.ts`
- `dashboard/app/api/ai/chat/route.test.ts`
- `dashboard/app/api/knowledge/insights/route.test.ts`

---

## Delivery Phases and Importance

### Phase 1 — Critical / P1
Make HR/Admin operations clear and actionable: employee outcomes, workflow status, homepage attention areas, and post-action feedback.

### Phase 2 — High / P1
Make workflows and AI useful in the work loop: actionable workflow page, contextual AI prompts, and richer response metadata.

### Phase 3 — High / P1-P2
Add enterprise knowledge governance and workflow/SOP-aware retrieval so AI answers become more trustworthy and useful.

### Phase 4 — Medium / P2
Turn the knowledge graph and knowledge views into operational knowledge surfaces instead of only graph visualization.

### Phase 5 — Optional / P3
Add knowledge quality insights and future-facing enterprise knowledge management intelligence.

---

## Phase 1 — HR/Admin Usability and Operational Clarity (Critical / P1)

### Task 1: Show workflow outcomes directly in employee flows

**Files:**
- Modify: `dashboard/app/api/employees/route.ts`
- Modify: `dashboard/app/api/employees/[id]/route.ts`
- Create: `dashboard/components/employees/EmployeeWorkflowBadge.tsx`
- Create: `dashboard/components/employees/EmployeeNextActionPanel.tsx`
- Modify: `dashboard/app/(dashboard)/employees/page.tsx`
- Test: `dashboard/app/api/employees/route.test.ts`

- [ ] **Step 1: Write the failing employee create API test**

```ts
import { describe, expect, it } from "node:test";
import { POST } from "@/app/api/employees/route";

describe("POST /api/employees", () => {
  it("returns workflow summary metadata for the new employee", async () => {
    const request = new Request("http://localhost:3000/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Nguyen",
        lastName: "Demo",
        email: "demo@opendx.local",
        position: "Developer",
        departmentId: "dep_1",
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.workflowId).toBeDefined();
    expect(data.workflowStatus).toBeDefined();
    expect(Array.isArray(data.nextActions)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/app/api/employees/route.test.ts`
Expected: FAIL because `workflowStatus` and `nextActions` are not returned.

- [ ] **Step 3: Add a helper payload for employee workflow responses**

```ts
const workflowResponse = {
  workflowId: workflow.id,
  workflowStatus: workflow.status,
  nextActions: webhookResult?.ok
    ? ["Xem workflow onboarding", "Kiểm tra tài liệu onboarding", "Theo dõi trạng thái SSO"]
    : ["Mở workflow để xem lỗi", "Thử lại bước tích hợp", "Hỏi AI cách xử lý workflow"],
};
```

- [ ] **Step 4: Return richer metadata from employee create/update routes**

```ts
return NextResponse.json(
  {
    ...employee,
    ...workflowResponse,
  },
  { status: 201 }
);
```

```ts
return NextResponse.json({
  ...employee,
  workflowId,
  workflowStatus: workflowId ? "RUNNING" : null,
  nextActions: workflowId
    ? ["Xem chi tiết workflow", "Kiểm tra bước cần xử lý tiếp"]
    : [],
});
```

- [ ] **Step 5: Add a workflow badge component**

```tsx
import { Badge } from "@/components/ui/badge";

const toneMap = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  RUNNING: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
  NEEDS_RETRY: "bg-orange-50 text-orange-700 border-orange-200",
};

export function EmployeeWorkflowBadge({ status }: { status?: keyof typeof toneMap | null }) {
  if (!status) return null;
  return <Badge variant="outline" className={toneMap[status]}>{status}</Badge>;
}
```

- [ ] **Step 6: Add a post-action panel to the employee page**

```tsx
export function EmployeeNextActionPanel({
  employeeName,
  workflowId,
  nextActions,
}: {
  employeeName: string;
  workflowId?: string;
  nextActions: string[];
}) {
  if (!workflowId) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
        Đã khởi chạy onboarding cho {employeeName}
      </p>
      <ul className="mt-2 space-y-1 text-sm text-emerald-700 dark:text-emerald-300">
        {nextActions.map((action) => <li key={action}>• {action}</li>)}
      </ul>
    </div>
  );
}
```

- [ ] **Step 7: Render workflow badges and next-action feedback on the employees page**

```tsx
<TableCell>
  <div className="flex items-center gap-2">
    <Badge variant="outline" className={statusConfig[emp.status].color}>{t(statusConfig[emp.status].label as any)}</Badge>
    <EmployeeWorkflowBadge status={emp.workflowStatus} />
  </div>
</TableCell>
```

```tsx
{lastCreatedEmployee ? (
  <EmployeeNextActionPanel
    employeeName={`${lastCreatedEmployee.firstName} ${lastCreatedEmployee.lastName}`}
    workflowId={lastCreatedEmployee.workflowId}
    nextActions={lastCreatedEmployee.nextActions ?? []}
  />
) : null}
```

- [ ] **Step 8: Run test and verify the UI manually**

Run: `npm run test -- dashboard/app/api/employees/route.test.ts && npm run dev`
Expected: API test passes, employee creation shows workflow metadata and the page shows a visible next-action panel.

- [ ] **Step 9: Commit**

```bash
git add dashboard/app/api/employees/route.ts dashboard/app/api/employees/[id]/route.ts dashboard/components/employees dashboard/app/(dashboard)/employees/page.tsx dashboard/app/api/employees/route.test.ts
git commit -m "feat: surface workflow outcomes in employee flows"
```

### Task 2: Make the homepage action-first for HR/Admin

**Files:**
- Modify: `dashboard/app/api/dashboard/route.ts`
- Create: `dashboard/components/dashboard/AttentionList.tsx`
- Modify: `dashboard/app/(dashboard)/page.tsx`
- Test: `dashboard/app/api/dashboard/route.test.ts`

- [ ] **Step 1: Write the failing dashboard API test**

```ts
import { describe, expect, it } from "node:test";
import { GET } from "@/app/api/dashboard/route";

describe("GET /api/dashboard", () => {
  it("returns actionable attention items for HR/Admin", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.attentionItems)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/app/api/dashboard/route.test.ts`
Expected: FAIL because `attentionItems` does not exist.

- [ ] **Step 3: Add attention item aggregation to the dashboard API**

```ts
const [failedWorkflows, pendingWorkflows] = await Promise.all([
  prisma.workflowExecution.findMany({
    where: { status: "FAILED" },
    orderBy: { updatedAt: "desc" },
    take: 5,
  }),
  prisma.workflowExecution.findMany({
    where: { status: { in: ["PENDING", "NEEDS_RETRY", "WAITING_APPROVAL"] } },
    orderBy: { updatedAt: "desc" },
    take: 5,
  }),
]);

const attentionItems = [
  ...failedWorkflows.map((item) => ({
    id: item.id,
    tone: "danger" as const,
    title: `Workflow lỗi: ${item.type}`,
    description: item.summary ?? item.id,
  })),
  ...pendingWorkflows.map((item) => ({
    id: item.id,
    tone: "warning" as const,
    title: `Cần theo dõi: ${item.type}`,
    description: item.summary ?? item.id,
  })),
].slice(0, 6);
```

- [ ] **Step 4: Return `attentionItems` from the dashboard API**

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
    pending: pendingWorkflows.length,
    failed: failedWorkflows.length,
    completed: completedWorkflowCount,
  },
  attentionItems,
});
```

- [ ] **Step 5: Create the attention list component**

```tsx
export function AttentionList({
  items,
}: {
  items: Array<{ id: string; tone: "danger" | "warning"; title: string; description: string }>;
}) {
  if (!items.length) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border p-3">
          <p className="text-sm font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Render an “Needs Attention Today” section on the homepage**

```tsx
<Card className="bg-card border-border">
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-semibold text-foreground">Cần chú ý hôm nay</CardTitle>
  </CardHeader>
  <CardContent>
    <AttentionList items={data.attentionItems ?? []} />
  </CardContent>
</Card>
```

- [ ] **Step 7: Run the test and verify the homepage manually**

Run: `npm run test -- dashboard/app/api/dashboard/route.test.ts && npm run dev`
Expected: dashboard API test passes and the homepage shows actionable attention items above or near the KPI area.

- [ ] **Step 8: Commit**

```bash
git add dashboard/app/api/dashboard/route.ts dashboard/components/dashboard/AttentionList.tsx dashboard/app/(dashboard)/page.tsx dashboard/app/api/dashboard/route.test.ts
git commit -m "feat: make dashboard homepage action-first"
```

### Task 3: Reframe navigation around user jobs

**Files:**
- Modify: `dashboard/components/Sidebar.tsx`
- Modify: `dashboard/components/Header.tsx`

- [ ] **Step 1: Write the UI acceptance checklist**

```md
Acceptance checks:
- Sidebar labels feel task-oriented for HR/Admin rather than purely system-oriented.
- Knowledge and AI entries are described in business language.
- Services remain available but feel supporting, not central.
```

- [ ] **Step 2: Verify the current navigation is architecture-centric**

Run: `npm run dev`
Expected: the sidebar shows entries that reflect platform capabilities more than user jobs.

- [ ] **Step 3: Update navigation labels and order**

```ts
const navItems: NavItem[] = [
  { labelKey: "nav.overview", href: "/", layer: "human", icon: ... },
  { labelKey: "nav.employees", href: "/employees", layer: "process", icon: ... },
  { labelKey: "nav.workflows", href: "/workflows", layer: "process", icon: ... },
  { labelKey: "nav.aiChat", href: "/ai-chat", layer: "intelligence", icon: ... },
  { labelKey: "nav.knowledgeGraph", href: "/knowledge-graph", layer: "intelligence", icon: ... },
  { labelKey: "nav.analytics", href: "/analytics", layer: "data", icon: ... },
];
```

- [ ] **Step 4: Update helper copy in the header or breadcrumb context**

```ts
const routeMeta: Record<string, PageMeta> = {
  "/": { titleKey: "home.title", breadcrumbKey: "breadcrumb.home" },
  "/employees": { titleKey: "employees.title", breadcrumbKey: "breadcrumb.employees" },
  "/workflows": { titleKey: "workflows.title", breadcrumbKey: "breadcrumb.workflows" },
  "/ai-chat": { titleKey: "aiChat.title", breadcrumbKey: "breadcrumb.aiChat" },
  "/knowledge-graph": { titleKey: "knowledge.title", breadcrumbKey: "breadcrumb.knowledge" },
};
```

- [ ] **Step 5: Manually verify the shell feels more task-oriented**

Run: `npm run dev`
Expected: navigation feels centered on HR/Admin jobs and AI/knowledge read more like useful tools than separate tech demos.

- [ ] **Step 6: Commit**

```bash
git add dashboard/components/Sidebar.tsx dashboard/components/Header.tsx
git commit -m "feat: reframe navigation around user jobs"
```

---

## Phase 2 — Workflow and AI in the Work Loop (High / P1)

### Task 4: Turn the workflows page into an action queue

**Files:**
- Modify: `dashboard/app/(dashboard)/workflows/page.tsx`
- Create: `dashboard/components/workflows/WorkflowActionQueue.tsx`
- Modify: `dashboard/app/api/workflows/route.ts`

- [ ] **Step 1: Write the acceptance checklist**

```md
Acceptance checks:
- Workflow page highlights failed and pending manual-attention items first.
- Workflow rows/cards show employee or business context where possible.
- The page makes next actions obvious.
```

- [ ] **Step 2: Verify the current workflow page is mostly descriptive**

Run: `npm run dev`
Expected: the workflow page looks informational but does not clearly prioritize action-required workflows.

- [ ] **Step 3: Add actionable workflow filtering in the API**

```ts
const urgentItems = await prisma.workflowExecution.findMany({
  where: { status: { in: ["FAILED", "NEEDS_RETRY", "WAITING_APPROVAL"] } },
  include: { steps: true },
  orderBy: { updatedAt: "desc" },
  take: 20,
});
```

- [ ] **Step 4: Create a workflow action queue component**

```tsx
export function WorkflowActionQueue({
  items,
}: {
  items: Array<{ id: string; type: string; status: string; summary?: string | null }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{item.type}</p>
                <p className="text-sm text-muted-foreground">{item.summary ?? item.id}</p>
              </div>
              <Badge variant={item.status === "FAILED" ? "destructive" : "outline"}>{item.status}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Replace static emphasis with urgent workflow rendering**

```tsx
const urgentRes = await fetch("/api/workflows?mode=urgent", { cache: "no-store" });
const urgentItems = await urgentRes.json();
```

- [ ] **Step 6: Run the page and verify action-first behavior**

Run: `npm run dev`
Expected: the workflow page surfaces failed/pending manual-attention items first and makes the page feel like a place to resolve issues.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/(dashboard)/workflows/page.tsx dashboard/components/workflows/WorkflowActionQueue.tsx dashboard/app/api/workflows/route.ts
git commit -m "feat: make workflow page action-oriented"
```

### Task 5: Add contextual AI prompt shortcuts for HR/Admin tasks

**Files:**
- Create: `dashboard/components/ai/PromptShortcutBar.tsx`
- Modify: `dashboard/app/(dashboard)/ai-chat/page.tsx`
- Modify: `dashboard/components/ai/ChatProvider.tsx`

- [ ] **Step 1: Write the acceptance checklist**

```md
Acceptance checks:
- AI chat suggests HR/Admin-focused prompts.
- Prompt shortcuts include workflow/SOP/process questions, not just basic statistics.
- Selecting a shortcut prefills or sends a useful enterprise question.
```

- [ ] **Step 2: Verify the current AI prompts are still broad/basic**

Run: `npm run dev`
Expected: default prompts emphasize simple data questions and general knowledge rather than operational HR/Admin scenarios.

- [ ] **Step 3: Create the prompt shortcut bar component**

```tsx
import { Button } from "@/components/ui/button";

export function PromptShortcutBar({
  prompts,
  onSelect,
}: {
  prompts: string[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {prompts.map((prompt) => (
        <Button key={prompt} type="button" variant="outline" size="sm" onClick={() => onSelect(prompt)}>
          {prompt}
        </Button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Replace suggestion data with task-oriented prompts**

```ts
const HR_ADMIN_SUGGESTIONS = [
  "Những onboarding nào đang dang dở?",
  "Workflow nào bị lỗi hôm nay và cần làm gì tiếp theo?",
  "SOP onboarding cho nhân viên kỹ thuật là gì?",
  "Nếu tài khoản SSO chưa tạo được thì HR xử lý ra sao?",
  "Tài liệu nào nhân viên mới cần đọc trong tuần đầu?",
];
```

- [ ] **Step 5: Render the new prompt shortcut bar above the empty-state suggestions**

```tsx
<PromptShortcutBar prompts={HR_ADMIN_SUGGESTIONS} onSelect={setInput} />
```

- [ ] **Step 6: Run the UI and verify task-oriented prompts**

Run: `npm run dev`
Expected: the AI chat page suggests practical HR/Admin questions that align with onboarding, workflows, SOPs, and failure handling.

- [ ] **Step 7: Commit**

```bash
git add dashboard/components/ai/PromptShortcutBar.tsx dashboard/app/(dashboard)/ai-chat/page.tsx dashboard/components/ai/ChatProvider.tsx
git commit -m "feat: add hr admin ai prompt shortcuts"
```

### Task 6: Expand AI answers with source summaries and next actions

**Files:**
- Modify: `dashboard/app/api/ai/chat/route.ts`
- Create: `dashboard/lib/knowledge/answer-builder.ts`
- Create: `dashboard/lib/knowledge/query-intent.ts`
- Test: `dashboard/app/api/ai/chat/route.test.ts`

- [ ] **Step 1: Write the failing AI route test**

```ts
import { describe, expect, it } from "node:test";
import { POST } from "@/app/api/ai/chat/route";

describe("POST /api/ai/chat", () => {
  it("returns source summaries and next actions for SOP/workflow questions", async () => {
    const request = new Request("http://localhost:3000/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: "Nếu workflow onboarding bị lỗi thì SOP xử lý là gì?" }),
    });

    const response = await POST(request as any);

    expect(response.headers.get("X-AI-Sources")).toBeTruthy();
    expect(response.headers.get("X-AI-NextActions")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/app/api/ai/chat/route.test.ts`
Expected: FAIL because knowledge/workflow answers do not yet consistently return source and next-action headers.

- [ ] **Step 3: Create query-intent classification helper**

```ts
export type KnowledgeIntent =
  | "SOP_QUERY"
  | "POLICY_QUERY"
  | "WORKFLOW_HELP"
  | "KNOWLEDGE_ADMIN"
  | "GENERAL_KNOWLEDGE";

export function classifyKnowledgeIntent(question: string): KnowledgeIntent {
  const q = question.toLowerCase();
  if (/sop|quy trình|process/i.test(q)) return "SOP_QUERY";
  if (/chính sách|policy/i.test(q)) return "POLICY_QUERY";
  if (/workflow|bị lỗi|làm gì tiếp/i.test(q)) return "WORKFLOW_HELP";
  if (/tài liệu nào thiếu|thiếu tài liệu|knowledge/i.test(q)) return "KNOWLEDGE_ADMIN";
  return "GENERAL_KNOWLEDGE";
}
```

- [ ] **Step 4: Create an answer builder helper**

```ts
export function buildAnswerEnvelope(input: {
  answer: string;
  sources: Array<{ type: string; label: string; ref?: string }>;
  nextActions: string[];
}) {
  return {
    answer: input.answer,
    sourcesHeader: JSON.stringify(input.sources),
    nextActionsHeader: JSON.stringify(input.nextActions),
  };
}
```

- [ ] **Step 5: Use the helpers in the AI route**

```ts
const knowledgeIntent = classifyKnowledgeIntent(userQuestion);
const envelope = buildAnswerEnvelope({
  answer,
  sources,
  nextActions,
});

return new Response(stream, {
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "X-AI-Intent": knowledgeIntent,
    "X-AI-Sources": envelope.sourcesHeader,
    "X-AI-NextActions": envelope.nextActionsHeader,
  },
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- dashboard/app/api/ai/chat/route.test.ts`
Expected: PASS and enterprise knowledge questions return source and next-action metadata.

- [ ] **Step 7: Commit**

```bash
git add dashboard/app/api/ai/chat/route.ts dashboard/lib/knowledge/answer-builder.ts dashboard/lib/knowledge/query-intent.ts dashboard/app/api/ai/chat/route.test.ts
git commit -m "feat: add source-aware enterprise ai answers"
```

---

## Phase 3 — Enterprise Knowledge Governance and Retrieval (High / P1-P2)

### Task 7: Add governance metadata extraction for knowledge nodes

**Files:**
- Create: `dashboard/lib/knowledge/governance.ts`
- Create: `dashboard/lib/knowledge/metadata-extractor.ts`
- Modify: `dashboard/lib/knowledge/wikijs-sync.ts`
- Modify: `dashboard/prisma/schema.prisma`
- Test: `dashboard/lib/knowledge/governance.test.ts`

- [ ] **Step 1: Write the failing governance test**

```ts
import { describe, expect, it } from "node:test";
import { normalizeKnowledgeMetadata } from "@/lib/knowledge/governance";

describe("normalizeKnowledgeMetadata", () => {
  it("adds document type, owner, department, and canonical flags", () => {
    const metadata = normalizeKnowledgeMetadata({
      title: "SOP Onboarding Backend Developer",
      path: "hr/onboarding/backend",
      content: "owner: HR\ndepartment: ENG\ntype: SOP",
    });

    expect(metadata.documentType).toBe("SOP");
    expect(metadata.departmentCode).toBe("ENG");
    expect(typeof metadata.canonical).toBe("boolean");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/lib/knowledge/governance.test.ts`
Expected: FAIL because the governance helper does not exist.

- [ ] **Step 3: Add metadata fields to `KgNode.metadata` conventions or dedicated fields**

```prisma
model KgNode {
  id          String   @id @default(cuid())
  type        String
  name        String
  description String?
  metadata    Json     @default("{}")
  source      String?
  sourceUrl   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([type])
  @@index([source])
  @@index([sourceUrl])
  @@map("kg_nodes")
}
```

- [ ] **Step 4: Create a governance metadata normalizer**

```ts
export function normalizeKnowledgeMetadata(input: {
  title: string;
  path?: string;
  content: string;
}) {
  const content = input.content;
  const path = input.path ?? "";

  const documentType = /policy|chính sách/i.test(input.title)
    ? "POLICY"
    : /sop|quy trình|process/i.test(input.title)
    ? "SOP"
    : /guide|hướng dẫn/i.test(input.title)
    ? "GUIDE"
    : "DOCUMENT";

  const departmentCode = /\/eng\b|engineering|kỹ thuật/i.test(path + content)
    ? "ENG"
    : /\/hr\b|nhân sự/i.test(path + content)
    ? "HR"
    : null;

  return {
    documentType,
    departmentCode,
    canonical: /official|chuẩn|canonical/i.test(content),
    owner: /owner:\s*(.+)/i.exec(content)?.[1]?.trim() ?? null,
  };
}
```

- [ ] **Step 5: Use metadata extraction during Wiki.js sync**

```ts
const governance = normalizeKnowledgeMetadata({
  title: fullPage.title,
  path: fullPage.path,
  content: fullPage.content,
});

await ingestDocument({
  name: fullPage.title,
  content: fullPage.content,
  source: "wikijs",
  sourceUrl,
  metadata: {
    wikiPageId: fullPage.id,
    wikiPath: fullPage.path,
    wikiUpdatedAt: fullPage.updatedAt,
    ...governance,
  },
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- dashboard/lib/knowledge/governance.test.ts`
Expected: PASS and governance metadata is normalized from title/path/content.

- [ ] **Step 7: Commit**

```bash
git add dashboard/lib/knowledge/governance.ts dashboard/lib/knowledge/metadata-extractor.ts dashboard/lib/knowledge/wikijs-sync.ts dashboard/prisma/schema.prisma dashboard/lib/knowledge/governance.test.ts
git commit -m "feat: add knowledge governance metadata"
```

### Task 8: Make RAG retrieval metadata-aware and more trustworthy

**Files:**
- Modify: `dashboard/lib/knowledge/rag-query.ts`
- Create: `dashboard/lib/ai/knowledge-admin-query.ts`
- Create: `dashboard/lib/ai/knowledge-admin-query.test.ts`

- [ ] **Step 1: Write the failing knowledge-admin query test**

```ts
import { describe, expect, it } from "node:test";
import { answerKnowledgeAdminQuestion } from "@/lib/ai/knowledge-admin-query";

describe("answerKnowledgeAdminQuestion", () => {
  it("prefers SOP/policy sources with governance metadata and returns next actions", async () => {
    const result = await answerKnowledgeAdminQuestion("Tài liệu onboarding chuẩn cho kỹ thuật là gì?");

    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.nextActions.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/lib/ai/knowledge-admin-query.test.ts`
Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Add metadata-aware source scoring in `rag-query.ts`**

```ts
const sourcePriority = (chunk: ChunkWithContext & { metadata?: any }) => {
  const metadata = chunk.metadata ?? {};
  return (
    (metadata.canonical ? 2 : 0) +
    (metadata.documentType === "SOP" ? 2 : 0) +
    (metadata.documentType === "POLICY" ? 1 : 0)
  );
};

allChunks.sort((a, b) => {
  const byPriority = sourcePriority(b as any) - sourcePriority(a as any);
  if (byPriority !== 0) return byPriority;
  return b.similarity - a.similarity;
});
```

- [ ] **Step 4: Create a knowledge-admin answer helper**

```ts
import { queryKnowledge } from "@/lib/knowledge/rag-query";

export async function answerKnowledgeAdminQuestion(question: string) {
  const result = await queryKnowledge(question);
  return {
    summary: `Tìm thấy ${result.sourceNodes.length} nguồn tri thức liên quan.`,
    sources: result.sourceNodes.slice(0, 4).map((node) => ({
      type: "knowledge" as const,
      label: `${node.type}: ${node.name}`,
      ref: node.id,
    })),
    nextActions: [
      "Mở tài liệu nguồn để xác nhận",
      "Đối chiếu SOP với workflow hiện tại",
    ],
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- dashboard/lib/ai/knowledge-admin-query.test.ts`
Expected: PASS and the helper returns sources and next actions for enterprise knowledge questions.

- [ ] **Step 6: Commit**

```bash
git add dashboard/lib/knowledge/rag-query.ts dashboard/lib/ai/knowledge-admin-query.ts dashboard/lib/ai/knowledge-admin-query.test.ts
git commit -m "feat: make knowledge retrieval governance-aware"
```

---

## Phase 4 — Operational Knowledge Surfaces (Medium / P2)

### Task 9: Improve the knowledge graph page for enterprise usefulness

**Files:**
- Modify: `dashboard/app/api/knowledge/graph/route.ts`
- Create: `dashboard/components/knowledge/KnowledgeSourceBadge.tsx`
- Modify: `dashboard/app/(dashboard)/knowledge-graph/page.tsx`

- [ ] **Step 1: Write the acceptance checklist**

```md
Acceptance checks:
- Knowledge graph nodes expose governance metadata such as document type and source.
- The graph page can help a user understand which nodes are SOPs, policies, or workflows.
- The page feels useful for enterprise knowledge discovery, not only for visual appeal.
```

- [ ] **Step 2: Add metadata fields to the graph API response**

```ts
const graphNodes = nodes.map((n) => ({
  id: n.id,
  name: n.name,
  type: n.type,
  description: n.description,
  source: n.source,
  documentType: (n as any).metadata?.documentType ?? null,
  departmentCode: (n as any).metadata?.departmentCode ?? null,
  canonical: Boolean((n as any).metadata?.canonical),
  val: Math.max(1, n._count.outgoingEdges + n._count.incomingEdges),
  chunkCount: n._count.chunks,
}));
```

- [ ] **Step 3: Create a metadata badge component**

```tsx
export function KnowledgeSourceBadge({ label }: { label: string }) {
  return <span className="rounded border px-2 py-1 text-[10px] text-muted-foreground">{label}</span>;
}
```

- [ ] **Step 4: Render governance hints in the graph page’s side panel or list**

```tsx
<div className="flex flex-wrap gap-2 mt-2">
  {selectedNode?.documentType ? <KnowledgeSourceBadge label={selectedNode.documentType} /> : null}
  {selectedNode?.departmentCode ? <KnowledgeSourceBadge label={selectedNode.departmentCode} /> : null}
  {selectedNode?.canonical ? <KnowledgeSourceBadge label="Canonical" /> : null}
</div>
```

- [ ] **Step 5: Manually verify the graph page feels more enterprise-relevant**

Run: `npm run dev`
Expected: knowledge graph nodes reveal governance cues and the graph page better supports understanding process knowledge.

- [ ] **Step 6: Commit**

```bash
git add dashboard/app/api/knowledge/graph/route.ts dashboard/components/knowledge/KnowledgeSourceBadge.tsx dashboard/app/(dashboard)/knowledge-graph/page.tsx
git commit -m "feat: add governance cues to knowledge graph"
```

---

## Phase 5 — Knowledge Management Intelligence (Optional / P3)

### Task 10: Add knowledge insights for stale, missing, or weak coverage

**Files:**
- Create: `dashboard/app/api/knowledge/insights/route.ts`
- Test: `dashboard/app/api/knowledge/insights/route.test.ts`
- Modify: `dashboard/app/(dashboard)/knowledge-graph/page.tsx`

- [ ] **Step 1: Write the failing insights API test**

```ts
import { describe, expect, it } from "node:test";
import { GET } from "@/app/api/knowledge/insights/route";

describe("GET /api/knowledge/insights", () => {
  it("returns simple knowledge health metrics", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(typeof data.totalDocuments).toBe("number");
    expect(Array.isArray(data.byDocumentType)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- dashboard/app/api/knowledge/insights/route.test.ts`
Expected: FAIL because the route does not exist.

- [ ] **Step 3: Create a simple knowledge insights route**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const nodes = await prisma.kgNode.findMany({
    select: { metadata: true, source: true },
  });

  const byDocumentType = Object.entries(
    nodes.reduce<Record<string, number>>((acc, node: any) => {
      const type = node.metadata?.documentType ?? "UNKNOWN";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([type, count]) => ({ type, count }));

  return NextResponse.json({
    totalDocuments: nodes.length,
    byDocumentType,
  });
}
```

- [ ] **Step 4: Render a small insight card on the knowledge graph page**

```tsx
<Card>
  <CardContent className="pt-4">
    <p className="text-sm font-medium">Knowledge Health</p>
    <p className="text-xs text-muted-foreground mt-1">Xem phân bố tài liệu theo loại để phát hiện khoảng trống tri thức.</p>
  </CardContent>
</Card>
```

- [ ] **Step 5: Run test and verify the UI manually**

Run: `npm run test -- dashboard/app/api/knowledge/insights/route.test.ts && npm run dev`
Expected: insights API test passes and the graph page shows a basic knowledge-health surface.

- [ ] **Step 6: Commit**

```bash
git add dashboard/app/api/knowledge/insights/route.ts dashboard/app/api/knowledge/insights/route.test.ts dashboard/app/(dashboard)/knowledge-graph/page.tsx
git commit -m "feat: add knowledge insights surface"
```

---

## Documentation Alignment

### Task 11: Update architecture and demo docs for the new UX and AI knowledge story

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/demo-script.md`

- [ ] **Step 1: Write the documentation acceptance checklist**

```md
Acceptance checks:
- Architecture doc explains knowledge governance and workflow-aware AI.
- Demo script emphasizes HR/Admin pain points and action-oriented AI knowledge assistance.
- The story remains focused on fragmented internal operations.
```

- [ ] **Step 2: Update the architecture doc’s AI section**

```md
The AI layer now combines SQL, workflow state, and knowledge retrieval with governance metadata so it can answer SOP, policy, and process questions with context and next-action suggestions.
```

- [ ] **Step 3: Update the demo script to show operational and knowledge value**

```md
Demo 3: Show onboarding workflow status directly from the employee flow.
Demo 4: Ask AI which onboarding cases are incomplete and what SOP applies.
Demo 5: Show the knowledge graph or knowledge panel as operational support, not just as visualization.
```

- [ ] **Step 4: Review the docs in the IDE**

Expected: docs tell a focused story: HR/Admin pain -> employee action -> workflow visibility -> AI knowledge guidance.

- [ ] **Step 5: Commit**

```bash
git add docs/architecture.md docs/demo-script.md
git commit -m "docs: align ux and ai knowledge story"
```

---

## Plan Coverage Check

### Spec requirements covered

- **HR/Admin-first usability** → Phase 1 tasks 1-3.
- **Actionable employee/workflow experience** → Phase 1 task 1 and Phase 2 task 4.
- **Action-first homepage** → Phase 1 task 2.
- **Task-oriented navigation** → Phase 1 task 3.
- **AI embedded into the work loop** → Phase 2 tasks 5-6.
- **AI knowledge pain point: SOP/policy/process/workflow help** → Phase 2 task 6 and Phase 3 tasks 7-8.
- **Knowledge governance gaps** → Phase 3 task 7.
- **Obsidian-inspired but enterprise-useful knowledge exploration** → Phase 4 task 9.
- **Future knowledge management intelligence** → Phase 5 task 10.
- **Product and competition story alignment** → Documentation task 11.

### Gaps intentionally left out of the first pass

- Deep approval workflows are not repeated here because they already exist in the earlier upgrade plan and are adjacent rather than central to this UX/knowledge spec.
- Fully autonomous AI actions are intentionally excluded; the assistant remains guidance-first.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each task includes exact file paths, concrete code, commands, and expected outcomes.

### Type consistency check

- Workflow-related UI references use the same status family already introduced in the earlier workflow plan.
- AI source metadata remains `type`, `label`, and optional `ref` across API and UI.
- Knowledge governance terminology stays consistent: `documentType`, `departmentCode`, `canonical`, `owner`.

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-09-opendx-ux-and-ai-knowledge-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
