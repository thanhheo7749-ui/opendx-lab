<!--
ShopWise — Decision Intelligence for SME Retail
Copyright (C) 2026 ShopWise Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

<div align="center">

# ShopWise

### Decision Intelligence Platform for SME Retail — 100% Open Source

_AI-powered decision support for e-commerce shop owners: inventory, pricing, supplier selection, and ad spend — backed by data, not guesswork._

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](docker-compose.yml)
[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen)]()

[Quick Start](#quick-start) | [Features](#features) | [Architecture](#architecture) | [Tech Stack](#technology-stack) | [Docs](docs/)

</div>

---

## What is ShopWise?

**ShopWise** is an open-source **Decision Support System** built for small-to-medium e-commerce shop owners in Vietnam (Shopee, Lazada, TikTok Shop, Facebook). It integrates sales data analysis, market intelligence, and supplier comparison into a single platform that helps shop owners make better business decisions.

### The Problem

> SME shop owners (1–10 employees) make dozens of daily decisions — restocking, pricing, ad budgets, supplier selection — based on gut feeling and spreadsheets. No access to enterprise-grade analytics. Mistakes cost real money.

### The Solution

> **ShopWise** scans your business data, surfaces problems proactively, recommends options with pros/cons/estimated impact, lets you simulate outcomes before committing, and tracks whether predictions were accurate — creating a continuous learning loop.

---

## Features

- **Decision Feed** — Auto-detects inventory shortages, pricing anomalies, and underperforming ads
- **Decision Advisor** — Analyzes data and presents 2–3 actionable options with estimated impact
- **What-if Simulator** — Test pricing, inventory, and ad spend scenarios before committing
- **Supplier Matcher** — Multi-criteria scoring (price, quality, delivery, location) across suppliers
- **Decision Journal** — Track decisions over 7 days, compare predicted vs actual outcomes
- **Knowledge Graph** — Visualize relationships between products, suppliers, customers, and channels
- **BizScan** — Deep scan for operational anomalies and opportunities
- **AI Chat** — Ask questions about your business data in natural language
- **BI Dashboards** — Metabase-powered visual analytics for revenue, products, and campaigns

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    ShopWise (Docker Compose)                    │
│                                                                │
│  ┌─ Discovery ─────────────────────────────────────────────┐   │
│  │  Decision Feed  │  BizScan  │  Knowledge Graph          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ Decision ──────────────────────────────────────────────┐   │
│  │  Decision Advisor  │  Simulator  │  Supplier Matcher     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ Analysis ──────────────────────────────────────────────┐   │
│  │  Decision Journal  │  Metabase BI  │  AI Chat (Ollama)  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌─ Infrastructure ───────────────────────────────────────┐    │
│  │  PostgreSQL  │  Keycloak SSO  │  Mattermost  │ Wiki.js │    │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

### End-to-End Flow

```
Homepage (Decision Feed)
  → "12 products running low" → Click
    → /decision?type=inventory (auto-selected)
      → Analyze → Choose option
        → "Simulate first" → /simulator
        → "Confirm" → Record decision + reason
          → Saved to sb_decisions
            → /journal (tracked for 7 days)
              → Compare predicted vs actual impact
```

---

## Quick Start

### Requirements

| Requirement | Minimum |
|---|---|
| Docker Desktop | v4+ (with Compose v2) |
| RAM | 16 GB |
| Disk Space | 20 GB free |
| OS | Windows / macOS / Linux |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/thanhheo7749-ui/opendx-lab.git
cd opendx-lab

# 2. Copy environment variables
cp .env.example .env

# 3. Start all services
docker compose up -d

# 4. Push database schema & seed sample data
docker exec opendx-dashboard npx prisma db push
docker exec opendx-dashboard npx tsx prisma/seed-bizscan.ts
```

Wait 2–3 minutes for services to start, then access:

| Service | URL | Description |
|---|---|---|
| **Dashboard** | http://localhost:3000 | ShopWise main app |
| **Metabase** | http://localhost:3300 | BI dashboards |
| **Keycloak** | http://localhost:8080 | SSO admin |
| **Mattermost** | http://localhost:3100 | Team chat |
| **Wiki.js** | http://localhost:3200 | Knowledge base |
| **Ollama** | http://localhost:11434 | Local LLM API |

---

## Technology Stack

| Layer | Service | License | Role |
|---|---|---|---|
| **Frontend** | Next.js 15 (App Router) | MIT | Dashboard web app |
| **UI** | shadcn/ui + Tailwind CSS | MIT | Component library |
| **ORM** | Prisma | Apache 2.0 | Database access |
| **Database** | PostgreSQL 17 | PostgreSQL | Relational data store |
| **BI** | Metabase | AGPL-3.0 | Business intelligence |
| **LLM** | Ollama (Gemma/Llama) | MIT | Local AI inference |
| **Auth** | Keycloak + NextAuth | Apache/MIT | SSO & authentication |
| **Chat** | Mattermost | MIT | Internal communication |
| **Wiki** | Wiki.js | AGPL-3.0 | Documentation |
| **Deploy** | Docker Compose | Apache 2.0 | Container orchestration |

---

## Database Models

| Model | Table | Purpose |
|---|---|---|
| `SbProduct` | `sb_products` | Product catalog |
| `SbCustomer` | `sb_customers` | Customer profiles & tiers |
| `SbOrder` / `SbOrderItem` | `sb_orders` / `sb_order_items` | Sales transactions |
| `SbInventory` | `sb_inventory` | Stock levels & reorder points |
| `SbAdCampaign` / `SbAdDailyStat` | `sb_ad_campaigns` / `sb_ad_daily_stats` | Ad performance |
| `SbMarketTrend` | `sb_market_trends` | Market intelligence |
| `SbDecision` | `sb_decisions` | Decision journal |
| `SbSupplier` / `SbSupplierProduct` | `sb_suppliers` / `sb_supplier_products` | Supplier catalog |
| `KgNode` / `KgEdge` | `kg_nodes` / `kg_edges` | Knowledge graph |

---

## Project Structure

```
opendx-lab/
├── docker-compose.yml            # All services
├── dashboard/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx          # Homepage (Decision Feed + KPI)
│   │   │   ├── decision/         # Decision Advisor
│   │   │   ├── simulator/        # What-if Simulator
│   │   │   ├── supplier/         # Supplier Matcher
│   │   │   ├── journal/          # Decision Journal
│   │   │   ├── bizscan/          # BizScan
│   │   │   ├── knowledge-graph/  # Knowledge Graph
│   │   │   ├── analytics/        # Metabase BI
│   │   │   └── ai-chat/          # AI Chat
│   │   └── api/
│   │       ├── decision/         # Decision APIs (feed, log, supplier, feedback)
│   │       ├── bizscan/          # BizScan APIs
│   │       ├── simulator/        # Simulator API
│   │       └── ...
│   ├── lib/
│   │   └── decision/             # Business logic (advisor, supplier, feedback)
│   └── prisma/
│       ├── schema.prisma         # Database schema
│       └── seed-bizscan.ts       # Sample data generator
├── configs/                      # Service configs (Keycloak, Metabase, etc.)
├── docs/                         # Documentation
└── scripts/                      # Utility scripts
```

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System architecture & service diagrams |
| [Deployment](docs/deployment.md) | Production deployment guide |
| [User Guide](docs/user-guide.md) | End-user guide |
| [SSO Setup](docs/sso-setup.md) | Keycloak SSO configuration |
| [API](docs/api.md) | API endpoints documentation |
| [Build From Source](BUILD.md) | Source build & troubleshooting |

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

```bash
git clone https://github.com/YOUR_USERNAME/opendx-lab.git
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## License

This project is licensed under **GNU General Public License v3.0**. See [LICENSE](LICENSE).

All integrated open-source services retain their original licenses. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
