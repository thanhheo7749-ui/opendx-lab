#!/bin/bash
# ==============================================================================
# OpenDX-Lab - Reset Script
# Stops all containers, removes volumes, then re-runs setup
#
# Copyright (C) 2026 OpenDX-Lab Contributors
# SPDX-License-Identifier: GPL-3.0-or-later
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║             OpenDX-Lab — Full Reset                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  This will destroy ALL data (databases, volumes, config)."
echo ""
read -p "Are you sure? (y/N): " confirm

if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""

# ── Step 1: Stop and remove everything ────────────────────────────
echo "🛑 Stopping containers and removing volumes ..."
docker compose down -v --remove-orphans 2>/dev/null || true

echo ""

# ── Step 2: Remove .env so setup.sh recreates it ─────────────────
if [ -f .env ]; then
  echo "🗑️  Removing .env ..."
  rm .env
fi

echo ""

# ── Step 3: Re-run setup ─────────────────────────────────────────
echo "🔄 Running setup.sh ..."
bash "$SCRIPT_DIR/setup.sh"
