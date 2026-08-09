<!--
OpenDX-Lab - Dashboard README
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# OpenDX-Lab Dashboard

The Dashboard is the main web portal for OpenDX-Lab. It provides the user-facing interface for service access, employee management, workflow monitoring, analytics, and AI-assisted queries across the DX ecosystem.

## Requirements

- Node.js 20 LTS or newer
- npm 10 or newer
- PostgreSQL access through the OpenDX-Lab Docker Compose stack
- Keycloak realm configuration from `../configs/keycloak/`

For the complete ecosystem, run the repository root `docker-compose.yml`. For dashboard-only development, use the steps below.

## Environment

Create the root environment file first:

```bash
cd ..
cp .env.example .env
```

The Dashboard expects these variables to be available when running inside Docker Compose or local development:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `NEXTAUTH_URL` | Public Dashboard URL, usually `http://localhost:3000` locally |
| `NEXTAUTH_SECRET` | Secret used by NextAuth.js |
| `KEYCLOAK_CLIENT_ID` | OIDC client ID for the Dashboard |
| `KEYCLOAK_CLIENT_SECRET` | OIDC client secret |
| `KEYCLOAK_ISSUER` | Browser-facing Keycloak issuer URL |
| `KEYCLOAK_ISSUER_INTERNAL` | Docker-network Keycloak issuer URL |

## Install Dependencies

```bash
npm ci
```

Use `npm ci` for reproducible installs from `package-lock.json`. Do not commit `node_modules/`.

## Generate Prisma Client

```bash
npx prisma generate
```

If seed data is needed for local testing:

```bash
npx prisma db seed
```

## Development Server

```bash
npm run dev
```

Open http://localhost:3000 after the server starts.

## Production Build From Source

```bash
npm ci
npx prisma generate
npm run build
npm run start
```

## Quality Checks

```bash
npm run lint
npm run build
```

The CI workflow runs the same lint and build checks for Dashboard changes.

## Relationship to the Full Stack

In the full OpenDX-Lab stack, the Dashboard connects to:

- Keycloak for Single Sign-On through OpenID Connect;
- PostgreSQL through Prisma;
- Mattermost, Wiki.js, Activepieces, Metabase, and Ollama through service links and API integrations.

See the root [README](../README.md), [architecture guide](../docs/architecture.md), and [SSO setup guide](../docs/sso-setup.md) for system-level documentation.

## License

The Dashboard is part of OpenDX-Lab and is licensed under GPL-3.0-or-later. See [../LICENSE](../LICENSE).
