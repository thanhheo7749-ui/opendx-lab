<!--
ShopWise (OpenDX-Lab) - System Architecture Documentation
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# 🏗️ System Architecture — ShopWise (OpenDX-Lab)

**ShopWise** là nền tảng **Retail Decision Intelligence** cho cửa hàng bán lẻ thời trang, xây trên kiến trúc **DX-OS** (Digital Operating System) và mô hình **H-P-D-I**.

---

## 1. Tổng quan kiến trúc (H-P-D-I)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ShopWise Platform (Docker Compose)                    │
│                                                                         │
│  ┌─ [H] Human ───────────────────────────────────────────────────────┐ │
│  │  Keycloak (SSO/IAM)  │  Mattermost (Chat)  │  Wiki.js (Docs)     │ │
│  │  :8080               │  :3100              │  :3200              │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ [P] Process ─────────────────────────────────────────────────────┐ │
│  │  Next.js Dashboard (:3000)           │  Activepieces (:5678)      │ │
│  │  ├── BizScan (AI Operations Agent)   │  (Workflow Automation)     │ │
│  │  ├── Decision Advisor (AI Advisor)   │                            │ │
│  │  ├── Simulator (What-If Analysis)    │                            │ │
│  │  └── Data Import (CSV + Validation)  │                            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ [D] Data ────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL + pgvector (:5432)       │  Metabase BI (:3300)       │ │
│  │  ├── sb_* tables (retail data)       │  (Drag & drop dashboards)  │ │
│  │  ├── kg_* tables (knowledge graph)   │                            │ │
│  │  └── dx_* tables (operations)        │                            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ [I] Intelligence ────────────────────────────────────────────────┐ │
│  │  Ollama (Local LLM) (:11434)         │  RAG Engine (KG + Vector)  │ │
│  │  ├── qwen2.5:7b (main model)         │  ├── Document Chunking     │ │
│  │  ├── qwen2.5:0.5b (fast model)       │  ├── Vector Embeddings     │ │
│  │  └── nomic-embed-text (embeddings)   │  └── Entity Extraction     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Docker Services & Ports

| Service | Container | Image | Port | Vai trò |
|:--------|:----------|:------|:-----|:--------|
| **Dashboard** | `opendx-dashboard` | `node:20-alpine` | `:3000` | Next.js 15 — UI chính |
| **Keycloak** | `opendx-keycloak` | `keycloak:25.0` | `:8080` | SSO / IAM / RBAC |
| **Mattermost** | `opendx-mattermost` | `mattermost-team:10.2` | `:3100` | Chat nội bộ |
| **Wiki.js** | `opendx-wikijs` | `wiki:2` | `:3200` | Knowledge base |
| **Metabase** | `opendx-metabase` | `metabase:v0.50.3` | `:3300` | BI Dashboard |
| **PostgreSQL** | `opendx-postgres` | `pgvector/pgvector:pg16` | `5432` (internal) | Database chính |
| **Ollama** | `opendx-ollama` | `ollama/ollama` | `:11434` | Local LLM server |
| **Activepieces** | `opendx-activepieces` | `activepieces` | `:5678` | Workflow automation |

---

## 3. Dashboard Architecture (Next.js 15)

### 3.1 Cấu trúc thư mục

```
dashboard/
├── app/
│   ├── login/                    # Trang đăng nhập (Keycloak SSO)
│   ├── api/
│   │   ├── auth/                 # NextAuth.js handlers
│   │   ├── ai/                   # AI Chat endpoint
│   │   ├── bizscan/              # BizScan AI scan/findings
│   │   ├── decision/             # Decision Advisor API
│   │   ├── simulator/            # What-If Simulator API
│   │   ├── products/             # CRUD sản phẩm
│   │   ├── inventory/            # Quản lý kho
│   │   ├── import/               # CSV import pipeline
│   │   │   ├── csv/              #   Direct import
│   │   │   ├── validate/         #   Pre-import validation
│   │   │   └── approved/         #   Import approved rows only
│   │   ├── knowledge/            # Knowledge Graph APIs
│   │   │   ├── graph/            #   Graph visualization data
│   │   │   ├── upload/           #   Document upload → RAG
│   │   │   ├── sync/             #   Wiki.js sync
│   │   │   ├── sync-db/          #   DB → KG sync
│   │   │   ├── seed/             #   Sample data seeder
│   │   │   └── nodes/            #   CRUD KG nodes
│   │   ├── employees/            # CRUD nhân sự
│   │   ├── analytics/            # Dashboard analytics
│   │   ├── forecast/             # Dự báo doanh thu
│   │   └── health/               # Service health checks
│   └── (dashboard)/              # Protected layout group
│       ├── page.tsx              # Tổng quan (KPI Dashboard)
│       ├── bizscan/              # Quét vấn đề AI
│       ├── decision/             # Tư vấn quyết định AI
│       ├── simulator/            # Mô phỏng What-If
│       ├── products/             # Quản lý sản phẩm (CRUD)
│       ├── inventory/            # Quản lý kho hàng
│       ├── data-sources/         # Nhập dữ liệu (CSV + Manual)
│       ├── knowledge-graph/      # Bản đồ quan hệ (KG)
│       ├── analytics/            # Phân tích nâng cao
│       ├── employees/            # Quản lý nhân sự
│       ├── ai-chat/              # Chat AI
│       ├── supplier/             # Quản lý NCC
│       ├── journal/              # Nhật ký hoạt động
│       ├── approvals/            # Phê duyệt
│       ├── services/             # Trạng thái dịch vụ
│       └── workflows/            # Workflow automation
├── components/
│   ├── Sidebar.tsx               # Navigation (6 nhóm, RBAC)
│   ├── Header.tsx                # Header + user info + logout
│   ├── ui/                       # Shadcn/ui components
│   ├── ai/                       # AI Chat components
│   ├── knowledge/                # KG Canvas + NodeDetailPanel
│   └── workflows/                # Workflow components
├── lib/
│   ├── auth.ts                   # NextAuth + Keycloak OIDC
│   ├── prisma.ts                 # Prisma client
│   ├── api-auth.ts               # API auth guards (requireRole)
│   ├── ai/                       # Ollama client, embeddings
│   ├── bizscan/                  # BizScan engine
│   ├── decision/                 # Decision advisor engine
│   ├── knowledge/                # KG builder, chunker, extractor
│   ├── i18n.tsx                  # VI/EN internationalization
│   └── keycloak-admin.ts         # Keycloak Admin API client
├── prisma/
│   └── schema.prisma             # Database schema (23 models)
└── middleware.ts                  # Auth middleware (redirect)
```

### 3.2 Database Models (Prisma)

```
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL + pgvector                   │
│                                                           │
│  ┌── Retail Data (sb_*) ──────────────────────────────┐  │
│  │  SbProduct    │  SbCustomer   │  SbOrder           │  │
│  │  SbOrderItem  │  SbInventory  │  SbSupplier        │  │
│  │  SbSupplierProduct │ SbAdCampaign │ SbAdDailyStat  │  │
│  │  SbScanResult │  SbScanFinding │ SbMarketTrend     │  │
│  │  SbDecision                                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌── Knowledge Graph (kg_*) ──────────────────────────┐  │
│  │  KgNode (type, name, description, embeddings)      │  │
│  │  KgEdge (source → target, relation, weight)        │  │
│  │  KgChunk (content, vector embedding, tokenCount)   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌── Operations (dx_*) ───────────────────────────────┐  │
│  │  Department    │  Employee     │  ActivityLog      │  │
│  │  DxTicket      │  ApprovalRequest                  │  │
│  │  WorkflowExecution │ WorkflowStepExecution         │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Luồng dữ liệu chính

### 4.1 Import dữ liệu bán hàng

```
CSV File ──► Upload ──► Validate API ──► Comparison Table
                                              │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                         ✅ Mới          ⚠️ Conflict       ❌ Invalid
                         (auto-approve)  (user reviews)    (rejected)
                              │                │
                              ▼                ▼
                         Approved API ──► PostgreSQL (sb_* tables)
                                              │
                              ┌────────────────┼────────────────┐
                              ▼                ▼                ▼
                         Dashboard         Metabase          KG Sync
                         (auto)            (auto)            (manual)
```

### 4.2 AI Engine Pipeline

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   BizScan   │      │   Decision   │      │    Simulator     │
│ (Operations │      │   Advisor    │      │   (What-If)      │
│   Agent)    │      │              │      │                  │
└──────┬──────┘      └──────┬───────┘      └───────┬──────────┘
       │                    │                      │
       ▼                    ▼                      ▼
┌──────────────────────────────────────────────────────────────┐
│                   PostgreSQL (sb_* data)                       │
│  Products, Orders, Customers, Suppliers, Inventory, Trends   │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Ollama     │
                    │  (Local LLM) │
                    │  qwen2.5:7b  │
                    └──────────────┘
```

### 4.3 Knowledge Graph (RAG)

```
┌────────────────┐   ┌────────────────┐   ┌──────────────────┐
│  File Upload   │   │   Wiki.js      │   │   DB Sync        │
│  .pdf/.md/.txt │   │   Sync         │   │   (PostgreSQL)   │
└───────┬────────┘   └───────┬────────┘   └────────┬─────────┘
        │                    │                     │
        ▼                    ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    Ingestion Pipeline                          │
│  Extract Text → Chunk (500 tokens) → Embed (nomic-embed-text)│
│  → Entity Extraction (LLM) → Create KgNode/KgEdge            │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │   Knowledge Graph    │
                │   (react-force-2d)   │
                │                      │
                │  Node types:         │
                │  • CATEGORY (cyan)   │
                │  • CHANNEL (green)   │
                │  • SUPPLIER (amber)  │
                │  • PRODUCT (indigo)  │
                │  • SEGMENT (pink)    │
                │  • STRATEGY (orange) │
                └──────────────────────┘
```

---

## 5. Authentication & Authorization

### 5.1 SSO Flow (Keycloak OIDC)

```
Browser                    Dashboard (Next.js)              Keycloak
  │                              │                             │
  │── GET /dashboard ───────────►│                             │
  │                              │── middleware: no session ──►│
  │◄── redirect /login ─────────│                             │
  │                              │                             │
  │── click "SSO Login" ────────►│                             │
  │                              │── signIn("keycloak") ──────►│
  │◄── redirect to Keycloak ────│                             │
  │                              │                         ┌───┤
  │── enter username/password ──────────────────────────►  │KC │
  │◄── OIDC callback + code ──────────────────────────── ◄─┤UI │
  │                              │                         └───┤
  │                              │── POST /token ─────────────►│
  │                              │   (internal: keycloak:8080) │
  │                              │◄── JWT (roles, sub) ────────│
  │                              │                             │
  │◄── session cookie ──────────│                             │
  │── GET /dashboard ───────────►│── check session ──► OK      │
  │◄── dashboard HTML ──────────│                             │
```

### 5.2 RBAC (Role-Based Access Control)

| Role | Sidebar | Sản phẩm | Kho | Import | Nhân sự | BizScan/AI | Settings |
|:-----|:--------|:---------|:----|:-------|:--------|:-----------|:---------|
| **Admin** 👑 | Full | CRUD + Xóa | CRUD | ✅ | CRUD | ✅ | ✅ |
| **Manager** 📊 | Full | CRUD | CRUD | ✅ | Xem | ✅ | ❌ |
| **Staff** 🛒 | Hạn chế | Sửa | Cập nhật | ✅ | ❌ | ❌ | ❌ |
| **Viewer** 👁️ | Hạn chế | Xem | Xem | ❌ | ❌ | Xem | ❌ |

### 5.3 Keycloak Realm Config

* **Realm**: `opendx`
* **Self-Registration**: Enabled
* **Realm Roles**: `admin`, `manager`, `staff`, `viewer`, `employee`
* **Clients**:
  * `opendx-dashboard` (Confidential + Authorization Code Flow)
  * `mattermost-sso`, `wikijs-sso`

---

## 6. Sidebar Navigation (6 Groups)

```
📊 QUẢN LÝ
├── Tổng quan          /              (all roles)
├── Sản phẩm           /products      (admin, manager, staff)
├── Kho hàng           /inventory     (admin, manager, staff)
├── Nhân sự            /employees     (admin, manager)
├── NCC                /supplier      (admin, manager)

🔍 QUÉT & PHÁT HIỆN
├── Quét vấn đề        /bizscan       (admin, manager)
├── Nhật ký quét       /journal       (admin, manager)

💡 QUYẾT ĐỊNH
├── Tư vấn QĐ         /decision      (admin, manager)
├── Mô phỏng          /simulator     (admin, manager)

📈 PHÂN TÍCH
├── Phân tích          /analytics     (all roles)
├── Chat AI            /ai-chat       (all roles)

📥 DỮ LIỆU
├── Nhập dữ liệu      /data-sources  (admin, manager, staff)
├── Bản đồ quan hệ    /knowledge-graph (admin, manager)

⚙️ HỆ THỐNG
├── Workflow           /workflows     (admin)
├── Dịch vụ            /services      (admin)
├── Phê duyệt         /approvals     (admin, manager)
```

---

## 7. Docker Network

All services run on bridge network: `opendx-net`.

```
opendx-net (172.20.0.0/16)
├── postgres:5432       (internal only — no host port)
├── keycloak:8080       → localhost:8080
├── dashboard:3000      → localhost:3000
├── mattermost:8065     → localhost:3100
├── wikijs:3000         → localhost:3200
├── metabase:3000       → localhost:3300
├── activepieces:80     → localhost:5678
└── ollama:11434        → localhost:11434
```

**Dual-hostname Keycloak fix:**
- Browser redirect: `http://localhost:8080/realms/opendx` (KEYCLOAK_ISSUER)
- Server token exchange: `http://keycloak:8080/realms/opendx` (KEYCLOAK_ISSUER_INTERNAL)

---

## 8. Tech Stack Summary

| Layer | Technology | Version |
|:------|:-----------|:--------|
| Frontend | Next.js + React | 15.x |
| Styling | Tailwind CSS + Shadcn/ui | 4.x |
| Database | PostgreSQL + pgvector | 16 |
| ORM | Prisma | 6.x |
| Auth | NextAuth.js + Keycloak | v5 / 25.0 |
| AI/LLM | Ollama (Qwen2.5) | Latest |
| Embeddings | nomic-embed-text | Latest |
| BI | Metabase | v0.50.3 |
| Chat | Mattermost | 10.2 |
| Wiki | Wiki.js | 2.x |
| Automation | Activepieces | Latest |
| Container | Docker Compose | v2 |
| i18n | Custom (VI/EN) | — |
