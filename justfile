# ==============================================================================
# OpenDX-Lab Task Runner (justfile)
# SPDX-License-Identifier: GPL-3.0-or-later
# ==============================================================================

# Configure native PowerShell for Windows execution
set windows-shell := ["powershell.exe", "-Command"]

# Detect OS to select correct file copy command
copy_env := if os() == "windows" { "if (!(Test-Path .env)) { Copy-Item .env.example .env }" } else { "cp -n .env.example .env || true" }

# Default: List all available commands
default:
    @just --list

# Initialize config, spin up Docker services and pull AI models
setup:
    @echo "⚙️  Setting up OpenDX-Lab environment..."
    @{{ copy_env }}
    @echo "🐳 Starting Docker services (Keycloak, Mattermost, Wiki.js, n8n, Metabase, Ollama, Postgres, Dashboard)..."
    docker compose up -d
    @echo "🤖 Pulling Qwen 2.5 3B LLM model for AI Chat..."
    docker exec opendx-ollama ollama pull qwen2.5:3b
    @echo "🎉 OpenDX-Lab is ready! Access Dashboard at http://localhost:3000"

# Start stopped containers
start:
    @echo "🐳 Starting OpenDX-Lab services..."
    docker compose start

# Taint and stop services without deleting database volumes
stop:
    @echo "🐳 Stopping OpenDX-Lab services..."
    docker compose stop

# Restart Next.js Dashboard core application container
restart-dash:
    @echo "🔄 Restarting OpenDX Dashboard..."
    docker compose restart dashboard

# View live container logs (e.g., 'just logs' or 'just logs dashboard')
logs service="":
    docker compose logs -f {{ service }}

# Full rebuild: teardown all volumes, recreate containers, and pull LLM model (Full Reset)
reset:
    @echo "⚠️  WARNING: This will destroy all current databases and recreate containers!"
    docker compose down -v
    docker compose up -d --build
    @echo "🤖 Re-pulling Qwen 2.5 3B LLM model..."
    docker exec opendx-ollama ollama pull qwen2.5:3b
    @echo "✨ Reset complete!"

# Check status of running containers
status:
    docker compose ps
