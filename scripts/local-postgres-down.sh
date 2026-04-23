#!/usr/bin/env bash

set -euo pipefail

PG_BIN="/Library/PostgreSQL/17/bin"
DATA_DIR="${JOURNALLY_PGDATA:-/tmp/journally-pgdata}"

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
