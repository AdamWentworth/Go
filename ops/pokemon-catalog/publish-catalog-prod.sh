#!/usr/bin/env bash
set -euo pipefail

repo_root="${1:?Usage: publish-catalog-prod.sh REPO_ROOT [DEPLOY_ROOT] [SQLITE_PATH] [RELEASE_ID]}"
deploy_root="${2:-/srv/pokegonexus}"
sqlite_path="${3:-${repo_root}/pokemon/data/pokego.db}"
release_id="${4:-catalog-${GITHUB_SHA:-$(date -u +%Y%m%dT%H%M%SZ)}}"
publisher_env_file="${CATALOG_PUBLISHER_ENV_FILE:-${deploy_root}/pokemon/catalog-publisher.env}"
backup_keep="${CATALOG_BACKUP_KEEP:-4}"

fail() {
  echo "pokemon catalog publish error: $*" >&2
  exit 1
}

[[ -d "${repo_root}/pokemon" ]] || fail "Pokemon source directory not found under ${repo_root}"
[[ -s "${sqlite_path}" ]] || fail "SQLite catalog is missing or empty: ${sqlite_path}"
[[ -f "${publisher_env_file}" ]] || fail "publisher credentials not found: ${publisher_env_file}"
[[ "${release_id}" =~ ^[A-Za-z0-9._-]+$ ]] || fail "release ID contains unsupported characters: ${release_id}"
[[ "${backup_keep}" =~ ^[1-9][0-9]*$ ]] || fail "CATALOG_BACKUP_KEEP must be a positive integer"

# shellcheck disable=SC1090
set -a
source "${publisher_env_file}"
set +a

for required in CATALOG_PUBLISHER_DATABASE_URL CATALOG_DATABASE_NAME CATALOG_PUBLISHER_USER CATALOG_PUBLISHER_PASSWORD CATALOG_READER_USER CATALOG_DB_CONTAINER; do
  [[ -n "${!required:-}" ]] || fail "${required} is missing from ${publisher_env_file}"
done
docker inspect "${CATALOG_DB_CONTAINER}" >/dev/null 2>&1 || fail "PostgreSQL container not found: ${CATALOG_DB_CONTAINER}"

catalog_initialized() {
  docker exec -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" "${CATALOG_DB_CONTAINER}" \
    psql -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" -Atc \
    "SELECT to_regclass('pokemon_catalog.catalog_releases') IS NOT NULL"
}

active_release=""
backup_path=""
import_committed=0

restore_backup() {
  local status="$1"
  if [[ "${status}" -ne 0 && "${import_committed}" -eq 1 && -n "${backup_path}" && -s "${backup_path}" ]]; then
    echo "Post-publish verification failed; restoring PostgreSQL catalog backup: ${backup_path}" >&2
    cat "${backup_path}" | docker exec -i \
      -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" \
      "${CATALOG_DB_CONTAINER}" \
      pg_restore -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" --clean --if-exists --no-owner -n pokemon_catalog || true
  fi
  exit "${status}"
}
trap 'restore_backup $?' EXIT

if [[ "$(catalog_initialized)" == "t" ]]; then
  active_release="$(docker exec -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" "${CATALOG_DB_CONTAINER}" \
    psql -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" -Atc \
    "SELECT COALESCE((SELECT release_id FROM pokemon_catalog.catalog_releases WHERE is_active), 'unversioned')")"

  backup_dir="${deploy_root}/pokemon/catalog-backups"
  mkdir -p "${backup_dir}"
  backup_path="${backup_dir}/catalog-${active_release}-$(date -u +%Y%m%dT%H%M%SZ).dump"
  backup_tmp="${backup_path}.tmp"
  echo "Backing up active PostgreSQL catalog ${active_release}"
  docker exec -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" "${CATALOG_DB_CONTAINER}" \
    pg_dump -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" -Fc -n pokemon_catalog > "${backup_tmp}"
  [[ -s "${backup_tmp}" ]] || fail "PostgreSQL catalog backup is empty"
  mv "${backup_tmp}" "${backup_path}"
fi

echo "Importing SQLite catalog into PostgreSQL as ${release_id}"
(
  cd "${repo_root}/pokemon"
  go run ./cmd/catalog-import \
    --sqlite "${sqlite_path}" \
    --database-url "${CATALOG_PUBLISHER_DATABASE_URL}" \
    --release-id "${release_id}" \
    --source-label "${GITHUB_SHA:-manual-publish}"
)
import_committed=1

docker exec -i \
  -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" \
  "${CATALOG_DB_CONTAINER}" \
  psql -v ON_ERROR_STOP=1 -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" <<SQL
REVOKE ALL ON SCHEMA pokemon_catalog FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA pokemon_catalog FROM PUBLIC;
GRANT USAGE ON SCHEMA pokemon_catalog TO ${CATALOG_READER_USER};
GRANT SELECT ON ALL TABLES IN SCHEMA pokemon_catalog TO ${CATALOG_READER_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA pokemon_catalog REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA pokemon_catalog GRANT SELECT ON TABLES TO ${CATALOG_READER_USER};
SQL

actual_release="$(docker exec -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" "${CATALOG_DB_CONTAINER}" \
  psql -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" -Atc \
  "SELECT release_id FROM pokemon_catalog.catalog_releases WHERE is_active")"
[[ "${actual_release}" == "${release_id}" ]] || fail "active PostgreSQL release is ${actual_release:-missing}, expected ${release_id}"

if [[ -n "${backup_path}" ]]; then
  mapfile -t backups < <(find "$(dirname "${backup_path}")" -maxdepth 1 -type f -name 'catalog-*.dump' -printf '%T@ %p\n' | sort -nr | awk '{print $2}')
  if (( ${#backups[@]} > backup_keep )); then
    for stale_backup in "${backups[@]:backup_keep}"; do
      rm -f "${stale_backup}"
    done
  fi
fi

echo "PostgreSQL catalog publish complete: ${release_id}"
echo "The running Pokemon API remains unchanged until the explicit PostgreSQL cutover."
