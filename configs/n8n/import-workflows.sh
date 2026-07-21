#!/bin/sh
# ==============================================================================
# OpenDX-Lab - n8n Workflow Import Script
# SPDX-License-Identifier: GPL-3.0-or-later
# ==============================================================================
# Import JSON workflow files into n8n via CLI
# Usage: docker exec opendx-n8n sh /home/node/.n8n/configs/import-workflows.sh

WORKFLOW_DIR="/home/node/.n8n/configs/workflows"

if [ ! -d "$WORKFLOW_DIR" ]; then
  echo "⚠️  Workflow directory not found: $WORKFLOW_DIR"
  exit 1
fi

echo "📦 Importing n8n workflows from $WORKFLOW_DIR ..."
n8n import:workflow --separate --input="$WORKFLOW_DIR"

echo "⚡ Activating workflows in PostgreSQL database..."
node -e "
const pg = require('/usr/local/lib/node_modules/n8n/node_modules/pg');
const client = new pg.Client({
  host: process.env.DB_POSTGRESDB_HOST || 'postgres',
  port: parseInt(process.env.DB_POSTGRESDB_PORT || '5432', 10),
  database: process.env.DB_POSTGRESDB_DATABASE || 'n8n_db',
  user: process.env.DB_POSTGRESDB_USER || 'opendx_admin',
  password: process.env.DB_POSTGRESDB_PASSWORD || 'secure_postgres_pass_123'
});
client.connect()
  .then(() => client.query('UPDATE workflow_entity SET active = true;'))
  .then(res => {
    console.log('✅ Successfully activated workflows in DB:', res.rowCount);
    return client.end();
  })
  .catch(err => {
    console.error('❌ Error activating workflows:', err);
    process.exit(1);
  });
"

echo "✅ Workflow import and activation complete."
