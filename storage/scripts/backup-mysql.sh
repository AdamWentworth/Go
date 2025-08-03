#!/usr/bin/env bash
set -euo pipefail
DOCKER="${DOCKER:-$(command -v docker)}"
CONTAINER="mysql_storage"
DATE="$(date +%F)"
TARGET="/backups/user_pokemon_backup_${DATE}.sql"
TMP="${TARGET}.tmp"

"${DOCKER}" exec "${CONTAINER}" bash -lc \
  'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -h 127.0.0.1 -P 3306 \
    --single-transaction --quick --no-tablespaces \
    "$MYSQL_DATABASE" > "'"${TMP}"'"'
"${DOCKER}" exec "${CONTAINER}" bash -lc 'mv "'"${TMP}"'" "'"${TARGET}"'"'

# Apply the same retention policy as backup.go
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
"${REPO_ROOT}/scripts/retention.sh" || true

# Show result on host
ls -lh "./backups/$(basename "$TARGET")"
