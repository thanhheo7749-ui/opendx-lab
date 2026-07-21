<!--
OpenDX-Lab - Digital Transformation Ecosystem
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

<div align="center">

# 🏢 OpenDX-Lab

### Enterprise Digital Transformation Ecosystem — 100% Open Source

_One command to spin up a fully integrated DX ecosystem: SSO, Chat, Wiki, Workflow Automation, BI, and AI Assistant — all pre-connected._

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](docker-compose.yml)
[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen)]()

[Quick Start](#-quick-start) | [Architecture](#-architecture) | [Tech Stack](#%EF%B8%8F-technology-stack) | [Docs](docs/) | [Contributing](CONTRIBUTING.md)

</div>

---

## 📖 What is OpenDX-Lab?

**OpenDX-Lab** is an open-source platform that integrates best-of-breed open-source tools into a complete Digital Transformation ecosystem for enterprises, following the **H-P-D-I** (Human–Process–Data–Intelligence) architecture.

### The Problem

> Enterprises use 4–5 disconnected software systems (HR, IT, Accounting…). Employees rely on **messaging apps + memory** as the "glue" between systems. Forget one message = system error. Too busy = delays.

### The Solution

> **One command: `docker compose up -d`** → Instantly launch a complete DX ecosystem: SSO, Chat, Wiki, Workflow Automation, BI Dashboard, AI Assistant — all **pre-connected**, **single sign-on**, **data flows automatically**.

---

## ✨ Highlights

- 🔐 **Single Sign-On (SSO)** — Keycloak provides centralized authentication for all services
- 💬 **Internal Chat** — Mattermost replaces consumer messaging apps for work
- 📚 **Knowledge Wiki** — Wiki.js manages internal documentation and SOPs
- 🔄 **Workflow Automation** — n8n automates cross-system processes (onboarding, offboarding)
- 📊 **BI Dashboard** — Metabase visualizes data from all systems
- 🤖 **AI Assistant** — Ollama + Qwen LLM answers questions using your company's data
- 🐳 **One-command Setup** — Docker Compose launches the entire ecosystem
- 🆓 **100% Free & Open Source** — Every component is open source

---

## 📋 Table of Contents

- [What is OpenDX-Lab?](#-what-is-opendx-lab)
- [Architecture (H-P-D-I)](#-architecture)
- [Quick Start](#-quick-start)
- [Technology Stack](#%EF%B8%8F-technology-stack)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗 Architecture

### H-P-D-I Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      OpenDX-Lab (Docker Compose)                 │
│                                                                  │
│  ┌─ [H] Human ──────────────────────────────────────────────┐   │
│  │  Keycloak (SSO)  │  Mattermost (Chat)  │  Wiki.js (Wiki) │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [P] Process ────────────────────────────────────────────┐   │
│  │  n8n (Workflow Automation)  │  Dashboard (Next.js)       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [D] Data ───────────────────────────────────────────────┐   │
│  │  PostgreSQL (Database)  │  Metabase (BI Dashboard)       │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ [I] Intelligence ───────────────────────────────────────┐   │
│  │  Ollama + Qwen 2.5 (Local LLM)  │  AI Chat (RAG SQL)    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### How It Works: Employee Onboarding Example

```
Admin creates a new employee on Dashboard
    │
    ├──→ [P] n8n workflow triggers automatically
    ├──→ [H] Keycloak creates SSO account via Admin API
    ├──→ [H] Mattermost sends welcome message via webhook
    ├──→ [D] PostgreSQL stores employee record
    ├──→ [D] Metabase dashboard auto-updates metrics
    └──→ [I] AI Chat can answer "Who is the newest employee?"

1 action → 6 systems react → 0 manual steps
```

---

## 🚀 Quick Start

### System Requirements

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
```

Wait 2–3 minutes for all services to start, then access:

| Service | URL | Description |
|---|---|---|
| **Dashboard** | http://localhost:3000 | Main portal (Next.js) |
| **Keycloak** | http://localhost:8080 | SSO Admin Console |
| **Mattermost** | http://localhost:3100 | Internal Chat |
| **Wiki.js** | http://localhost:3200 | Knowledge Wiki |
| **n8n** | http://localhost:5678 | Workflow Editor |
| **Metabase** | http://localhost:3300 | BI Dashboard |
| **Ollama** | http://localhost:11434 | LLM API |

### Default Keycloak Admin

| | |
|---|---|
| **URL** | http://localhost:8080/admin |
| **Username** | `admin` |
| **Password** | `admin123` |

> Other services (Mattermost, Wiki.js, n8n, Metabase) require first-time setup on initial access, or can be configured to use Keycloak SSO.

---

## 🛠️ Technology Stack

| Layer | Service | Version | License | Role |
|---|---|---|---|---|
| **[H] Human** | Keycloak | 25.0 | Apache-2.0 | SSO, user management, RBAC |
| **[H] Human** | Mattermost | 10.2 | MIT | Internal team chat |
| **[H] Human** | Wiki.js | 2.x | AGPL-3.0 | Knowledge base & documentation |
| **[P] Process** | n8n | 1.45 | Sustainable Use | Workflow automation |
| **[P] Process** | Next.js | 16.2 | MIT | Dashboard web application |
| **[D] Data** | PostgreSQL | 16 | PostgreSQL License | Shared relational database |
| **[D] Data** | Metabase | 0.50.3 | AGPL-3.0 | Business intelligence & charts |
| **[I] Intelligence** | Ollama | latest | MIT | Local LLM runtime |
| **[I] Intelligence** | Qwen 2.5 | 3B | Apache-2.0 | Language model (Vietnamese) |
| **Deploy** | Docker Compose | v2 | Apache-2.0 | Container orchestration |

### Dashboard Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI library |
| TypeScript | 5.x | Type-safe language |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | 4.11 | Component library |
| Prisma | 6.9 | ORM (database access) |
| NextAuth.js | 5.0 beta | Authentication (Keycloak OIDC) |

---

## 📁 Project Structure

```
opendx-lab/
├── .github/                    # CI/CD & issue templates
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── workflows/
│       └── ci.yml
├── configs/                    # Service configurations
│   ├── keycloak/               # Realm import (SSO config)
│   ├── n8n/                    # Workflow templates (onboarding, offboarding)
│   ├── metabase/               # Dashboard templates
│   └── postgres/               # Database init scripts
├── dashboard/                  # Next.js web application
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities & API clients
│   ├── prisma/                 # Database schema & seed
│   └── public/                 # Static assets
├── docs/                       # Documentation
│   ├── api.md
│   ├── architecture.md
│   ├── demo-script.md
│   ├── deployment.md
│   ├── sso-setup.md
│   └── user-guide.md
├── scripts/                    # Utility scripts
│   ├── setup.sh                # Automated setup
│   └── reset.sh                # Full reset (destroy + rebuild)
├── .env.example                # Environment variables template
├── docker-compose.yml          # ★ One command launches everything
├── justfile                    # Task runner commands
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE                     # GPL-3.0
├── SECURITY.md
└── THIRD_PARTY_LICENSES.md
```

---

## 📚 Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | H-P-D-I architecture & service diagrams |
| [Deployment](docs/deployment.md) | Production deployment guide |
| [User Guide](docs/user-guide.md) | End-user guide |
| [SSO Setup](docs/sso-setup.md) | Keycloak SSO configuration |
| [API](docs/api.md) | API endpoints documentation |
| [Demo Script](docs/demo-script.md) | Step-by-step demo walkthrough |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

```bash
# Fork & clone
git clone https://github.com/YOUR_USERNAME/opendx-lab.git

# Create a branch
git checkout -b feature/your-feature

# Commit & push
git commit -m "feat: add your feature"
git push origin feature/your-feature

# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.

All integrated open-source services retain their original licenses. See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for details.

---

<div align="center">

**⭐ Star this repo if you find it useful!**

</div>
