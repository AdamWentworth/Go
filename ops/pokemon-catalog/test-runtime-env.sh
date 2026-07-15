#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
work_dir="$(mktemp -d)"
trap 'rm -rf "${work_dir}"' EXIT

# shellcheck disable=SC1091
source "${repo_root}/ops/pokemon-catalog/runtime-env.sh"

app_env_file="${work_dir}/.env"
reader_env_file="${work_dir}/catalog-postgres.env"
backup_file="${work_dir}/backups/pre-postgres.env"

cat > "${app_env_file}" <<'EOF'
NODE_ENV=production
SQLITE_PATH=./data/pokego.db
CATALOG_DB_DRIVER=sqlite
CATALOG_DATABASE_URL=postgres://obsolete
CACHE_PREWARM=true
EOF
cat > "${reader_env_file}" <<'EOF'
CATALOG_DB_DRIVER=postgres
CATALOG_DATABASE_URL=postgres://pokemon_catalog_reader:reader-secret@pokemon_catalog_db:5432/pokemon_catalog?sslmode=disable
CATALOG_PARITY_DATABASE_URL=postgres://pokemon_catalog_reader:reader-secret@127.0.0.1:5433/pokemon_catalog?sslmode=disable
EOF

catalog_load_reader_settings "${reader_env_file}"
catalog_write_postgres_runtime_env "${app_env_file}" "${backup_file}"

grep -Fxq 'NODE_ENV=production' "${app_env_file}"
grep -Fxq 'SQLITE_PATH=./data/pokego.db' "${app_env_file}"
grep -Fxq 'CACHE_PREWARM=true' "${app_env_file}"
grep -Fxq 'CATALOG_DB_DRIVER=postgres' "${app_env_file}"
grep -Fxq 'CATALOG_DATABASE_URL=postgres://pokemon_catalog_reader:reader-secret@pokemon_catalog_db:5432/pokemon_catalog?sslmode=disable' "${app_env_file}"
! grep -Fq 'postgres://obsolete' "${app_env_file}"
grep -Fxq 'CATALOG_DB_DRIVER=sqlite' "${backup_file}"

mode="$(stat -c '%a' "${app_env_file}")"
[[ "${mode}" == "600" ]] || {
  echo "expected runtime environment mode 600, got ${mode}" >&2
  exit 1
}

catalog_restore_runtime_env "${backup_file}" "${app_env_file}"
grep -Fxq 'CATALOG_DB_DRIVER=sqlite' "${app_env_file}"
grep -Fxq 'CATALOG_DATABASE_URL=postgres://obsolete' "${app_env_file}"

# Compose must receive the exact URL, including the query string. A shell-escaped
# URL is valid for `source` but can be wrong when treated as a Compose env_file.
compose_dir="${work_dir}/compose/pokemon"
mkdir -p "${compose_dir}/data"
cp "${repo_root}/pokemon/docker-compose.yml" "${compose_dir}/docker-compose.yml"
cp "${reader_env_file}" "${compose_dir}/catalog-postgres.env"
cat > "${compose_dir}/catalog-db.env" <<'EOF'
POSTGRES_DB=pokemon_catalog
POSTGRES_USER=admin
POSTGRES_PASSWORD=bootstrap-secret
EOF
cat > "${compose_dir}/.env" <<'EOF'
NODE_ENV=production
EOF
catalog_load_reader_settings "${reader_env_file}"
catalog_write_postgres_runtime_env "${compose_dir}/.env" "${work_dir}/compose/pre-postgres.env"
compose_url="$(docker compose \
  --project-directory "${compose_dir}" \
  -f "${compose_dir}/docker-compose.yml" \
  --env-file "${compose_dir}/.env" \
  config --format json \
  | python3 -c 'import json, sys; print(json.load(sys.stdin)["services"]["pokemon_data"]["environment"]["CATALOG_DATABASE_URL"])')"
[[ "${compose_url}" == "${CATALOG_DATABASE_URL}" ]] || {
  echo "Compose did not preserve the catalog database URL exactly" >&2
  exit 1
}

echo "Pokemon PostgreSQL runtime environment test passed"
