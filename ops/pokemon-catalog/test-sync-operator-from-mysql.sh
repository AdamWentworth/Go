#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
deploy_root="$(mktemp -d)"
container_name="pokegonexus-catalog-operator-test-${RANDOM}"
mysql_container="pokegonexus-mysql-operator-source-test-${RANDOM}"
edge_network_name="pokegonexus-catalog-operator-edge-test-${RANDOM}"
volume_name="pokegonexus-catalog-operator-test-${RANDOM}"
host_port=55434
compose_file="${deploy_root}/pokemon/docker-compose.yml"

cleanup() {
  docker rm -f "${container_name}" >/dev/null 2>&1 || true
  docker rm -f "${mysql_container}" >/dev/null 2>&1 || true
  CATALOG_DB_CONTAINER="${container_name}" \
  CATALOG_COMPOSE_PROJECT_NAME=pokemon-catalog-operator-test \
  CATALOG_POSTGRES_VOLUME_NAME="${volume_name}" \
  CATALOG_POSTGRES_HOST_PORT="${host_port}" \
  docker compose --project-name pokemon-catalog-operator-test --project-directory "${deploy_root}/pokemon" -f "${compose_file}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  docker network rm "${edge_network_name}" >/dev/null 2>&1 || true
  docker volume rm "${volume_name}" >/dev/null 2>&1 || true
  rm -rf "${deploy_root}"
}
trap cleanup EXIT

mkdir -p "${deploy_root}/pokemon"
cp "${repo_root}/pokemon/docker-compose.yml" "${compose_file}"
: > "${deploy_root}/pokemon/.env"
docker network create "${edge_network_name}" >/dev/null
docker run -d --name "${mysql_container}" \
  -e MYSQL_USER=adam \
  -e MYSQL_PASSWORD=operator-secret \
  alpine:3.20 sleep 600 >/dev/null

CATALOG_DB_CONTAINER="${container_name}" \
CATALOG_COMPOSE_PROJECT_NAME=pokemon-catalog-operator-test \
CATALOG_POSTGRES_VOLUME_NAME="${volume_name}" \
CATALOG_POSTGRES_HOST_PORT="${host_port}" \
POKEMON_EDGE_NETWORK="${edge_network_name}" \
CATALOG_READER_HOST=localhost \
CATALOG_READER_PORT=5432 \
bash "${repo_root}/ops/pokemon-catalog/provision-postgres.sh" "${deploy_root}" "${compose_file}"

CATALOG_DB_CONTAINER="${container_name}" \
CATALOG_MYSQL_CONTAINER="${mysql_container}" \
bash "${repo_root}/ops/pokemon-catalog/sync-operator-from-mysql.sh" "${deploy_root}"

operator_access="$(docker exec -e PGPASSWORD=operator-secret "${container_name}" \
  psql -U adam -d pokemon_catalog -At -c "SELECT has_schema_privilege(current_user, 'pokemon_catalog', 'USAGE') AND has_schema_privilege(current_user, 'pokemon_catalog', 'CREATE')")"
[[ "${operator_access}" == "t" ]] || {
  echo "operator did not inherit catalog publisher permissions" >&2
  exit 1
}

if docker exec -e PGPASSWORD=operator-secret "${container_name}" \
  psql -U adam -d pokemon_catalog -v ON_ERROR_STOP=1 -c 'CREATE ROLE catalog_operator_write_probe' >/dev/null 2>&1; then
  echo "operator unexpectedly created a PostgreSQL role" >&2
  exit 1
fi

echo "Pokemon catalog operator credential sync test passed"
