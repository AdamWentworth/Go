#!/usr/bin/env bash
set -euo pipefail

deploy_root="${1:-/srv/pokegonexus}"
pokemon_dir="${deploy_root}/pokemon"
env_file="${pokemon_dir}/.env"
container_name="${POKEMON_DATA_CONTAINER:-pokemon_data_container}"

fail() {
  echo "pokemon catalog cache refresh error: $*" >&2
  exit 1
}

[[ -f "${env_file}" ]] || fail "Pokemon environment file is missing: ${env_file}"
docker inspect "${container_name}" >/dev/null 2>&1 || fail "Pokemon API container is not running: ${container_name}"

set -a
# shellcheck disable=SC1090
source "${env_file}"
set +a

[[ -n "${CACHE_REFRESH_TOKEN:-}" ]] || fail "CACHE_REFRESH_TOKEN is missing from ${env_file}"

container_ip="$(docker inspect -f '{{with index .NetworkSettings.Networks "pokemon_edge"}}{{.IPAddress}}{{end}}' "${container_name}")"
[[ -n "${container_ip}" ]] || fail "could not resolve ${container_name} on pokemon_edge"

base_url="http://${container_ip}:3001"
curl --fail --silent --show-error --max-time 15 \
  -X POST \
  -H "X-Cache-Refresh-Token: ${CACHE_REFRESH_TOKEN}" \
  "${base_url}/internal/cache/refresh" >/dev/null

# Rebuild every chunk before returning so the editor never leaves the API in a
# temporary cache-not-ready state after a successful catalog edit.
curl --fail --silent --show-error --max-time 90 "${base_url}/pokemon/manifest" >/dev/null
curl --fail --silent --show-error --max-time 15 "${base_url}/readyz" >/dev/null

echo "Pokemon API catalog cache refreshed and prewarmed."
