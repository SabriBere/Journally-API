#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PG_BIN="/Library/PostgreSQL/17/bin"
DATA_DIR="${JOURNALLY_PGDATA:-$PROJECT_DIR/.local/postgres/data}"

if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
  echo "No local PostgreSQL cluster found in $DATA_DIR"
  exit 0
fi

if "$PG_BIN/pg_ctl" -D "$DATA_DIR" status >/dev/null 2>&1; then
  "$PG_BIN/pg_ctl" -D "$DATA_DIR" stop
  echo "Local PostgreSQL stopped"
else
  echo "Local PostgreSQL is not running"
fi
