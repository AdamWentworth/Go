#!/usr/bin/env bash
set -euo pipefail

deploy_root="${1:-/srv/pokegonexus}"
pokemon_dir="${deploy_root}/pokemon"
database_env_file="${CATALOG_DATABASE_ENV_FILE:-${pokemon_dir}/catalog-db.env}"
mysql_container="${CATALOG_MYSQL_CONTAINER:-mysql_storage}"
catalog_container="${CATALOG_DB_CONTAINER:-pokemon_catalog_db}"
catalog_database="${CATALOG_DATABASE_NAME:-pokemon_catalog}"
publisher_role="${CATALOG_PUBLISHER_ROLE:-pokemon_catalog_publisher}"

fail() {
  echo "pokemon catalog operator sync error: $*" >&2
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

[[ -f "${database_env_file}" ]] || fail "catalog database credentials not found: ${database_env_file}"
command -v docker >/dev/null 2>&1 || fail "docker is required"

# shellcheck disable=SC1090
source "${database_env_file}"
for required in POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD; do
  [[ -n "${!required:-}" ]] || fail "${required} is missing from ${database_env_file}"
done

catalog_database="${POSTGRES_DB}"
require_identifier "${catalog_database}"
require_identifier "${POSTGRES_USER}"
require_identifier "${publisher_role}"

operator_user="${CATALOG_OPERATOR_USER:-}"
operator_password="${CATALOG_OPERATOR_PASSWORD:-}"
if [[ -z "${operator_user}" && -z "${operator_password}" ]]; then
  docker inspect "${mysql_container}" >/dev/null 2>&1 || fail "MySQL container not found: ${mysql_container}"
  operator_user="$(container_env_value "${mysql_container}" MYSQL_USER)"
  operator_password="$(container_env_value "${mysql_container}" MYSQL_PASSWORD)"
elif [[ -z "${operator_user}" || -z "${operator_password}" ]]; then
  fail "set both CATALOG_OPERATOR_USER and CATALOG_OPERATOR_PASSWORD, or neither to copy MySQL credentials"
fi

[[ -n "${operator_user}" ]] || fail "MySQL username is missing"
[[ -n "${operator_password}" ]] || fail "MySQL password is missing"
[[ "${operator_password}" != *$'\n'* && "${operator_password}" != *$'\r'* ]] || fail "operator password must not contain a newline"
require_identifier "${operator_user}"

docker inspect "${catalog_container}" >/dev/null 2>&1 || fail "catalog PostgreSQL container not found: ${catalog_container}"

docker exec -i \
  -e PGPASSWORD="${POSTGRES_PASSWORD}" \
  "${catalog_container}" \
  psql -v ON_ERROR_STOP=1 \
    -v operator_user="${operator_user}" \
    -v operator_password="${operator_password}" \
    -v publisher_role="${publisher_role}" \
    -U "${POSTGRES_USER}" \
    -d "${catalog_database}" <<SQL
SELECT CASE
  WHEN EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'operator_user')
    THEN format('ALTER ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT', :'operator_user', :'operator_password')
  ELSE format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT', :'operator_user', :'operator_password')
END
\gexec

SELECT format('GRANT CONNECT ON DATABASE %I TO %I', current_database(), :'operator_user')
\gexec
SELECT format('GRANT %I TO %I', :'publisher_role', :'operator_user')
\gexec
SQL

echo "Synced MySQL operator ${operator_user} to PostgreSQL catalog ${catalog_database}."
echo "The operator inherits ${publisher_role}; the API remains on its read-only catalog role."
