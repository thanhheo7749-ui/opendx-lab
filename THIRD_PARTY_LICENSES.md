<!--
OpenDX-Lab - Third-Party Licenses & Dependencies

Copyright (C) 2026 OpenDX-Lab Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
-->

# 📦 Third-Party Licenses & Bundled Dependencies

This document lists all open-source software used and integrated (bundled) in the **OpenDX-Lab** ecosystem, along with their respective licenses.

> **Note:** OpenDX-Lab is a **distribution** that integrates existing open-source software via Docker Compose. We **do not modify the source code** of any software listed below. All components are used unmodified from their official Docker images.

---

## 1. Integrated Open-Source Components

| H-P-D-I Space | Software | Version | License (OSI-approved) | Homepage | Purpose |
|---|---|---|---|---|---|
| **[H] Human** | Keycloak | 25.0 | Apache License 2.0 | https://www.keycloak.org | Identity & Access Management (SSO) |
| **[H] Human** | Mattermost | 10.2 | MIT License | https://mattermost.com | Internal team messaging |
| **[H] Human** | Wiki.js | 2.x | AGPL-3.0 | https://js.wiki | Knowledge management & documentation |
| **[P] Process** | n8n | 1.45.1 | Sustainable Use License (*) | https://n8n.io | Workflow automation engine |
| **[P] Process** | Next.js | 15.x | MIT License | https://nextjs.org | Dashboard web application framework |
| **[D] Data** | PostgreSQL | 16 | PostgreSQL License (OSI) | https://www.postgresql.org | Shared relational database for all services |
| **[D] Data** | Metabase | 0.50.3 | AGPL-3.0 | https://www.metabase.com | Business Intelligence & data visualization |
| **[I] Intelligence** | Ollama | latest | MIT License | https://ollama.ai | Local Large Language Model (LLM) server |
| **Deploy** | Docker Compose | v2 | Apache License 2.0 | https://docs.docker.com/compose | Container orchestration |
| **Deploy** | Node.js | 20 LTS | MIT License | https://nodejs.org | Runtime for Next.js Dashboard |

> (*) **Note on n8n license:** n8n uses the Sustainable Use License (not OSI-approved). However, n8n allows free use for non-commercial and educational purposes. In this project, n8n is used unmodified via its official Docker image.

---

## 2. JavaScript / Node.js Libraries (Dashboard)

Dashboard dependencies will be listed in `dashboard/package.json` once development begins. All packages are open-source npm packages with MIT or equivalent licenses.

---

## 3. License Compliance Statement

- **No source code modifications** have been made to any third-party software. All components are used unmodified from official Docker images.
- **No re-bundling** of third-party source code in this repository. We pull Docker images directly from official registries at `docker compose up` time.
- **No license incompatibilities**: The OpenDX-Lab project itself uses GPL-3.0, which is compatible with all OSI-approved licenses listed above.
- **Copyright preserved**: All copyright notices and licenses of third-party software are maintained within their original Docker images.

---

## 4. References

- [OSI Approved Licenses](https://opensource.org/licenses)
- [SPDX License List](https://spdx.org/licenses/)
- [Choose a License](https://choosealicense.com/)
