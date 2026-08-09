<!--
OpenDX-Lab - Build From Source Guide
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# Build From Source

This guide explains how to install, build, run, and verify OpenDX-Lab from source using open-source tools.

## Supported Build Paths

OpenDX-Lab supports two source-based workflows:

1. **Full ecosystem**: run all services with Docker Compose from the repository root.
2. **Dashboard only**: install and build the Next.js Dashboard from `dashboard/`.

The full ecosystem path is recommended for demonstrations because it starts the SSO, chat, wiki, automation, BI, database, local LLM, and dashboard services together.

## Requirements

| Tool | Minimum Version | Purpose |
|---|---:|---|
| Git | 2.x | Clone and inspect source history |
| Docker Desktop / Docker Engine | Current stable | Run service containers |
| Docker Compose | v2 | Orchestrate the ecosystem stack |
| Node.js | 20 LTS | Build the Dashboard |
| npm | 10 | Install Dashboard dependencies |

No proprietary build tool is required.

## Clone the Source

```bash
git clone https://github.com/thanhheo7749-ui/opendx-lab.git
cd opendx-lab
```

## Configure Environment

```bash
cp .env.example .env
```

Review `.env` before running the stack. The default values are intended for local development and demonstration.

## Build and Run the Full Ecosystem

```bash
docker compose up -d
```

Docker Compose reads `docker-compose.yml`, pulls the required open-source service images, builds or runs the Dashboard service, and connects all services on the project Docker network.

Check service status:

```bash
docker compose ps
```

Access the main services:

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| Keycloak | http://localhost:8080 |
| Mattermost | http://localhost:3100 |
| Wiki.js | http://localhost:3200 |
| Activepieces | http://localhost:5678 |
| Metabase | http://localhost:3300 |
| Ollama | http://localhost:11434 |

## Build the Dashboard Only

Use this path when working on the Dashboard code without starting every service.

```bash
cd dashboard
npm ci
npx prisma generate
npm run build
```

Run the production build:

```bash
npm run start
```

Run the development server:

```bash
npm run dev
```

## Verification Commands

From `dashboard/`:

```bash
npm run lint
npm run build
```

These are the same checks used by the Dashboard CI workflow.

From the repository root:

```bash
docker compose ps
```

Use the service URLs above to confirm the stack is reachable.

## Dependency and Bundling Notes

- Docker images are pulled from their official registries; OpenDX-Lab does not modify third-party service source code.
- Dashboard npm dependencies are declared in `dashboard/package.json` and locked in `dashboard/package-lock.json`.
- `node_modules/` is a generated local dependency directory and must not be committed or included in source releases.
- Third-party license details are documented in `THIRD_PARTY_LICENSES.md`.

## Troubleshooting

### Port already in use

Stop the process using the conflicting port or change the corresponding port mapping in `.env` / `docker-compose.yml`.

### Dashboard cannot connect to Keycloak

Check that Keycloak is healthy and that these variables are set correctly:

- `KEYCLOAK_ISSUER`
- `KEYCLOAK_ISSUER_INTERNAL`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`

### Prisma client missing

Run this from `dashboard/`:

```bash
npx prisma generate
```

### Clean rebuild

```bash
docker compose down
npm --prefix dashboard ci
npm --prefix dashboard run build
docker compose up -d
```

For destructive local resets, review `scripts/reset.sh` before running it.
