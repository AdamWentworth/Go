#!/usr/bin/env bash
set -euo pipefail

deploy_root="${1:-/srv/pokegonexus}"
pokemon_dir="${deploy_root}/pokemon"
publisher_env_file="${CATALOG_PUBLISHER_ENV_FILE:-${pokemon_dir}/catalog-publisher.env}"
backup_keep="${CATALOG_EDITOR_BACKUP_KEEP:-8}"

fail() {
  echo "pokemon catalog editor backup error: $*" >&2
  exit 1
}

[[ -f "${publisher_env_file}" ]] || fail "publisher credentials not found: ${publisher_env_file}"
[[ "${backup_keep}" =~ ^[1-9][0-9]*$ ]] || fail "CATALOG_EDITOR_BACKUP_KEEP must be a positive integer"

set -a
# shellcheck disable=SC1090
source "${publisher_env_file}"
set +a

for required in CATALOG_DATABASE_NAME CATALOG_PUBLISHER_USER CATALOG_PUBLISHER_PASSWORD CATALOG_DB_CONTAINER; do
  [[ -n "${!required:-}" ]] || fail "${required} is missing from ${publisher_env_file}"
done
docker inspect "${CATALOG_DB_CONTAINER}" >/dev/null 2>&1 || fail "PostgreSQL container not found: ${CATALOG_DB_CONTAINER}"

backup_dir="${pokemon_dir}/catalog-backups"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="${backup_dir}/editor-${timestamp}.dump"
backup_tmp="${backup_path}.tmp"

mkdir -p "${backup_dir}"
trap 'rm -f "${backup_tmp}"' EXIT

docker exec -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" "${CATALOG_DB_CONTAINER}" \
  pg_dump -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" -Fc -n pokemon_catalog > "${backup_tmp}"
[[ -s "${backup_tmp}" ]] || fail "PostgreSQL catalog backup is empty"
mv "${backup_tmp}" "${backup_path}"

mapfile -t backups < <(find "${backup_dir}" -maxdepth 1 -type f -name 'editor-*.dump' -printf '%T@ %p\n' | sort -nr | awk '{print $2}')
if (( ${#backups[@]} > backup_keep )); then
  for stale_backup in "${backups[@]:backup_keep}"; do
    rm -f "${stale_backup}"
  done
fi

echo "PostgreSQL catalog editor backup created."
