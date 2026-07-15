#!/usr/bin/env bash
set -euo pipefail

deploy_root="${1:-/srv/pokegonexus}"
pokemon_dir="${deploy_root}/pokemon"
database_env_file="${CATALOG_DATABASE_ENV_FILE:-${pokemon_dir}/catalog-db.env}"
reader_env_file="${CATALOG_READER_ENV_FILE:-${pokemon_dir}/catalog-postgres.env}"
reader_host="${CATALOG_READER_HOST:-pokemon_catalog_db}"
reader_port="${CATALOG_READER_PORT:-5432}"
parity_host="${CATALOG_PARITY_HOST:-127.0.0.1}"
tmp_file=""

fail() {
  echo "pokemon catalog reader settings repair error: $*" >&2
  exit 1
}

if [[ "${EUID}" -ne 0 && "${CATALOG_READER_REPAIR_TEST:-}" != "1" ]]; then
  fail "run this repair through sudo"
fi
[[ -f "${database_env_file}" ]] || fail "catalog database settings are missing: ${database_env_file}"
[[ -f "${reader_env_file}" ]] || fail "catalog reader settings are missing: ${reader_env_file}"

set -a
# shellcheck disable=SC1090
source "${database_env_file}"
# shellcheck disable=SC1090
source "${reader_env_file}"
set +a

for required in CATALOG_DATABASE_URL CATALOG_POSTGRES_HOST_PORT; do
  [[ -n "${!required:-}" ]] || fail "${required} is missing from the existing catalog settings"
done

reader_host_port="@${reader_host}:${reader_port}/"
parity_host_port="@${parity_host}:${CATALOG_POSTGRES_HOST_PORT}/"
[[ "${CATALOG_DATABASE_URL}" == *"${reader_host_port}"* ]] || fail "reader URL does not use expected internal host ${reader_host}:${reader_port}"
parity_url="${CATALOG_DATABASE_URL/${reader_host_port}/${parity_host_port}}"

tmp_file="$(mktemp "${reader_env_file}.repair.XXXXXX")"
trap 'rm -f "${tmp_file}"' EXIT
awk '!/^CATALOG_PARITY_DATABASE_URL=/' "${reader_env_file}" > "${tmp_file}"
printf 'CATALOG_PARITY_DATABASE_URL=%q\n' "${parity_url}" >> "${tmp_file}"
chmod 640 "${tmp_file}"

if [[ -n "${SUDO_USER:-}" ]]; then
  runtime_group="$(id -gn "${SUDO_USER}")"
  if [[ "${EUID}" -eq 0 ]]; then
    chown root:"${runtime_group}" "${tmp_file}"
  fi
elif [[ "${EUID}" -eq 0 ]]; then
  chown root:root "${tmp_file}"
else
  chown "$(id -un)":"$(id -gn)" "${tmp_file}"
fi
mv "${tmp_file}" "${reader_env_file}"
trap - EXIT

echo "Repaired reader settings for PostgreSQL runtime parity."
echo "Reader settings: ${reader_env_file}"
