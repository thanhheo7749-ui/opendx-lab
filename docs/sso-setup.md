<!--
OpenDX-Lab - SSO Setup Guide
Copyright (C) 2026 OpenDX-Lab Contributors
SPDX-License-Identifier: GPL-3.0-or-later
-->

# 🔐 SSO Setup Guide — Keycloak Integration

This guide explains how to configure Single Sign-On (SSO) for all OpenDX-Lab services using Keycloak as the Identity Provider.

---

## 1. Overview

All services authenticate through a single Keycloak realm `opendx`:

```
                    Keycloak (realm: opendx)
                    ┌──────────────────────┐
                    │                      │
          ┌────────┤  opendx-dashboard     │
          │        │  mattermost-sso       │
          │        │  wikijs-sso           │
          │        │  n8n-sso              │
          │        │                      │
          │        │  Roles:              │
          │        │  - admin             │
          │        │  - manager           │
          │        │  - employee          │
          │        └──────────────────────┘
          │
     ┌────┴────┬──────────┬──────────┐
     │         │          │          │
Dashboard  Mattermost  Wiki.js     n8n
```

---

## 2. Keycloak Realm Auto-Import

The `opendx` realm is **automatically imported** on first boot via the `--import-realm` flag.

- Realm export file: `configs/keycloak/opendx-realm.json`
- Mounted to: `/opt/keycloak/data/import/`
- On first startup, Keycloak reads and imports the realm

**No manual configuration needed for basic setup.**

---

## 3. OIDC Client Configuration

### 3.1 Dashboard (opendx-dashboard)

| Setting | Value |
|---------|-------|
| Client ID | `opendx-dashboard` |
| Client Type | OpenID Connect |
| Access Type | Confidential |
| Valid Redirect URIs | `http://localhost:3000/*` |
| Web Origins | `http://localhost:3000` |

Used by: NextAuth.js in the Dashboard app.

### 3.2 Mattermost (mattermost-sso)

| Setting | Value |
|---------|-------|
| Client ID | `mattermost-sso` |
| Client Type | OpenID Connect |
| Access Type | Confidential |
| Valid Redirect URIs | `http://localhost:3100/*` |

Mattermost configuration:
- System Console → Authentication → OpenID Connect
- Discovery URL: `http://keycloak:8080/realms/opendx/.well-known/openid-configuration`

### 3.3 Wiki.js (wikijs-sso)

| Setting | Value |
|---------|-------|
| Client ID | `wikijs-sso` |
| Client Type | OpenID Connect |
| Access Type | Confidential |
| Valid Redirect URIs | `http://localhost:3200/*` |

Wiki.js configuration:
- Admin → Authentication → Add Strategy → OpenID Connect
- Issuer URL: `http://keycloak:8080/realms/opendx`

### 3.4 n8n (n8n-sso)

| Setting | Value |
|---------|-------|
| Client ID | `n8n-sso` |
| Client Type | OpenID Connect |
| Access Type | Confidential |
| Valid Redirect URIs | `http://localhost:5678/*` |

n8n configuration via environment variables in docker-compose.yml.

---

## 4. Roles & Demo Users

### Roles

| Role | Description | Access Level |
|------|-------------|-------------|
| `admin` | Full system access | All features + Service Control |
| `manager` | Department management | Employee CRUD + Analytics |
| `employee` | Basic access | AI Chat + view-only dashboards |

### Demo Users

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | admin |
| `hr.mai` | `demo123` | manager |
| `nv.duc` | `demo123` | employee |

---

## 5. Updating the Realm Export

If you modify the Keycloak configuration (add clients, roles, or users):

1. Access Keycloak Admin: http://localhost:8080
2. Login with admin credentials
3. Make your changes in the `opendx` realm
4. Export: Realm Settings → Action → Partial Export
5. Save to `configs/keycloak/opendx-realm.json`
6. Commit the updated JSON file

---

## 6. Troubleshooting

### "Invalid redirect URI" error
- Check that the Valid Redirect URIs in Keycloak match the service URL exactly
- Include the `/*` wildcard at the end

### SSO not working between services
- Ensure all services are on the same Docker network (`opendx-net`)
- Use `keycloak:8080` for internal service-to-service communication
- Use `localhost:8080` for browser redirects

### Token expired
- Default access token lifetime: 5 minutes
- Refresh token lifetime: 30 minutes
- Adjust in Keycloak: Realm Settings → Tokens
