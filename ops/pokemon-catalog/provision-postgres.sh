#!/usr/bin/env bash
set -euo pipefail

deploy_root="${1:-/srv/pokegonexus}"
location_env_file="${LOCATION_ENV_FILE:-${deploy_root}/location/.env}"
pokemon_dir="${deploy_root}/pokemon"
publisher_env_file="${CATALOG_PUBLISHER_ENV_FILE:-${pokemon_dir}/catalog-publisher.env}"
reader_env_file="${CATALOG_READER_ENV_FILE:-${pokemon_dir}/catalog-postgres.env}"
location_db_container="${LOCATION_DB_CONTAINER:-location_db}"
catalog_database="${CATALOG_DATABASE_NAME:-pokemon_catalog}"
publisher_user="${CATALOG_PUBLISHER_USER:-pokemon_catalog_publisher}"
reader_user="${CATALOG_READER_USER:-pokemon_catalog_reader}"
publisher_host="${CATALOG_PUBLISHER_HOST:-127.0.0.1}"
publisher_port="${CATALOG_PUBLISHER_PORT:-5432}"
reader_host="${CATALOG_READER_HOST:-location_db}"
reader_port="${CATALOG_READER_PORT:-5432}"

fail() {
  echo "pokemon catalog PostgreSQL provision error: $*" >&2
  exit 1
}

require_identifier() {
  local value="$1"
  [[ "${value}" =~ ^[a-z_][a-z0-9_]*$ ]] || fail "unsafe PostgreSQL identifier: ${value}"
}

[[ -f "${location_env_file}" ]] || fail "location env file not found: ${location_env_file}"
docker inspect "${location_db_container}" >/dev/null 2>&1 || fail "PostgreSQL container not found: ${location_db_container}"
command -v openssl >/dev/null 2>&1 || fail "openssl is required to generate database passwords"

require_identifier "${catalog_database}"
require_identifier "${publisher_user}"
require_identifier "${reader_user}"

# shellcheck disable=SC1090
set -a
source "${location_env_file}"
set +a
[[ -n "${DB_USER:-}" ]] || fail "DB_USER is missing from ${location_env_file}"
[[ -n "${DB_PASSWORD:-}" ]] || fail "DB_PASSWORD is missing from ${location_env_file}"

if [[ -e "${publisher_env_file}" || -e "${reader_env_file}" ]]; then
  fail "catalog credential file already exists; rotate credentials explicitly instead of overwriting it"
fi

publisher_password="$(openssl rand -hex 32)"
reader_password="$(openssl rand -hex 32)"

docker exec -i \
  -e PGPASSWORD="${DB_PASSWORD}" \
  "${location_db_container}" \
  psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d postgres <<SQL
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
SQL

database_exists="$(docker exec -e PGPASSWORD="${DB_PASSWORD}" "${location_db_container}" psql -U "${DB_USER}" -d postgres -Atc "SELECT 1 FROM pg_database WHERE datname = '${catalog_database}'")"
if [[ "${database_exists}" != "1" ]]; then
  docker exec -e PGPASSWORD="${DB_PASSWORD}" "${location_db_container}" \
    createdb -U "${DB_USER}" --owner="${publisher_user}" "${catalog_database}"
fi

docker exec -i \
  -e PGPASSWORD="${DB_PASSWORD}" \
  "${location_db_container}" \
  psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d postgres <<SQL
REVOKE ALL ON DATABASE ${catalog_database} FROM PUBLIC;
GRANT CONNECT ON DATABASE ${catalog_database} TO ${publisher_user}, ${reader_user};
SQL

mkdir -p "${pokemon_dir}"
umask 077
publisher_url="postgres://${publisher_user}:${publisher_password}@${publisher_host}:${publisher_port}/${catalog_database}?sslmode=disable"
reader_url="postgres://${reader_user}:${reader_password}@${reader_host}:${reader_port}/${catalog_database}?sslmode=disable"

{
  printf 'CATALOG_PUBLISHER_DATABASE_URL=%q\n' "${publisher_url}"
  printf 'CATALOG_DATABASE_NAME=%q\n' "${catalog_database}"
  printf 'CATALOG_PUBLISHER_USER=%q\n' "${publisher_user}"
  printf 'CATALOG_PUBLISHER_PASSWORD=%q\n' "${publisher_password}"
  printf 'CATALOG_READER_USER=%q\n' "${reader_user}"
  printf 'LOCATION_DB_CONTAINER=%q\n' "${location_db_container}"
} > "${publisher_env_file}"

{
  printf 'CATALOG_DB_DRIVER=postgres\n'
  printf 'CATALOG_DATABASE_URL=%q\n' "${reader_url}"
} > "${reader_env_file}"

chmod 600 "${publisher_env_file}" "${reader_env_file}"

echo "Provisioned PostgreSQL catalog database: ${catalog_database}"
echo "Publisher credentials: ${publisher_env_file}"
echo "Reader cutover settings: ${reader_env_file}"
echo "The Pokemon API remains on SQLite until the explicit cutover step."
