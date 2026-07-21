<!--
OpenDX-Lab - Changelog
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-06-23

### Added — Phase 4: Intelligence & Polish
- **AI Chat (RAG Pipeline)**: Natural language → SQL → Answer with streaming responses
  - Ollama local LLM (Qwen2.5:3b) — zero data leakage
  - Read-only SQL executor with safety validation
  - Vietnamese language support
  - Quick question suggestions
- **Activity Feed**: System-wide event logging (employee created, terminated, AI queries)
  - Paginated API (`GET /api/activities`)
  - Real-time activity timeline on Dashboard home page
- **Dashboard Home Page**: Welcome message, animated KPI cards, department breakdown, status ring, quick service access
- **Setup Automation**: `scripts/setup.sh` and `scripts/reset.sh` for one-command deployment
- **Documentation**: Complete deployment guide, user guide, demo script for OLP 2026

### Added — Phase 3: Automation & Data
- **n8n Workflows**: Employee onboarding (auto-create Keycloak user + Mattermost welcome) and offboarding (disable user + notify)
- **Mattermost Webhook**: Automated notifications via DX-OS Bot
- **Metabase BI**: Embedded analytics dashboards (headcount, recent hires, status distribution)
- **Metabase Embedding**: Signed JWT embedding in Dashboard Analytics page

### Added — Phase 2: Dashboard Core
- **Next.js Dashboard**: Full-featured portal with Tailwind CSS
- **Employee Management**: CRUD with search, filter, department assignment
- **Service Health Monitoring**: Real-time UP/DOWN status for all 7 services
- **Workflow Management**: View and monitor n8n workflows

### Added — Phase 1: Infrastructure & SSO
- **Keycloak SSO**: Centralized authentication for Dashboard, Mattermost, Wiki.js
- **Docker Compose**: 8-service stack (PostgreSQL, Keycloak, Mattermost, Wiki.js, n8n, Metabase, Ollama, Dashboard)
- **Multi-database setup**: Single PostgreSQL instance serving 6 databases
- **GPL-3.0 License** and standard GitHub community files

---

### Added
- Project skeleton initialization
- `docker-compose.yml` integrating 8 services: Keycloak (SSO), Rocket.Chat, Wiki.js, n8n, PostgreSQL, Metabase, Ollama, and Next.js Dashboard
- Multi-database initialization script `configs/postgres/init-multiple-databases.sh` for PostgreSQL
- Standard GitHub files: `LICENSE` (GPL-3.0), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `.env.example`
- Git and Docker configuration: `.gitignore`, `.dockerignore`
- Third-party license disclosure: `THIRD_PARTY_LICENSES.md`
- GitHub issue templates: `bug_report.yml`, `feature_request.yml`
- Architecture documentation: `docs/architecture.md`

---

## [0.1.0] - 2026-06-16

### Added
- Initial repository setup with `README.md`
- Project context document `PROJECT_CONTEXT.md`

[1.0.0-alpha]: https://github.com/thanhheo7749-ui/opendx-lab/compare/v0.1.0...v1.0.0-alpha
[0.1.0]: https://github.com/thanhheo7749-ui/opendx-lab/releases/tag/v0.1.0
