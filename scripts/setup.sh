#!/bin/bash
# ==============================================================================
# OpenDX-Lab - Automated Setup Script
# Copies .env.example → .env, starts all containers, pulls Ollama model
#
# Copyright (C) 2026 OpenDX-Lab Contributors
# SPDX-License-Identifier: GPL-3.0-or-later
# ==============================================================================

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
  echo "📋 Copying .env.example → .env ..."
  cp .env.example .env
  echo "   ✅ .env created. Review and adjust secrets before production use."
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
