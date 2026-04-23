#!/usr/bin/env bash

set -euo pipefail

PG_BIN="/Library/PostgreSQL/17/bin"
DATA_DIR="${JOURNALLY_PGDATA:-/tmp/journally-pgdata}"
SOCKET_DIR="${JOURNALLY_PGSOCKET:-/tmp/journally-pgsocket}"
LOG_FILE="${JOURNALLY_PGLOG:-/tmp/journally-postgres.log}"
PG_PORT="${JOURNALLY_PGPORT:-5433}"
PG_USER="${JOURNALLY_PGUSER:-postgres}"
PG_DB="${JOURNALLY_PGDATABASE:-journally_dev}"

mkdir -p "$DATA_DIR" "$SOCKET_DIR"

if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
  echo "Initializing local PostgreSQL cluster in $DATA_DIR"
  "$PG_BIN/initdb" -D "$DATA_DIR" -U "$PG_USER" -A trust
fi

CONF_FILE="$DATA_DIR/postgresql.conf"

if ! grep -q "journally local config" "$CONF_FILE"; then
  cat >>"$CONF_FILE" <<EOF

# journally local config
listen_addresses = '127.0.0.1'
port = $PG_PORT
unix_socket_directories = '$SOCKET_DIR'
EOF
fi

if "$PG_BIN/pg_ctl" -D "$DATA_DIR" status >/dev/null 2>&1; then
  echo "PostgreSQL already running on port $PG_PORT"
else
  echo "Starting local PostgreSQL on port $PG_PORT"
  "$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$LOG_FILE" start
fi

if ! "$PG_BIN/psql" -h "$SOCKET_DIR" -p "$PG_PORT" -U "$PG_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$PG_DB'" | grep -q 1; then
  echo "Creating database $PG_DB"
  "$PG_BIN/createdb" -h "$SOCKET_DIR" -p "$PG_PORT" -U "$PG_USER" "$PG_DB"
fi

echo "Local PostgreSQL ready"
echo "  user: $PG_USER"
echo "  db:   $PG_DB"
echo "  port: $PG_PORT"
echo "  socket: $SOCKET_DIR"
