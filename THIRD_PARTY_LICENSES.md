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
| **[P] Process** | Activepieces | latest | MIT License | https://www.activepieces.com | Workflow automation engine |
| **[P] Process** | Next.js | 15.x | MIT License | https://nextjs.org | Dashboard web application framework |
| **[D] Data** | PostgreSQL | 16 | PostgreSQL License (OSI) | https://www.postgresql.org | Shared relational database for all services |
| **[D] Data** | Metabase | 0.50.3 | AGPL-3.0 | https://www.metabase.com | Business Intelligence & data visualization |
| **[I] Intelligence** | Ollama | latest | MIT License | https://ollama.ai | Local Large Language Model (LLM) server |
| **Deploy** | Docker Compose | v2 | Apache License 2.0 | https://docs.docker.com/compose | Container orchestration |
| **Deploy** | Node.js | 20 LTS | MIT License | https://nodejs.org | Runtime for Next.js Dashboard |

> All components use OSI-approved open-source licenses (MIT, Apache-2.0, AGPL-3.0, PostgreSQL License).

---

## 2. JavaScript / Node.js Libraries (Dashboard)

The Dashboard direct dependencies are declared in `dashboard/package.json` and locked in `dashboard/package-lock.json` for reproducible installation. Generated dependency directories such as `dashboard/node_modules/` are local build artifacts and must not be committed or included in source releases.

| Package | Version Range | License | Purpose |
|---|---|---|---|
| `next` | 16.2.9 | MIT | Dashboard web framework |
| `react` / `react-dom` | 19.2.4 | MIT | User interface runtime |
| `next-auth` | ^5.0.0-beta.25 | ISC | OIDC authentication integration |
| `@prisma/client` / `prisma` | ^6.9.0 | Apache-2.0 | Database ORM and generated client |
| `@base-ui/react` | ^1.5.0 | MIT | Accessible UI primitives |
| `shadcn` | ^4.11.0 | MIT | UI component tooling |
| `tailwindcss` / `@tailwindcss/postcss` | ^4 | MIT | Styling system |
| `class-variance-authority` | ^0.7.1 | Apache-2.0 | Component variant composition |
| `clsx` | ^2.1.1 | MIT | Conditional class composition |
| `tailwind-merge` | ^3.6.0 | MIT | Tailwind class conflict resolution |
| `tw-animate-css` | ^1.4.0 | MIT | Animation utility classes |
| `lucide-react` | ^1.20.0 | ISC | Icon set |
| `jsonwebtoken` / `@types/jsonwebtoken` | ^9.x | MIT | JWT handling and TypeScript types |
| `typescript` / `ts-node` | ^5 / ^10.9.2 | Apache-2.0 / MIT | TypeScript build tooling |
| `eslint` / `eslint-config-next` | ^9 / 16.2.9 | MIT | Static analysis and linting |
| `@types/node`, `@types/react`, `@types/react-dom` | ^20 / ^19 | MIT | TypeScript type definitions |

License names above reflect the commonly published licenses for these packages. The lockfile remains the source of truth for exact resolved versions used by a release.

---

## 3. License Compliance Statement

- **No source code modifications** have been made to any third-party service. Integrated services are used unmodified from their official Docker images.
- **No re-bundling of third-party source code** is required for normal source distribution. Docker images are pulled from their official registries at `docker compose up` time, and npm dependencies are restored from the public npm registry with `npm ci`.
- **Generated dependency folders are excluded**: `node_modules/` is a local install artifact and should not be committed or packaged as project source.
- **No license incompatibilities are expected**: The OpenDX-Lab project itself uses GPL-3.0-or-later, and the listed components use OSI-approved licenses.
- **Copyright preserved**: Copyright notices and licenses of third-party software remain with their original projects, packages, and Docker images.

---

## 4. References

- [OSI Approved Licenses](https://opensource.org/licenses)
- [SPDX License List](https://spdx.org/licenses/)
- [Choose a License](https://choosealicense.com/)
