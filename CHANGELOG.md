<!--
OpenDX-Lab - Changelog
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-alpha] - 2026-06-17

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
