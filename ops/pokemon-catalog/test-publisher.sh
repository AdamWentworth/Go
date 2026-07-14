#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
container_name="pokegonexus-catalog-publisher-test-${RANDOM}"
deploy_root="$(mktemp -d)"

cleanup() {
  docker rm -f "${container_name}" >/dev/null 2>&1 || true
  rm -rf "${deploy_root}"
}
trap cleanup EXIT

mkdir -p "${deploy_root}/location" "${deploy_root}/pokemon"
cat > "${deploy_root}/location/.env" <<'ENV'
DB_USER=postgres
DB_PASSWORD=catalog-test-password
DB_NAME=location
ENV

docker run --detach --rm --name "${container_name}" --tmpfs /var/lib/postgresql/data \
  -e POSTGRES_DB=location \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=catalog-test-password \
  -p 127.0.0.1:55433:5432 postgres:17-alpine >/dev/null

for _ in $(seq 1 30); do
  if docker exec "${container_name}" pg_isready -U postgres -d location >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "${container_name}" pg_isready -U postgres -d location >/dev/null

LOCATION_DB_CONTAINER="${container_name}" \
CATALOG_PUBLISHER_PORT=55433 \
CATALOG_READER_HOST=localhost \
CATALOG_READER_PORT=5432 \
bash "${repo_root}/ops/pokemon-catalog/provision-postgres.sh" "${deploy_root}"

LOCATION_DB_CONTAINER="${container_name}" \
bash "${repo_root}/ops/pokemon-catalog/publish-catalog-prod.sh" \
  "${repo_root}" "${deploy_root}" "${repo_root}/pokemon/data/pokego.db" "catalog-publisher-test-one"

set -a
# shellcheck disable=SC1090
source "${deploy_root}/pokemon/catalog-postgres.env"
set +a
reader_count="$(docker exec -e CATALOG_DATABASE_URL="${CATALOG_DATABASE_URL}" "${container_name}" \
  sh -c 'psql "$CATALOG_DATABASE_URL" -Atc "SELECT COUNT(*) FROM pokemon_catalog.pokemon"')"
[[ "${reader_count}" =~ ^[1-9][0-9]*$ ]] || {
  echo "reader could not read the imported catalog" >&2
  exit 1
}
if docker exec -e CATALOG_DATABASE_URL="${CATALOG_DATABASE_URL}" "${container_name}" \
  sh -c 'psql "$CATALOG_DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE TABLE pokemon_catalog.reader_write_probe (id INTEGER)"' >/dev/null 2>&1; then
  echo "reader unexpectedly created a catalog table" >&2
  exit 1
fi

LOCATION_DB_CONTAINER="${container_name}" \
bash "${repo_root}/ops/pokemon-catalog/publish-catalog-prod.sh" \
  "${repo_root}" "${deploy_root}" "${repo_root}/pokemon/data/pokego.db" "catalog-publisher-test-two"

backup_count="$(find "${deploy_root}/pokemon/catalog-backups" -type f -name 'catalog-*.dump' | wc -l | tr -d '[:space:]')"
[[ "${backup_count}" -ge 1 ]] || {
  echo "expected a PostgreSQL catalog backup after the second publish" >&2
  exit 1
}

# Verify the retained dump is actually usable before declaring the publisher safe.
set -a
# shellcheck disable=SC1090
source "${deploy_root}/pokemon/catalog-publisher.env"
set +a
backup_path="$(find "${deploy_root}/pokemon/catalog-backups" -type f -name 'catalog-*.dump' -print -quit)"
cat "${backup_path}" | docker exec -i \
  -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" \
  "${container_name}" \
  pg_restore -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" --clean --if-exists --no-owner -n pokemon_catalog

restored_release="$(docker exec -e PGPASSWORD="${CATALOG_PUBLISHER_PASSWORD}" "${container_name}" \
  psql -U "${CATALOG_PUBLISHER_USER}" -d "${CATALOG_DATABASE_NAME}" -Atc \
  "SELECT release_id FROM pokemon_catalog.catalog_releases WHERE is_active")"
[[ "${restored_release}" == "catalog-publisher-test-one" ]] || {
  echo "expected rollback to restore catalog-publisher-test-one, got ${restored_release:-missing}" >&2
  exit 1
}

echo "PostgreSQL publisher and rollback test passed"
