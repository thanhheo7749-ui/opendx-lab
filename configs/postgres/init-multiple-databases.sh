#!/bin/bash

# ==============================================================================
# OpenDX-Lab - PostgreSQL Multi-Database Initialization Script
#
# Copyright (C) 2026 OpenDX-Lab Contributors
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.
# ==============================================================================

set -e
set -u

function create_user_and_database() {
	local database=$1
	echo "  Creating database '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	    CREATE DATABASE $database;
	    GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
}

echo "PostgreSQL initialization script running..."

if [ -n "$POSTGRES_DB_KEYCLOAK" ]; then
	create_user_and_database "$POSTGRES_DB_KEYCLOAK"
fi

if [ -n "$POSTGRES_DB_WIKIJS" ]; then
	create_user_and_database "$POSTGRES_DB_WIKIJS"
fi

if [ -n "$POSTGRES_DB_N8N" ]; then
	create_user_and_database "$POSTGRES_DB_N8N"
fi

if [ -n "$POSTGRES_DB_METABASE" ]; then
	create_user_and_database "$POSTGRES_DB_METABASE"
fi

if [ -n "$POSTGRES_DB_DASHBOARD" ]; then
	create_user_and_database "$POSTGRES_DB_DASHBOARD"
fi

echo "PostgreSQL multi-database initialization completed successfully!"
