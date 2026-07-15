#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_root="$(mktemp -d)"
catalog_container="pokegonexus-catalog-bootstrap-test-${RANDOM}"
location_container="pokegonexus-location-bootstrap-source-test-${RANDOM}"
edge_network_name="pokegonexus-catalog-bootstrap-edge-test-${RANDOM}"
volume_name="pokegonexus-catalog-bootstrap-test-${RANDOM}"
host_port=55434
compose_file="${deploy_root}/pokemon/docker-compose.yml"

cleanup() {
  docker rm -f "${catalog_container}" >/dev/null 2>&1 || true
  docker rm -f "${location_container}" >/dev/null 2>&1 || true
  CATALOG_DB_CONTAINER="${catalog_container}" \
  CATALOG_COMPOSE_PROJECT_NAME=pokemon-catalog-bootstrap-test \
  CATALOG_POSTGRES_VOLUME_NAME="${volume_name}" \
  CATALOG_POSTGRES_HOST_PORT="${host_port}" \
  docker compose --project-name pokemon-catalog-bootstrap-test --project-directory "${deploy_root}/pokemon" -f "${compose_file}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  docker network rm "${edge_network_name}" >/dev/null 2>&1 || true
  docker volume rm "${volume_name}" >/dev/null 2>&1 || true
  rm -rf "${deploy_root}"
}
trap cleanup EXIT

mkdir -p "${deploy_root}/pokemon"
cp "${repo_root}/pokemon/docker-compose.yml" "${compose_file}"
: > "${deploy_root}/pokemon/.env"
docker network create "${edge_network_name}" >/dev/null
docker run -d --name "${location_container}" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=location-secret \
  alpine:3.20 sleep 600 >/dev/null

CATALOG_ADMIN_USER=pokemon_catalog_admin \
CATALOG_DB_CONTAINER="${catalog_container}" \
CATALOG_COMPOSE_PROJECT_NAME=pokemon-catalog-bootstrap-test \
CATALOG_POSTGRES_VOLUME_NAME="${volume_name}" \
CATALOG_POSTGRES_HOST_PORT="${host_port}" \
POKEMON_EDGE_NETWORK="${edge_network_name}" \
CATALOG_READER_HOST=localhost \
CATALOG_READER_PORT=5432 \
bash "${repo_root}/ops/pokemon-catalog/provision-postgres.sh" "${deploy_root}" "${compose_file}"

set -a
source "${deploy_root}/pokemon/catalog-db.env"
set +a
docker exec -e PGPASSWORD="${POSTGRES_PASSWORD}" "${catalog_container}" \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -v ON_ERROR_STOP=1 -c 'CREATE ROLE adam LOGIN' >/dev/null

CATALOG_DB_CONTAINER="${catalog_container}" \
CATALOG_COMPOSE_PROJECT_NAME=pokemon-catalog-bootstrap-test \
CATALOG_LOCATION_POSTGRES_CONTAINER="${location_container}" \
CATALOG_PRUNE_LEGACY_ROLES=true \
bash "${repo_root}/ops/pokemon-catalog/sync-bootstrap-admin-from-location-postgres.sh" "${deploy_root}"

set -a
source "${deploy_root}/pokemon/catalog-db.env"
set +a
[[ "${POSTGRES_USER}" == postgres ]] || {
  echo "catalog bootstrap user did not become postgres" >&2
  exit 1
}
[[ "${POSTGRES_PASSWORD}" == location-secret ]] || {
  echo "catalog bootstrap password did not match location PostgreSQL" >&2
  exit 1
}

role_state="$(docker exec -e PGPASSWORD=location-secret "${catalog_container}" \
  psql -h 127.0.0.1 -U postgres -d pokemon_catalog -At -F '|' -c "
    SELECT
      current_user,
      (SELECT rolsuper FROM pg_roles WHERE rolname = current_user),
      EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pokemon_catalog_admin'),
      (SELECT rolcanlogin FROM pg_roles WHERE rolname = 'pokemon_catalog_admin'),
      (SELECT rolsuper FROM pg_roles WHERE rolname = 'pokemon_catalog_admin'),
      EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'adam');
  ")"
[[ "${role_state}" == 'postgres|t|t|f|t|f' ]] || {
  echo "unexpected post-migration catalog role state: ${role_state}" >&2
  exit 1
}

echo "Pokemon catalog bootstrap admin sync test passed"
