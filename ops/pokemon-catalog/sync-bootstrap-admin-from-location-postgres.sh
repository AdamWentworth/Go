#!/usr/bin/env bash
set -euo pipefail

deploy_root="${1:-/srv/pokegonexus}"
pokemon_dir="${deploy_root}/pokemon"
compose_file="${CATALOG_COMPOSE_FILE:-${pokemon_dir}/docker-compose.yml}"
database_env_file="${CATALOG_DATABASE_ENV_FILE:-${pokemon_dir}/catalog-db.env}"
location_container="${CATALOG_LOCATION_POSTGRES_CONTAINER:-location_db}"
catalog_container="${CATALOG_DB_CONTAINER:-pokemon_catalog_db}"
compose_project_name="${CATALOG_COMPOSE_PROJECT_NAME:-pokemon}"
prune_legacy_roles="${CATALOG_PRUNE_LEGACY_ROLES:-false}"
publisher_role="${CATALOG_PUBLISHER_ROLE:-pokemon_catalog_publisher}"

fail() {
  echo "pokemon catalog bootstrap admin sync error: $*" >&2
  exit 1
}

require_identifier() {
  local value="$1"
  [[ "${value}" =~ ^[a-z_][a-z0-9_]*$ ]] || fail "unsafe PostgreSQL identifier: ${value}"
}

container_env_value() {
  local container="$1"
  local key="$2"

  docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "${container}" \
    | awk -F= -v key="${key}" '$1 == key {sub(/^[^=]*=/, ""); print; exit}'
}

resolve_compose_command() {
  if [[ -n "${DOCKER_COMPOSE_BIN:-}" ]]; then
    [[ -x "${DOCKER_COMPOSE_BIN}" ]] || fail "DOCKER_COMPOSE_BIN is not executable: ${DOCKER_COMPOSE_BIN}"
    compose_command=("${DOCKER_COMPOSE_BIN}")
    return
  fi

  if [[ -n "${SUDO_USER:-}" ]]; then
    local sudo_home
    sudo_home="$(getent passwd "${SUDO_USER}" | cut -d: -f6)"
    if [[ -n "${sudo_home}" && -x "${sudo_home}/.docker/cli-plugins/docker-compose" ]]; then
      compose_command=("${sudo_home}/.docker/cli-plugins/docker-compose")
      return
    fi
  fi

  if docker compose version >/dev/null 2>&1; then
    compose_command=(docker compose)
  elif command -v docker-compose >/dev/null 2>&1; then
    compose_command=(docker-compose)
  else
    fail "Docker Compose v2 is required"
  fi
}

wait_for_catalog_health() {
  local health=""
  for _ in $(seq 1 30); do
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${catalog_container}" 2>/dev/null || true)"
    [[ "${health}" == "healthy" ]] && return 0
    sleep 2
  done

  docker logs --tail 200 "${catalog_container}" >&2 || true
  fail "catalog PostgreSQL container did not become healthy"
}

[[ -f "${database_env_file}" ]] || fail "catalog database credentials not found: ${database_env_file}"
[[ -f "${compose_file}" ]] || fail "catalog Compose file not found: ${compose_file}"
command -v docker >/dev/null 2>&1 || fail "docker is required"
resolve_compose_command

# shellcheck disable=SC1090
source "${database_env_file}"
for required in POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD; do
  [[ -n "${!required:-}" ]] || fail "${required} is missing from ${database_env_file}"
done

catalog_database="${POSTGRES_DB}"
legacy_admin="${POSTGRES_USER}"
legacy_admin_password="${POSTGRES_PASSWORD}"
catalog_container="${CATALOG_DB_CONTAINER:-${catalog_container}}"
require_identifier "${catalog_database}"
require_identifier "${legacy_admin}"
require_identifier "${publisher_role}"

docker inspect "${location_container}" >/dev/null 2>&1 || fail "location PostgreSQL container not found: ${location_container}"
location_user="$(container_env_value "${location_container}" POSTGRES_USER)"
location_password="$(container_env_value "${location_container}" POSTGRES_PASSWORD)"
[[ "${location_user}" == "postgres" ]] || fail "location PostgreSQL bootstrap user must be postgres"
[[ -n "${location_password}" ]] || fail "location PostgreSQL password is missing"
[[ "${location_password}" != *$'\n'* && "${location_password}" != *$'\r'* ]] || fail "location PostgreSQL password must not contain a newline"
require_identifier "${location_user}"

docker inspect "${catalog_container}" >/dev/null 2>&1 || fail "catalog PostgreSQL container not found: ${catalog_container}"
wait_for_catalog_health

env_backup_dir="${pokemon_dir}/deployments/catalog-env-backups"
install -d -m 700 "${env_backup_dir}"
env_backup="${env_backup_dir}/catalog-db.env.pre-location-postgres-$(date -u +%Y%m%dT%H%M%SZ)"
cp -p "${database_env_file}" "${env_backup}"

env_changed=0
catalog_recreated=0
rollback() {
  local exit_code="$?"
  if [[ "${exit_code}" -ne 0 && "${env_changed}" -eq 1 ]]; then
    echo "Restoring the prior catalog bootstrap environment after failed sync." >&2
    cp -p "${env_backup}" "${database_env_file}"
    if [[ "${catalog_recreated}" -eq 1 ]]; then
      "${compose_command[@]}" \
        --project-name "${compose_project_name}" \
        --project-directory "${pokemon_dir}" \
        -f "${compose_file}" \
        --env-file "${database_env_file}" \
        up -d --force-recreate --no-deps pokemon_catalog_db >&2 || true
    fi
  fi
  exit "${exit_code}"
}
trap rollback EXIT

docker exec -i \
  -e PGPASSWORD="${legacy_admin_password}" \
  "${catalog_container}" \
  psql -v ON_ERROR_STOP=1 \
    -v root_user="${location_user}" \
    -v root_password="${location_password}" \
    -v legacy_admin="${legacy_admin}" \
    -U "${legacy_admin}" \
    -d "${catalog_database}" <<SQL
SELECT CASE
  WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'root_user')
    THEN format('ALTER ROLE %I LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD %L', :'root_user', :'root_password')
  ELSE format('CREATE ROLE %I LOGIN SUPERUSER CREATEDB CREATEROLE PASSWORD %L', :'root_user', :'root_password')
END
\gexec
SELECT format('ALTER DATABASE %I OWNER TO %I', current_database(), :'root_user')
\gexec
SQL

env_tmp="$(mktemp "${database_env_file}.sync.XXXXXX")"
chmod --reference="${database_env_file}" "${env_tmp}"
chown --reference="${database_env_file}" "${env_tmp}" 2>/dev/null || true
awk '!/^(POSTGRES_USER|POSTGRES_PASSWORD)=/' "${database_env_file}" > "${env_tmp}"
{
  printf 'POSTGRES_USER=%q\n' "${location_user}"
  printf 'POSTGRES_PASSWORD=%q\n' "${location_password}"
} >> "${env_tmp}"
mv "${env_tmp}" "${database_env_file}"
env_changed=1

echo "Recreating catalog PostgreSQL with the standard postgres bootstrap identity."
catalog_recreated=1
"${compose_command[@]}" \
  --project-name "${compose_project_name}" \
  --project-directory "${pokemon_dir}" \
  -f "${compose_file}" \
  --env-file "${database_env_file}" \
  up -d --force-recreate --no-deps pokemon_catalog_db
wait_for_catalog_health

docker exec -e PGPASSWORD="${location_password}" "${catalog_container}" \
  psql -h 127.0.0.1 -v ON_ERROR_STOP=1 -U "${location_user}" -d "${catalog_database}" -Atc \
  "SELECT current_user = 'postgres' AND (SELECT rolsuper FROM pg_roles WHERE rolname = current_user)" \
  | grep -Fxq t || fail "standard postgres bootstrap login verification failed"

if [[ "${prune_legacy_roles}" == "true" ]]; then
  if [[ "${legacy_admin}" != "${location_user}" ]]; then
    # PostgreSQL requires the cluster's original bootstrap superuser to retain
    # SUPERUSER. Disable its login and clear its password instead.
    docker exec -i \
      -e PGPASSWORD="${location_password}" \
      "${catalog_container}" \
      psql -v ON_ERROR_STOP=1 \
        -v legacy_admin="${legacy_admin}" \
        -U "${location_user}" \
        -d "${catalog_database}" <<SQL
SELECT format('ALTER ROLE %I NOLOGIN PASSWORD NULL', :'legacy_admin')
\gexec
SQL
  fi

  for legacy_role in adam; do
    role_exists="$(docker exec -e PGPASSWORD="${location_password}" "${catalog_container}" \
      psql -h 127.0.0.1 -U "${location_user}" -d "${catalog_database}" -Atc \
      "SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${legacy_role}')")"
    [[ "${role_exists}" == t ]] || continue

    docker exec -i \
      -e PGPASSWORD="${location_password}" \
      "${catalog_container}" \
      psql -v ON_ERROR_STOP=1 \
        -v root_user="${location_user}" \
        -v legacy_role="${legacy_role}" \
        -v publisher_role="${publisher_role}" \
        -U "${location_user}" \
        -d "${catalog_database}" <<SQL
SELECT format('REASSIGN OWNED BY %I TO %I', :'legacy_role', :'root_user')
\gexec
SELECT format('REVOKE %I FROM %I', :'publisher_role', :'legacy_role')
\gexec
SELECT format('DROP ROLE %I', :'legacy_role')
\gexec
SQL
  done
fi

trap - EXIT
echo "Catalog bootstrap administration now uses postgres with the existing location PostgreSQL credentials."
echo "Backup of the prior catalog bootstrap environment: ${env_backup}"
