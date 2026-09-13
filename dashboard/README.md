<!--
ShopWise — Dashboard README
Copyright (C) 2026 ShopWise Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# ShopWise Dashboard

The Dashboard is the main web application for ShopWise. It provides the decision support interface: Decision Feed, Decision Advisor, Supplier Matcher, What-if Simulator, Decision Journal, Knowledge Graph, BizScan, AI Chat, and Metabase BI integration.

## Requirements

- Node.js 20 LTS or newer
- npm 10 or newer
- PostgreSQL access through the Docker Compose stack
- Keycloak realm configuration from `../configs/keycloak/`

For the complete stack, run the root `docker-compose.yml`. For dashboard-only development, use the steps below.

## Environment

Create the root environment file first:

```bash
cd ..
cp .env.example .env
```

Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Prisma) |
| `NEXTAUTH_URL` | Dashboard URL, usually `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth.js secret |
| `KEYCLOAK_CLIENT_ID` | OIDC client ID |
| `KEYCLOAK_CLIENT_SECRET` | OIDC client secret |
| `KEYCLOAK_ISSUER` | Browser-facing Keycloak issuer URL |
| `KEYCLOAK_ISSUER_INTERNAL` | Docker-network Keycloak issuer URL |

## Install Dependencies

```bash
npm ci
```

## Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed sample business data (52 products, 500 customers, 10K+ orders, 6 suppliers)
npx tsx prisma/seed-bizscan.ts
```

## Development Server

```bash
npm run dev
```

Open http://localhost:3000.

## Production Build

```bash
npm ci
npx prisma generate
npm run build
npm run start
```

## Key Pages

| Path | Page | Purpose |
|---|---|---|
| `/` | Homepage | Decision Feed + KPI cards + Revenue chart |
| `/decision` | Decision Advisor | Inventory / Pricing / Ad spend analysis |
| `/simulator` | What-if Simulator | Test scenarios before committing |
| `/supplier` | Supplier Matcher | Multi-criteria NCC comparison |
| `/journal` | Decision Journal | Track decisions & compare outcomes |
| `/bizscan` | BizScan | Deep anomaly detection |
| `/knowledge-graph` | Knowledge Graph | Product-Supplier-Customer relationships |
| `/analytics` | Metabase BI | Embedded BI dashboards |
| `/ai-chat` | AI Chat | Natural language queries (Ollama) |

## API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/decision/feed` | GET | Auto-detect issues (inventory/pricing/ads) |
| `/api/decision` | GET/POST | Decision advisor analysis |
| `/api/decision/log` | GET/POST | Record and retrieve decisions |
| `/api/decision/supplier` | GET | Supplier comparison & scoring |
| `/api/decision/feedback` | GET | Decision outcome tracking |
| `/api/bizscan/*` | GET/POST | BizScan scan & findings |
| `/api/simulator/*` | POST | What-if simulation |
| `/api/dashboard/pulse` | GET | KPI summary |

## Database Models

See `prisma/schema.prisma` for the full schema. Key models:

- **SbProduct** — Product catalog with cost/sell prices, categories
- **SbCustomer** — Customer profiles with tiers (Regular/VIP/Super VIP)
- **SbOrder / SbOrderItem** — Sales transactions
- **SbInventory** — Stock levels, reorder points, lead times
- **SbAdCampaign / SbAdDailyStat** — Ad campaign performance
- **SbMarketTrend** — Market intelligence data
- **SbDecision** — Decision journal (predicted impact, actual impact, feedback due)
- **SbSupplier / SbSupplierProduct** — Supplier catalog with pricing & location
- **KgNode / KgEdge** — Knowledge graph

## License

Licensed under GPL-3.0-or-later. See [../LICENSE](../LICENSE).
