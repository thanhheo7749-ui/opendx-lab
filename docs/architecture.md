<!--
OpenDX-Lab - System Architecture Documentation
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# 🏗️ System Architecture — OpenDX-Lab

This document describes the architecture of **OpenDX-Lab**, an open-source Digital Transformation ecosystem for enterprises, built on the **DX-OS** (Digital Operating System) model and the **H-P-D-I** control distribution architecture.

---

## 1. DX-OS Model & H-P-D-I Architecture

**OpenDX-Lab** organizes enterprise systems into 4 spaces corresponding to the pillars of digital transformation:

```
┌──────────────────────────────────────────────────────────────────┐
│                      OpenDX-Lab (Docker Compose)                 │
│                                                                  │
│  ┌─ [H] Human ─────────────────────────────────────────────┐    │
│  │  Keycloak (SSO)  │  Rocket.Chat (Chat)  │  Wiki.js (Wiki)│   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [P] Process ───────────────────────────────────────────┐    │
│  │  n8n (Workflow Automation)  │  Dashboard (Next.js Portal)│   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [D] Data ──────────────────────────────────────────────┐    │
│  │  PostgreSQL (Database)  │  Metabase (BI Dashboard)       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [I] Intelligence ──────────────────────────────────────┐    │
│  │  Ollama (Local LLM)  │  AI Chat (RAG Engine)            │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### [H] Human Space
Where people interact, communicate, and manage knowledge:
* **Keycloak (SSO)**: Centralized Identity & Access Management (IAM). Supports Single Sign-On via OAuth2/OpenID Connect (OIDC).
* **Rocket.Chat**: Real-time internal messaging system, replacing consumer chat apps in the workplace. Integrated with Keycloak SSO.
* **Wiki.js**: Knowledge management platform for internal documentation, SOPs, and processes. Integrated with Keycloak SSO.

### [P] Process Space
Connects data and automates business workflows:
* **n8n**: Low-code workflow automation engine. Listens for events and auto-updates across systems (e.g., create employee on Dashboard → auto-create Keycloak user → auto-send welcome message on Rocket.Chat).
* **Next.js Dashboard**: Main user-facing portal that connects all ecosystem services and provides task management.

### [D] Data Space
Centralized data storage and business intelligence:
* **PostgreSQL**: Shared relational database for the entire ecosystem, storing data for Dashboard, Keycloak, Wiki.js, n8n, and Metabase.
* **Metabase**: User-friendly BI dashboard tool. Enables drag-and-drop report creation for revenue, workforce, and operational metrics, embeddable into the Next.js Dashboard.

### [I] Intelligence Space
AI capabilities — secure and private:
* **Ollama**: Local LLM server (e.g., `Qwen2.5`, `Llama3`). Runs 100% offline on the enterprise's own infrastructure, ensuring zero data leakage.
* **AI Chat (RAG)**: Allows users to query enterprise data from PostgreSQL through natural language via the LLM.

---

## 2. SSO Integration Design (Keycloak Realm)

The system uses **Keycloak** as the centralized Identity Provider (IdP).

```
┌─────────────────┐
│                 │      1. Redirect to Login
│                 ├──────────────────────────────┐
│                 │                              │
│                 │      2. Auth & Grant Token   ▼
│   Next.js App   │◄──────────────────────  Keycloak (SSO)
│   (Dashboard)   │                         ▲    ▲    ▲
│                 │                         │    │    │
│                 │      3. Exchange OIDC   │    │    │
│                 │      credentials        │    │    │
└─────────────────┘                         │    │    │
                                            │    │    │
┌─────────────────┐                         │    │    │
│  Rocket.Chat    │◄────────────────────────┘    │    │
│  (Chat service) │   SAML/OIDC Authentication   │    │
└─────────────────┘                              │    │
                                                 │    │
┌─────────────────┐                              │    │
│  Wiki.js        │◄─────────────────────────────┘    │
│  (Wiki service) │   OIDC Authentication             │
└─────────────────┘                                   │
                                                      │
┌─────────────────┐                                   │
│  n8n            │◄──────────────────────────────────┘
│  (Workflow)     │   OAuth2 Authentication
└─────────────────┘
```

* **Realm**: `opendx`
* **Clients**:
  * `opendx-dashboard`: For the Next.js app (Access Type: Confidential + Authorization Code Flow).
  * `rocketchat-sso`: For Rocket.Chat.
  * `wikijs-sso`: For Wiki.js.
  * `n8n-sso`: For n8n.

---

## 3. Workflow Automation Flow (n8n)

When an admin performs an action on the Next.js Dashboard, a webhook is sent to n8n to trigger an automated workflow:

```
[Dashboard Next.js] ──(Webhook HTTP POST)──► [n8n Workflow Engine]
                                                   │
                                                   ├──► Step 1: Call Keycloak API to auto-create user
                                                   │
                                                   ├──► Step 2: Call Rocket.Chat API to create channel & send message
                                                   │
                                                   └──► Step 3: Call Wiki.js API to create personal onboarding page
```

---

## 4. AI Chat Architecture (Retrieval-Augmented Generation — RAG)

The Intelligence space operates using RAG to answer enterprise data questions accurately without model fine-tuning:

```
[User] ──(Question: "Who is the newest employee?")──► [Next.js Dashboard API]
                                                              │
                                                              ├──► Step 1: Extract intent using LLM (Ollama)
                                                              ├──► Step 2: Generate & execute SQL query on PostgreSQL
                                                              ├──► Step 3: Receive DB result (e.g., "Tran Minh Duc")
                                                              ├──► Step 4: Send raw result + original prompt to LLM
                                                              │
[User] ◄──(Answer: "The newest employee is Tran Minh Duc.")──┘
```

---

## 5. Internal Network Configuration (Docker Networks)

All services are deployed on a single Docker Bridge virtual network: `opendx-net`.
* Services can communicate directly using container names (e.g., n8n connects to DB at `postgres:5432`).
* Only user-facing interfaces expose ports to the host machine, keeping databases and internal services secure.
