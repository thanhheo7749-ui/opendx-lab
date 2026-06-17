<!--
OpenDX-Lab - Digital Transformation Ecosystem
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

<div align="center">

# 🏢 OpenDX-Lab

### Enterprise Digital Transformation Ecosystem — 100% Open Source

*One command to spin up a fully integrated DX-Lab: SSO, Chat, Wiki, Workflow Automation, BI, and AI Assistant — all pre-connected.*

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](docker-compose.yml)
[![OLP 2026](https://img.shields.io/badge/OLP-Open%20Source%202026-orange)](https://vfossa.vn)
[![Open Source](https://img.shields.io/badge/Open%20Source-100%25-brightgreen)]()

[Quick Start](#-quick-start) | [Architecture](#-architecture) | [Demo](#-demo-credentials) | [Docs](docs/) | [Contributing](CONTRIBUTING.md)

</div>

---

## 📖 What is OpenDX-Lab?

**OpenDX-Lab** is an open-source distribution that integrates best-of-breed open-source tools into a complete Digital Transformation ecosystem for enterprises, following the **DX-OS** model and the **H-P-D-I** (Human–Process–Data–Intelligence) architecture.

### The Problem

> Enterprises use 4–5 disconnected software systems (HR, IT, Accounting…). Employees rely on **messaging apps + memory** as the "glue" between systems. Forget one message = system error. Too busy = delays.

### The Solution

> **One command: `docker compose up`** → Instantly launch a complete DX ecosystem: SSO, Chat, Wiki, Workflow Automation, BI Dashboard, AI Assistant — all **pre-connected**, **single sign-on**, **data flows automatically**.

---

## ✨ Highlights

- 🔐 **Single Sign-On (SSO)** — Keycloak provides centralized authentication for all tools
- 💬 **Internal Chat** — Rocket.Chat replaces consumer messaging apps for work
- 📚 **Knowledge Wiki** — Wiki.js manages internal documentation and SOPs
- 🔄 **Workflow Automation** — n8n automates cross-system processes (e.g., onboarding)
- 📊 **BI Dashboard** — Metabase visualizes data from all systems in real-time
- 🤖 **AI Assistant** — Ollama LLM answers questions using your company's actual data
- 🐳 **One-command Setup** — Docker Compose launches the entire ecosystem
- 🆓 **100% Free & Open Source** — Every component is open source

---

## 📋 Table of Contents

- [What is OpenDX-Lab?](#-what-is-opendx-lab)
- [Architecture (H-P-D-I)](#-architecture)
- [Quick Start](#-quick-start)
- [Demo Credentials](#-demo-credentials)
- [Technology Stack](#%EF%B8%8F-technology-stack)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Project Status](#-project-status)
- [Contributing](#-contributing)
- [License](#-license)
- [Team](#-team)

---

## 🏗 Architecture

### DX-OS Model — H-P-D-I Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      OpenDX-Lab (Docker Compose)                 │
│                                                                  │
│  ┌─ [H] Human ──────────────────────────────────────────────┐   │
│  │  Keycloak (SSO)  │  Rocket.Chat (Chat)  │  Wiki.js (Wiki)│   │
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
│  │  Ollama (Local LLM)  │  AI Chat (RAG)                    │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Demo Scenario: Employee Onboarding

```
Admin creates employee "Tran Minh Duc"
    │
    ├──→ [H] Keycloak auto-creates SSO account
    ├──→ [H] Rocket.Chat auto-sends welcome message
    ├──→ [H] Wiki.js auto-shares onboarding docs
    ├──→ [P] n8n workflow orchestrates all 3 steps above
    ├──→ [D] Metabase dashboard auto-updates metrics
    └──→ [I] AI Chat can answer "Who is the newest employee?"

1 action → 6 systems react → 0 manual messages
```

---

## 🚀 Quick Start

### System Requirements

```
✅ Docker Desktop          # https://www.docker.com/
✅ Docker Compose v2+      # Bundled with Docker Desktop
✅ 16GB RAM minimum        # Required for Ollama LLM
✅ 20GB free disk space    # For Docker images
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/thanhheo7749-ui/opendx-lab.git
cd opendx-lab

# 2. Copy the environment configuration
cp .env.example .env

# 3. Launch the entire ecosystem (one command!)
docker compose up -d

# 4. Wait for all services to become healthy (~2-3 min on first run)
docker compose ps
```

Done! 🎉

| Service | URL | Description |
|---------|-----|-------------|
| **Dashboard** | http://localhost:3000 | Main portal |
| **Keycloak** | http://localhost:8080 | SSO Admin console |
| **Rocket.Chat** | http://localhost:3100 | Internal chat |
| **Wiki.js** | http://localhost:3200 | Knowledge wiki |
| **n8n** | http://localhost:5678 | Workflow editor |
| **Metabase** | http://localhost:3300 | BI Dashboard |
| **Ollama** | http://localhost:11434 | LLM API |

---

## 🔑 Demo Credentials

| Account | Username | Password | Role |
|---------|----------|----------|------|
| Admin | `admin` | `admin123` | Administrator |
| HR Manager | `hr.mai` | `demo123` | HR Manager |
| IT Staff | `it.hung` | `demo123` | IT Staff |
| Employee | `nv.duc` | `demo123` | Employee |

---

## 🛠️ Technology Stack

| Space | Tool | Version | License | Role |
|-------|------|---------|---------|------|
| **[H]** SSO | Keycloak | 25.x | Apache-2.0 | Centralized authentication |
| **[H]** Chat | Rocket.Chat | 7.x | MIT | Internal messaging |
| **[H]** Wiki | Wiki.js | 2.x | AGPL-3.0 | Knowledge management |
| **[P]** Workflow | n8n | 1.x | Sustainable Use | Workflow automation |
| **[P]** Dashboard | Next.js | 15.x | MIT | Main web UI |
| **[D]** Database | PostgreSQL | 16 | PostgreSQL License | Relational database |
| **[D]** BI | Metabase | 0.50 | AGPL-3.0 | Data visualization |
| **[I]** LLM | Ollama | latest | MIT | Local AI |
| **Deploy** | Docker Compose | v2 | Apache-2.0 | Container orchestration |

---

## 📁 Project Structure

```
opendx-lab/
├── .github/                    # GitHub workflows, issue templates
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── workflows/
│       └── ci.yml
├── configs/                    # Per-service configuration
│   ├── keycloak/               # Keycloak realm import
│   ├── n8n/                    # Workflow templates
│   ├── metabase/               # Dashboard templates
│   └── postgres/               # Init scripts, seed data
├── dashboard/                  # Next.js web app (main codebase)
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── lib/                    # API clients, utilities
│   └── public/                 # Static assets
├── docs/                       # Project documentation
│   ├── architecture.md         # Detailed architecture
│   ├── deployment.md           # Deployment guide
│   ├── user-guide.md           # End-user guide
│   └── api.md                  # API documentation
├── scripts/                    # Utility scripts
│   ├── setup.sh                # Automated setup
│   └── seed-data.sh            # Sample data generation
├── .env.example                # Environment variables template
├── .gitignore
├── .dockerignore
├── CHANGELOG.md                # Version history
├── CODE_OF_CONDUCT.md          # Code of conduct
├── CONTRIBUTING.md             # Contribution guidelines
├── docker-compose.yml          # ★ Main file — one command runs all
├── LICENSE                     # GPL-3.0
├── README.md                   # This file
├── SECURITY.md                 # Security policy
└── THIRD_PARTY_LICENSES.md     # Third-party license disclosures
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | Detailed H-P-D-I architecture diagrams |
| [Deployment](docs/deployment.md) | Production deployment guide |
| [User Guide](docs/user-guide.md) | End-user guide |
| [API](docs/api.md) | API endpoints documentation |
| [Contributing](CONTRIBUTING.md) | How to contribute to the project |

---

## 📈 Project Status

### Roadmap

- [x] Design H-P-D-I architecture
- [x] Docker Compose for 8 services
- [ ] Keycloak SSO integration across all tools
- [ ] n8n workflow templates (onboarding, offboarding)
- [ ] Dashboard web app (Next.js)
- [ ] Metabase BI dashboard
- [ ] AI Chat with Ollama integration
- [ ] Complete documentation
- [ ] Demo video

---

## 🤝 Contributing

We welcome all contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

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

## 🏆 OLP Open Source Software Competition 2026

This project is developed for the **Open Source Software track** of the **Vietnam National Informatics Olympiad (OLP) 2026**, organized by [VFOSSA](https://vfossa.vn).

**Theme:** DX-OS Model — Digital Transformation Operating System

---

## 👥 Team

| Member | Role | GitHub |
|--------|------|--------|
| [Name 1] | Infrastructure + SSO | [@github1] |
| [Name 2] | Dashboard + BI | [@github2] |
| [Name 3] | AI Chat + Docs | [@github3] |

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for details.

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ for OLP Open Source 2026

</div>
