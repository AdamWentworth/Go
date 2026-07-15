#!/usr/bin/env bash
set -euo pipefail

deploy_root="${1:-/srv/pokegonexus}"
compose_source="${2:-${deploy_root}/pokemon/docker-compose.yml}"
pokemon_dir="${deploy_root}/pokemon"
compose_file="${CATALOG_COMPOSE_FILE:-${pokemon_dir}/docker-compose.yml}"
database_env_file="${CATALOG_DATABASE_ENV_FILE:-${pokemon_dir}/catalog-db.env}"
publisher_env_file="${CATALOG_PUBLISHER_ENV_FILE:-${pokemon_dir}/catalog-publisher.env}"
reader_env_file="${CATALOG_READER_ENV_FILE:-${pokemon_dir}/catalog-postgres.env}"
catalog_database="${CATALOG_DATABASE_NAME:-pokemon_catalog}"
admin_user="${CATALOG_ADMIN_USER:-postgres}"
publisher_user="${CATALOG_PUBLISHER_USER:-pokemon_catalog_publisher}"
reader_user="${CATALOG_READER_USER:-pokemon_catalog_reader}"
catalog_container="${CATALOG_DB_CONTAINER:-pokemon_catalog_db}"
compose_project_name="${CATALOG_COMPOSE_PROJECT_NAME:-pokemon}"
edge_network_name="${POKEMON_EDGE_NETWORK:-pokemon_edge}"
publisher_host="${CATALOG_PUBLISHER_HOST:-127.0.0.1}"
publisher_port="${CATALOG_POSTGRES_HOST_PORT:-5433}"
reader_host="${CATALOG_READER_HOST:-${catalog_container}}"
reader_port="${CATALOG_READER_PORT:-5432}"
parity_host="${CATALOG_PARITY_HOST:-127.0.0.1}"
parity_port="${CATALOG_PARITY_PORT:-${publisher_port}}"

fail() {
  echo "pokemon catalog PostgreSQL provision error: $*" >&2
  exit 1
}

resolve_compose_command() {
  if [[ -n "${DOCKER_COMPOSE_BIN:-}" ]]; then
    [[ -x "${DOCKER_COMPOSE_BIN}" ]] || fail "DOCKER_COMPOSE_BIN is not executable: ${DOCKER_COMPOSE_BIN}"
    compose_command=("${DOCKER_COMPOSE_BIN}")
    return
  fi

  # Ubuntu can expose legacy docker-compose to root while the invoking admin has
  # the supported Compose v2 plugin in their Docker config directory.
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

require_identifier() {
  local value="$1"
  [[ "${value}" =~ ^[a-z_][a-z0-9_]*$ ]] || fail "unsafe PostgreSQL identifier: ${value}"
}

for identifier in "${catalog_database}" "${admin_user}" "${publisher_user}" "${reader_user}"; do
  require_identifier "${identifier}"
done

[[ -f "${compose_source}" ]] || fail "catalog compose source not found: ${compose_source}"
command -v docker >/dev/null 2>&1 || fail "docker is required"
command -v openssl >/dev/null 2>&1 || fail "openssl is required to generate database passwords"
resolve_compose_command

volume_name="${CATALOG_POSTGRES_VOLUME_NAME:-pokemon_catalog_pgdata}"
if [[ -e "${database_env_file}" || -e "${publisher_env_file}" || -e "${reader_env_file}" ]]; then
  if [[ -f "${database_env_file}" && ! -e "${publisher_env_file}" && ! -e "${reader_env_file}" ]] \
    && ! docker inspect "${catalog_container}" >/dev/null 2>&1 \
    && ! docker volume inspect "${volume_name}" >/dev/null 2>&1; then
    echo "Discarding incomplete catalog bootstrap credential file from a prior failed provision."
    rm -f "${database_env_file}"
  else
    fail "catalog credential or database state already exists; rotate credentials explicitly instead of overwriting it"
  fi
fi

install -d -m 700 "${pokemon_dir}"
if [[ "${compose_source}" != "${compose_file}" ]]; then
  install -m 644 "${compose_source}" "${compose_file}"
fi

docker network inspect "${edge_network_name}" >/dev/null 2>&1 || fail "Pokemon edge network not found: ${edge_network_name}"

admin_password="$(openssl rand -hex 32)"
publisher_password="$(openssl rand -hex 32)"
reader_password="$(openssl rand -hex 32)"

umask 077
{
  printf 'POSTGRES_DB=%q\n' "${catalog_database}"
  printf 'POSTGRES_USER=%q\n' "${admin_user}"
  printf 'POSTGRES_PASSWORD=%q\n' "${admin_password}"
  printf 'CATALOG_DB_CONTAINER=%q\n' "${catalog_container}"
  printf 'CATALOG_POSTGRES_VOLUME_NAME=%q\n' "${volume_name}"
  printf 'CATALOG_POSTGRES_HOST_PORT=%q\n' "${publisher_port}"
} > "${database_env_file}"
chmod 600 "${database_env_file}"

CATALOG_DB_CONTAINER="${catalog_container}" \
CATALOG_POSTGRES_HOST_PORT="${publisher_port}" \
POKEMON_EDGE_NETWORK="${edge_network_name}" \
"${compose_command[@]}" \
  --project-name "${compose_project_name}" \
  --project-directory "${pokemon_dir}" \
  -f "${compose_file}" \
  --env-file "${database_env_file}" \
  up -d pokemon_catalog_db

for _ in $(seq 1 30); do
  health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${catalog_container}" 2>/dev/null || true)"
  if [[ "${health}" == "healthy" ]]; then
    break
  fi
  sleep 2
done
health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${catalog_container}" 2>/dev/null || true)"
[[ "${health}" == "healthy" ]] || {
  docker logs --tail 200 "${catalog_container}" >&2 || true
  fail "catalog PostgreSQL container did not become healthy"
}

docker exec -i \
  -e PGPASSWORD="${admin_password}" \
  "${catalog_container}" \
  psql -v ON_ERROR_STOP=1 -U "${admin_user}" -d "${catalog_database}" <<SQL
REVOKE ALL ON DATABASE ${catalog_database} FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${publisher_user}') THEN
    CREATE ROLE ${publisher_user} LOGIN PASSWORD '${publisher_password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  ELSE
    ALTER ROLE ${publisher_user} LOGIN PASSWORD '${publisher_password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${reader_user}') THEN
    CREATE ROLE ${reader_user} LOGIN PASSWORD '${reader_password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  ELSE
    ALTER ROLE ${reader_user} LOGIN PASSWORD '${reader_password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
\$\$;

CREATE SCHEMA IF NOT EXISTS pokemon_catalog AUTHORIZATION ${publisher_user};
ALTER SCHEMA pokemon_catalog OWNER TO ${publisher_user};
REVOKE ALL ON SCHEMA pokemon_catalog FROM PUBLIC;
GRANT CONNECT, CREATE ON DATABASE ${catalog_database} TO ${publisher_user};
GRANT CONNECT ON DATABASE ${catalog_database} TO ${reader_user};
SQL

publisher_url="postgres://${publisher_user}:${publisher_password}@${publisher_host}:${publisher_port}/${catalog_database}?sslmode=disable"
reader_url="postgres://${reader_user}:${reader_password}@${reader_host}:${reader_port}/${catalog_database}?sslmode=disable"
parity_url="postgres://${reader_user}:${reader_password}@${parity_host}:${parity_port}/${catalog_database}?sslmode=disable"

{
  printf 'CATALOG_PUBLISHER_DATABASE_URL=%q\n' "${publisher_url}"
  printf 'CATALOG_DATABASE_NAME=%q\n' "${catalog_database}"
  printf 'CATALOG_PUBLISHER_USER=%q\n' "${publisher_user}"
  printf 'CATALOG_PUBLISHER_PASSWORD=%q\n' "${publisher_password}"
  printf 'CATALOG_READER_USER=%q\n' "${reader_user}"
  printf 'CATALOG_DB_CONTAINER=%q\n' "${catalog_container}"
} > "${publisher_env_file}"

{
  printf 'CATALOG_DB_DRIVER=postgres\n'
  printf 'CATALOG_DATABASE_URL=%q\n' "${reader_url}"
  printf 'CATALOG_PARITY_DATABASE_URL=%q\n' "${parity_url}"
} > "${reader_env_file}"

chmod 600 "${publisher_env_file}" "${reader_env_file}"
if [[ "${EUID}" -eq 0 && -n "${SUDO_USER:-}" ]]; then
  runtime_group="$(id -gn "${SUDO_USER}")"
  # The deployment runner already has Docker control on this single-node host,
  # which permits inspecting a container's environment. Keep all Compose
  # service env files consistently readable by that runner so normal API
  # deploys and the cutover do not fail while resolving the database service.
  chown root:"${runtime_group}" "${database_env_file}" "${publisher_env_file}" "${reader_env_file}"
  chmod 640 "${database_env_file}" "${publisher_env_file}" "${reader_env_file}"
fi

echo "Provisioned dedicated PostgreSQL catalog container: ${catalog_container}"
echo "Catalog database: ${catalog_database}"
echo "Persistent volume: ${volume_name}"
echo "Publisher credentials: ${publisher_env_file}"
echo "Reader cutover settings: ${reader_env_file}"
echo "The Pokemon API remains on SQLite until the explicit cutover step."
