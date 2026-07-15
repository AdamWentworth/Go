#!/usr/bin/env bash
set -euo pipefail

repo_root="${1:?Usage: cutover-postgres.sh REPO_ROOT [DEPLOY_ROOT] [IMAGE_REF] [SERVICE_NAME]}"
deploy_root="${2:-/srv/pokegonexus}"
image_ref="${3:?A pinned Pokemon API image reference is required}"
service_name="${4:-pokemon_data}"
pokemon_dir="${deploy_root}/pokemon"
compose_file="${repo_root}/pokemon/docker-compose.yml"
app_env_file="${pokemon_dir}/.env"
reader_env_file="${pokemon_dir}/catalog-postgres.env"
sqlite_path="${pokemon_dir}/data/pokego.db"
container_name="pokemon_data_container"
catalog_container="pokemon_catalog_db"
image_repo="adamwentworth/pokemon_service_go"
backup_dir="${pokemon_dir}/deployments/catalog-env-backups"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
env_backup_file="${backup_dir}/pokemon.env.pre-postgres-${timestamp}"
catalog_env_changed=0
service_recreated=0
health_ok=0
parity_snapshot_dir=""
parity_sqlite_path=""

# shellcheck disable=SC1091
source "${repo_root}/ops/pokemon-catalog/runtime-env.sh"
# shellcheck disable=SC1091
source "${repo_root}/ops/prod/deploy-image-utils.sh"

fail() {
  echo "pokemon catalog cutover error: $*" >&2
  exit 1
}

rollback() {
  local status="$?"
  trap - EXIT

  if [[ "${status}" -ne 0 && "${catalog_env_changed}" -eq 1 ]]; then
    echo "Cutover failed; restoring the SQLite runtime environment." >&2
    catalog_restore_runtime_env "${env_backup_file}" "${app_env_file}" || true

    if [[ "${service_recreated}" -eq 1 ]]; then
      rollback_target="${ROLLBACK_IMAGE:-${PREVIOUS_IMAGE:-}}"
      if [[ -n "${rollback_target}" ]]; then
        echo "Restoring previous Pokemon API image: ${rollback_target}" >&2
        POKEMON_IMAGE="${rollback_target}" docker compose \
          --project-directory "${pokemon_dir}" \
          -f "${compose_file}" \
          --env-file "${app_env_file}" \
          up -d --no-deps --force-recreate --no-build "${service_name}" || true
      else
        echo "No prior Pokemon API image was available for automatic rollback." >&2
      fi
    fi
  fi

  if [[ -n "${parity_snapshot_dir}" ]]; then
    rm -rf "${parity_snapshot_dir}"
  fi

  exit "${status}"
}
trap rollback EXIT

[[ -d "${repo_root}/pokemon" ]] || fail "Pokemon source directory not found under ${repo_root}"
[[ -f "${compose_file}" ]] || fail "Pokemon compose file not found: ${compose_file}"
[[ -f "${app_env_file}" ]] || fail "Pokemon runtime environment not found: ${app_env_file}"
[[ -s "${sqlite_path}" ]] || fail "production SQLite catalog is missing or empty: ${sqlite_path}"
docker inspect "${catalog_container}" >/dev/null 2>&1 || fail "catalog PostgreSQL container not found: ${catalog_container}"

catalog_health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${catalog_container}")"
[[ "${catalog_health}" == "healthy" ]] || fail "catalog PostgreSQL container is not healthy: ${catalog_health}"

catalog_load_reader_settings "${reader_env_file}"
parity_database_url="${CATALOG_PARITY_DATABASE_URL:-}"
[[ -n "${parity_database_url}" ]] || fail "CATALOG_PARITY_DATABASE_URL is missing from ${reader_env_file}; regenerate the reader settings before cutover"

parity_snapshot_dir="$(mktemp -d "${TMPDIR:-/tmp}/pokemon-catalog-parity.XXXXXX")"
parity_sqlite_path="${parity_snapshot_dir}/pokego.db"
catalog_copy_sqlite_snapshot "${sqlite_path}" "${parity_sqlite_path}"

echo "Verifying PostgreSQL catalog payload parity against a production SQLite snapshot."
(
  cd "${repo_root}/pokemon"
  SQLITE_PATH="${parity_sqlite_path}" \
  POSTGRES_TEST_URL="${parity_database_url}" \
    go test -count=1 -run TestPostgresPayloadParity ./internal/builder
)

prepare_rollback_image "${image_repo}" "pokemon-postgres-cutover" "${container_name}"

echo "Pulling pinned Pokemon API image: ${image_ref}"
docker pull "${image_ref}"
select_deploy_image "${image_ref}" "${image_repo}"

echo "Writing PostgreSQL reader settings to the private Pokemon runtime environment."
catalog_write_postgres_runtime_env "${app_env_file}" "${env_backup_file}"
catalog_env_changed=1

echo "Ensuring catalog PostgreSQL is running before cutover."
docker compose \
  --project-directory "${pokemon_dir}" \
  -f "${compose_file}" \
  --env-file "${app_env_file}" \
  up -d pokemon_catalog_db

echo "Recreating ${service_name} against PostgreSQL."
POKEMON_IMAGE="${DEPLOY_IMAGE}" docker compose \
  --project-directory "${pokemon_dir}" \
  -f "${compose_file}" \
  --env-file "${app_env_file}" \
  up -d --no-deps --force-recreate --no-build "${service_name}"
service_recreated=1

container_ip="$(docker inspect -f '{{with index .NetworkSettings.Networks "pokemon_edge"}}{{.IPAddress}}{{end}}' "${container_name}" 2>/dev/null || true)"
[[ -n "${container_ip}" ]] || fail "could not determine Pokemon API address on pokemon_edge"

echo "Waiting for PostgreSQL-backed API readiness."
for _ in $(seq 1 30); do
  if curl -fsS --max-time 2 "http://${container_ip}:3001/readyz" >/dev/null 2>&1; then
    health_ok=1
    break
  fi
  sleep 2
done
if [[ "${health_ok}" -ne 1 ]]; then
  docker logs --tail 200 "${container_name}" >&2 || true
  fail "PostgreSQL-backed Pokemon API did not become ready"
fi

runtime_driver="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "${container_name}" | awk -F= '$1 == "CATALOG_DB_DRIVER" { print $2 }')"
[[ "${runtime_driver}" == "postgres" || "${runtime_driver}" == "postgresql" ]] || fail "running Pokemon API did not receive PostgreSQL settings"

write_deploy_metadata \
  "${pokemon_dir}/deployments/${service_name}.json" \
  "${service_name}" \
  "${image_ref}" \
  "${image_ref}" \
  "${TARGET_DIGEST}" \
  "${DEPLOY_IMAGE}" \
  "${container_name}" \
  "${PREVIOUS_IMAGE}" \
  "${PREVIOUS_IMAGE_ID}" \
  "${ROLLBACK_IMAGE}"

cat > "${pokemon_dir}/deployments/catalog-postgres-cutover.json" <<EOF
{
  "cutover_at_utc": "${timestamp}",
  "catalog_driver": "postgres",
  "environment_backup": "${env_backup_file}",
  "sqlite_catalog_retained": "${sqlite_path}",
  "image": "${DEPLOY_IMAGE}",
  "previous_image": "${PREVIOUS_IMAGE}"
}
EOF
chmod 600 "${pokemon_dir}/deployments/catalog-postgres-cutover.json"

echo "PostgreSQL cutover succeeded. SQLite remains at ${sqlite_path}."
