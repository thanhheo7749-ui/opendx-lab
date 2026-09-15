#!/bin/bash
# ==============================================================================
# OpenDX-Lab - Automated Setup Script
# Copies .env.example → .env, starts all containers, pulls Ollama model
#
# Copyright (C) 2026 OpenDX-Lab Contributors
# SPDX-License-Identifier: GPL-3.0-or-later
# ==============================================================================

# Platform: Linux/macOS (requires: bash, docker, curl, openssl)
# Windows users: Use WSL2 or Git Bash to run this script.
# Alternative: Run 'just setup' from the project root (cross-platform via justfile).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║             OpenDX-Lab — Automated Setup                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Environment file ──────────────────────────────────────
if [ ! -f .env ]; then
  echo "📋 Creating .env with auto-generated secrets ..."
  cp .env.example .env

  # Auto-generate secure random passwords
  if command -v openssl &> /dev/null; then
    GENERATED_PG_PASS=$(openssl rand -hex 16)
    GENERATED_KC_PASS=$(openssl rand -hex 16)
    GENERATED_NEXTAUTH_SECRET=$(openssl rand -base64 32)
    GENERATED_AP_ENCRYPTION=$(openssl rand -hex 16)
    GENERATED_AP_JWT=$(openssl rand -hex 32)

    # Replace default passwords with generated ones
    sed -i "s/secure_postgres_pass_123/$GENERATED_PG_PASS/g" .env
    sed -i "s/admin123/$GENERATED_KC_PASS/g" .env
    sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$GENERATED_NEXTAUTH_SECRET/" .env
    sed -i "s/AP_ENCRYPTION_KEY=.*/AP_ENCRYPTION_KEY=$GENERATED_AP_ENCRYPTION/" .env
    sed -i "s/AP_JWT_SECRET=.*/AP_JWT_SECRET=$GENERATED_AP_JWT/" .env

    echo "   ✅ .env created with auto-generated secure passwords."
    echo "   🔐 PostgreSQL password: ${GENERATED_PG_PASS:0:4}...*** (saved in .env)"
  else
    echo "   ⚠️  openssl not found. Using default passwords from .env.example."
    echo "   ⚠️  IMPORTANT: Change all passwords in .env before production use!"
  fi
else
  echo "📋 .env already exists, skipping copy."
fi

echo ""

# ── Step 2: Start containers ──────────────────────────────────────
echo "🐳 Starting Docker Compose stack ..."
docker compose up -d

echo ""

# ── Step 3: Wait for PostgreSQL healthy ───────────────────────────
echo "⏳ Waiting for PostgreSQL to become healthy ..."
RETRIES=30
until docker inspect --format='{{.State.Health.Status}}' opendx-postgres 2>/dev/null | grep -q "healthy"; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    echo "   ❌ PostgreSQL did not become healthy in time."
    exit 1
  fi
  sleep 2
done
echo "   ✅ PostgreSQL is healthy."

echo ""

# ── Step 4: Wait for Ollama to be reachable ───────────────────────
echo "⏳ Waiting for Ollama API ..."
RETRIES=30
until docker exec opendx-ollama curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    echo "   ❌ Ollama did not start in time."
    exit 1
  fi
  sleep 2
done
echo "   ✅ Ollama is running."

echo ""

# ── Step 5: Pull default LLM model ───────────────────────────────
MODEL="${OLLAMA_DEFAULT_MODEL:-qwen2.5:3b}"
echo "🤖 Pulling LLM model: $MODEL ..."
docker exec opendx-ollama ollama pull "$MODEL"
echo "   ✅ Model $MODEL ready."

echo ""

# ── Step 6: Wait for Dashboard ────────────────────────────────────
echo "⏳ Waiting for Dashboard (Next.js) ..."
RETRIES=60
until curl -sf http://localhost:3000 > /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    echo "   ⚠️  Dashboard did not respond in time — it may still be compiling."
    break
  fi
  sleep 3
done
if [ $RETRIES -gt 0 ]; then
  echo "   ✅ Dashboard is running."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ OpenDX-Lab setup complete!"
echo ""
echo "  Dashboard :  http://localhost:3000"
echo "  Keycloak  :  http://localhost:8080"
echo "  Mattermost:  http://localhost:3100"
echo "  Wiki.js   :  http://localhost:3200"
echo "  n8n       :  http://localhost:5678"
echo "  Metabase  :  http://localhost:3300"
echo "  Ollama    :  http://localhost:11434"
echo "═══════════════════════════════════════════════════════════════"
