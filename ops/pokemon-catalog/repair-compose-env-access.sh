#!/usr/bin/env bash
set -euo pipefail

deploy_root="${1:-/srv/pokegonexus}"
pokemon_dir="${deploy_root}/pokemon"
database_env_file="${CATALOG_DATABASE_ENV_FILE:-${pokemon_dir}/catalog-db.env}"
publisher_env_file="${CATALOG_PUBLISHER_ENV_FILE:-${pokemon_dir}/catalog-publisher.env}"
reader_env_file="${CATALOG_READER_ENV_FILE:-${pokemon_dir}/catalog-postgres.env}"

fail() {
  echo "pokemon catalog Compose access repair error: $*" >&2
  exit 1
}

if [[ "${EUID}" -ne 0 && "${CATALOG_COMPOSE_ACCESS_REPAIR_TEST:-}" != "1" ]]; then
  fail "run this repair through sudo"
fi
if [[ -z "${SUDO_USER:-}" && "${EUID}" -eq 0 ]]; then
  fail "run this repair from the deployment-runner account through sudo"
fi

for env_file in "${database_env_file}" "${publisher_env_file}" "${reader_env_file}"; do
  [[ -f "${env_file}" ]] || fail "catalog environment file is missing: ${env_file}"
done

runtime_group="$(id -gn "${SUDO_USER:-$(id -un)}")"
if [[ "${EUID}" -eq 0 ]]; then
  chown root:"${runtime_group}" "${database_env_file}" "${publisher_env_file}" "${reader_env_file}"
fi
chmod 640 "${database_env_file}" "${publisher_env_file}" "${reader_env_file}"

echo "Granted the Docker deployment runner group read access to private catalog Compose env files."
for env_file in "${database_env_file}" "${publisher_env_file}" "${reader_env_file}"; do
  stat -c '%n mode=%a owner=%U group=%G' "${env_file}"
done
