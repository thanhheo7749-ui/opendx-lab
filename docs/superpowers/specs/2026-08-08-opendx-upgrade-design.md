<!--
OpenDX-Lab - Upgrade Design Specification
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# OpenDX-Lab Upgrade Design

**Date:** 2026-08-08  
**Scope:** Strategic and flow-level upgrade design for OpenDX-Lab  
**Purpose:** Evaluate whether the current system really solves a real enterprise problem, identify where the current flows and structure are already coherent, and define the highest-value upgrades for competition readiness and real-world business relevance.

---

## 1. Executive Summary

OpenDX-Lab already has a strong architectural story: a single ecosystem that combines identity, chat, documentation, workflow automation, analytics, and local AI into one digital workplace. The system is coherent enough to demonstrate the idea of enterprise digital transformation, especially through the current SSO, employee management, workflow, and AI demo flows.

However, in its current form, the product is more convincing as a **technology ecosystem demo** than as a sharply positioned **solution to one painful business problem**. This is the main gap.

The best positioning is:

> **OpenDX-Lab is an internal digital operations platform that reduces fragmented systems and manual employee operations, starting with onboarding/offboarding automation as the anchor use case.**

This framing is important because real businesses do not buy or adopt “a collection of tools.” They adopt a system that removes operational pain:

- too many disconnected systems,
- too many manual steps,
- no unified identity and access control,
- poor visibility into operations,
- low reuse of internal knowledge,
- weak internal automation.

### Core conclusion

- **Yes, the current product can solve a real business problem.**
- **But only if it is positioned around one clear problem first:** fragmented internal operations, proven by onboarding/offboarding automation.
- The current architecture is good enough to support this story, but the flows need to become more business-realistic and less demo-linear.

---

## 2. What Real Business Problem Should This Product Solve?

For competition and practical relevance, OpenDX-Lab should explicitly target this enterprise pain point:

## Primary pain point

### Fragmented internal operations and manual employee workflows

Many growing organizations still manage employee operations through a mix of:

- spreadsheets,
- chat messages,
- email,
- separate user accounts,
- disconnected documentation,
- manual admin work.

This creates problems such as:

- onboarding takes too many steps,
- offboarding is inconsistent and risky,
- employee data is duplicated across tools,
- managers cannot see real-time operational status,
- internal knowledge is hard to find,
- system access is hard to control centrally.

## Why this is a strong fit for OpenDX-Lab

Because the existing product already includes the right building blocks:

- **Keycloak** for identity and access,
- **Dashboard** as the unified entry point,
- **Mattermost** for internal communication,
- **Wiki.js** for internal knowledge,
- **n8n** for workflow automation,
- **Metabase** for visibility and analytics,
- **Ollama + AI Chat** for internal intelligence.

This means the product is already aligned with a real problem. The main task is not to change the idea completely, but to sharpen it and deepen the operational flows.

---

## 3. Assessment of the Current Structure and Flows

## 3.1 What is already linked well

### A. Identity-centered architecture is coherent

The system uses Keycloak as the central identity layer, which is a strong enterprise pattern. SSO creates a natural backbone across the ecosystem.

This is good because it makes the product feel like one platform instead of several independent tools.

### B. Dashboard as the central portal is the right structural choice

The Dashboard acts as the visible control point for users. That is the right role for a product positioned as an internal digital workplace.

### C. The current onboarding demo already proves cross-system integration

The current employee creation flow already demonstrates real value:

- create employee in Dashboard,
- store data,
- trigger automation,
- create account in Keycloak,
- notify through Mattermost,
- update activity logs.

This is the strongest current business-facing flow.

### D. The AI layer is already attached to enterprise data

The AI Chat is not just generic chat. It is attached to business data and can answer HR-related questions from the database. That is a good foundation.

---

## 3.2 Where the current system is not yet strong enough

### A. The product narrative is still too broad

Right now the product can be interpreted as:

- an enterprise OS,
- an integration demo,
- a DX architecture showcase,
- a local AI demo,
- a workflow automation demo.

This makes it impressive, but also makes it harder to answer one very practical judge question:

> “What exact problem is this solving for a real company?”

### B. Workflow automation is still too optimistic and success-path-oriented

Current flows mostly show the happy path:

- action happens,
- automation runs,
- all systems update.

Real enterprise workflows usually also need:

- approval steps,
- retries,
- failure notifications,
- escalation rules,
- partial completion handling,
- audit trail per step.

Without these, the workflow layer looks like a demo automation layer rather than a production-like operations engine.

### C. AI Chat is useful but still too narrow

The current AI flow is mainly:

- understand question,
- generate SQL,
- query database,
- answer in Vietnamese.

That is good for demonstration, but limited in enterprise value. It is still closer to **data Q&A** than to an **operations assistant**.

### D. Wiki/knowledge is not yet deeply connected to workflows

Wiki.js is present in the architecture, but it is not yet deeply justified in the business flow. Right now it can feel like a useful component that exists nearby, rather than a critical part of operational execution.

### E. Monitoring and analytics are present, but not yet operationally decisive

Service health and analytics exist, but the system does not yet strongly answer questions like:

- which workflows are blocked,
- which employee onboarding tasks are incomplete,
- where operational bottlenecks are happening,
- who needs to act next.

---

## 4. Product Positioning Recommendation

The recommended positioning for OpenDX-Lab is:

## Recommended positioning

> **An internal digital operations platform for growing organizations that reduces fragmented systems and manual employee operations through unified identity, workflow automation, shared knowledge, analytics, and local AI assistance.**

## Anchor use case

The main proof flow should be:

### Employee onboarding / offboarding

Why this use case works best:

- every organization understands it,
- it naturally touches identity, communication, workflow, documentation, and analytics,
- it has clear before/after value,
- it is easy to demonstrate live,
- it is a real business pain point.

## Supporting use cases

Once the anchor use case is established, the platform can expand to:

- leave request / approval,
- access request workflows,
- procurement request workflows,
- SOP discovery and internal knowledge search,
- manager operations dashboard,
- AI operational support.

---

## 5. Detailed Upgrade Recommendations

## 5.1 Priority 1 — Make workflow automation business-realistic

This is the most important upgrade area.

### Current limitation

The current workflow flow proves integration, but not enough operational depth.

### Upgrade goals

The workflow layer should become:

- traceable,
- resilient,
- approval-aware,
- role-aware,
- failure-aware.

### Recommended upgrades

#### A. Multi-step onboarding checklist

Instead of “create employee → everything done,” model onboarding as a tracked process with steps such as:

1. employee record created,
2. SSO account created,
3. default role assigned,
4. department channel invitation sent,
5. onboarding wiki page created,
6. manager notified,
7. final status marked complete.

Each step should have:

- status,
- timestamp,
- actor/system owner,
- failure reason if any.

#### B. Offboarding flow with risk control

Offboarding should not be just status change. It should include:

- disable SSO account,
- revoke application access,
- notify relevant teams,
- archive or transfer knowledge/page ownership,
- mark completion in an audit record.

This is important because offboarding is a real enterprise risk area.

#### C. Exception handling

Add explicit handling for cases like:

- Keycloak user creation fails,
- Mattermost notification fails,
- duplicate email detected,
- workflow runs partially and needs retry.

The system should expose:

- failure state,
- retry action,
- human intervention path.

#### D. Approval-based workflows

To feel more enterprise-real, add at least one workflow with approval logic, such as:

- leave request,
- equipment request,
- access request,
- employee status change approval.

This shows that the platform handles not only sync automation but also business process control.

#### E. Workflow observability

Expose workflow states in Dashboard:

- pending,
- running,
- completed,
- failed,
- waiting for approval.

That makes the automation layer visible and operationally useful.

---

## 5.2 Priority 1 — Upgrade AI Chat from data Q&A to operations assistant

This is the second highest-value improvement.

### Current limitation

The AI can answer direct data questions, but it is not yet acting like an internal operations assistant.

### Target role

The assistant should help users understand business status, missing actions, and operational anomalies.

### Recommended upgrades

#### A. Support operational questions, not just factual queries

Examples:

- “Which onboarding cases are still incomplete?”
- “Which workflows failed today?”
- “Who joined this week but has not received full access yet?”
- “Which department has the highest number of pending actions?”

#### B. Blend structured data and internal knowledge

The assistant should gradually answer from both:

- PostgreSQL data,
- Wiki.js internal documentation,
- workflow state/history.

This is a major step from pure SQL Q&A to knowledge-grounded assistance.

#### C. Add explanation and confidence framing

The AI should not only answer. It should also explain:

- what source it used,
- what assumptions it made,
- what actions the user may want to take next.

Example:

> “Three onboarding cases are incomplete. Two are waiting for manager approval, and one failed at account creation because the email already exists.”

#### D. Add guided follow-up suggestions

After each answer, the system can suggest:

- inspect workflow,
- open employee record,
- retry failed step,
- view related SOP.

That makes the AI operationally actionable.

#### E. Introduce assistant-safe action boundaries

Do not immediately make the AI fully autonomous. Instead, support:

- read-only diagnosis,
- suggested next actions,
- user-confirmed workflow triggers later.

This keeps the system safe while making the AI more useful.

---

## 5.3 Priority 1 — Connect knowledge management to business flows

### Current limitation

Wiki.js exists architecturally, but its role in the core business value is still weak.

### Recommended upgrades

#### A. Auto-create onboarding knowledge pages

When a new employee is created, optionally create a personal onboarding or department starter page with:

- welcome content,
- role-specific checklist,
- key internal links,
- SOP references.

#### B. Link workflows to SOPs

Every important workflow should have a linked knowledge page that explains:

- what the process does,
- who owns it,
- what to do if it fails,
- what approvals are needed.

#### C. Allow AI to use wiki content

The assistant should eventually answer questions like:

- “What is the onboarding process for a new HR employee?”
- “What should I do when access creation fails?”

This makes the knowledge layer directly useful.

---

## 5.4 Priority 2 — Improve operational visibility and management

### Recommended upgrades

#### A. Role-based dashboards

Different users should see different operational views:

- **Admin:** system health, failed workflows, identity and access issues;
- **Manager:** onboarding progress, department people changes, pending approvals;
- **Employee:** personal tasks, onboarding progress, useful links.

#### B. Workflow SLA and aging indicators

Show not only status, but also:

- how long a workflow has been pending,
- which task is overdue,
- where approval is blocked.

#### C. Operational alerts

Add alerting for:

- failed workflows,
- unavailable services,
- repeated authentication errors,
- unusual backlog.

#### D. Activity feed improvements

The activity feed should classify events by type:

- employee event,
- security event,
- workflow event,
- AI query event,
- service event.

This helps the platform feel like an operating center.

---

## 5.5 Priority 3 — Expand beyond the first anchor flow

These upgrades are useful, but not as urgent as the first three groups.

### Good next business flows

- leave request and approval,
- internal asset or equipment request,
- access permission request,
- probation / evaluation reminders,
- onboarding by role template.

These help the platform look like something a business could grow with after the competition.

---

## 6. Proposed Improved Flows

## 6.1 Proposed onboarding flow

### Current flow

Create employee → create account → send message → log activity.

### Improved flow

1. Admin creates employee in Dashboard.
2. Workflow instance is created with a visible tracking ID.
3. System validates duplicate email and department mapping.
4. Keycloak account is created.
5. Default role and groups are assigned.
6. Mattermost welcome notification is sent.
7. Personal or department onboarding wiki page is created.
8. Manager receives onboarding summary.
9. Workflow status becomes:
   - completed,
   - partial failure,
   - waiting for approval,
   - needs retry.
10. Dashboard shows step-by-step progress and history.

### Business value

- reduces manual steps,
- improves accountability,
- creates auditable onboarding,
- makes the process visible.

---

## 6.2 Proposed offboarding flow

1. Manager or admin initiates employee termination/status change.
2. Workflow validates required approvals.
3. Keycloak access is disabled.
4. Optional connected service access is revoked.
5. Mattermost and related group access are updated.
6. Knowledge ownership is transferred or archived.
7. Final checklist is stored in audit history.
8. Dashboard marks process complete and logs any unresolved items.

### Business value

- reduces access risk,
- reduces missed steps,
- improves compliance and traceability.

---

## 6.3 Proposed AI assistant flow

1. User asks an operational question.
2. Assistant classifies the request type:
   - factual data question,
   - workflow status question,
   - SOP/process question,
   - anomaly/risk question.
3. Assistant queries the appropriate sources:
   - SQL data,
   - workflow history,
   - wiki knowledge,
   - service/operational metadata.
4. Assistant returns:
   - answer,
   - source summary,
   - confidence framing,
   - suggested next actions.
5. User may optionally open related workflow or record.

### Business value

- reduces search effort,
- shortens decision time,
- increases practical usefulness of internal data.

---

## 7. What Should Be Emphasized vs. De-emphasized in the Competition

## Emphasize

- One real business pain point: fragmented internal operations.
- One strong proof flow: onboarding/offboarding automation.
- Unified SSO and identity layer.
- Dashboard as the operational control center.
- AI as a practical internal assistant, not just a flashy demo.
- Open-source, private, locally deployable architecture.

## De-emphasize

- trying to claim the platform solves all enterprise digital transformation problems at once,
- showing too many disconnected features in one demo,
- over-promising AI autonomy,
- presenting every service as equally important.

The story should be focused.

---

## 8. Roadmap Recommendation

## Phase A — Must strengthen for competition

These upgrades give the highest improvement in clarity and business relevance:

1. Reframe product positioning around fragmented internal operations.
2. Strengthen onboarding/offboarding as the flagship flow.
3. Add workflow status visibility and error states.
4. Expand AI from simple HR SQL Q&A to basic operational assistant behavior.
5. Tie Wiki.js into onboarding and SOP support.

## Phase B — Strong next-step upgrades

1. Add one approval-based workflow.
2. Add role-based operational dashboards.
3. Add alerts for failed workflows and service issues.
4. Add workflow audit/history exploration.

## Phase C — Future expansion

1. Asset and access request workflows.
2. Department-specific workflow templates.
3. AI-guided workflow recommendations.
4. More advanced knowledge retrieval and multi-source reasoning.

---

## 9. Final Verdict

## Are the current flows and structure already well connected?

**Yes, at the architecture and demo level.**

The system already has a coherent skeleton:

- unified identity,
- central dashboard,
- automated cross-system flow,
- analytics,
- AI over internal data.

That is a strong base.

## Are they already strong enough to prove real business value?

**Partially, but not fully yet.**

The current system proves that integration is possible. It does not yet fully prove that daily enterprise operations are reliably improved under realistic conditions.

## Does the product solve a real enterprise problem?

**Yes — if framed correctly.**

The product should not be presented as “we solve all digital transformation.”
It should be presented as:

> **We solve fragmented internal operations and manual employee workflows, starting with onboarding/offboarding as the most visible business case.**

That is real, common, defensible, and aligned with the current architecture.

## Most important overall recommendation

**Narrow the business story, deepen the operational flows, and elevate AI from data Q&A into workflow-aware internal assistance.**

That change will make OpenDX-Lab feel much more like a real enterprise product and much less like a collection of integrated open-source services.
