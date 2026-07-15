#!/usr/bin/env bash
set -euo pipefail

container_name="${POKEMON_DATA_CONTAINER:-pokemon_data_container}"

fail() {
  echo "pokemon catalog cache refresh error: $*" >&2
  exit 1
}

docker inspect "${container_name}" >/dev/null 2>&1 || fail "Pokemon API container is not running: ${container_name}"

# The internal API guard deliberately does not trust the Docker host. Run this
# work inside the API container over loopback instead. An optional token is
# expanded only inside that container, never printed or exposed in host args.
docker exec "${container_name}" sh -ec '
  base_url="http://127.0.0.1:3001"
  if [ -n "${CACHE_REFRESH_TOKEN:-}" ]; then
    wget -q -O /dev/null \
      --header="X-Cache-Refresh-Token: ${CACHE_REFRESH_TOKEN}" \
      --post-data="" \
      "${base_url}/internal/cache/refresh"
  else
    wget -q -O /dev/null --post-data="" "${base_url}/internal/cache/refresh"
  fi

  # Rebuild every chunk before returning so the editor never leaves the API in
  # a temporary cache-not-ready state after a successful catalog edit.
  wget -q -O /dev/null "${base_url}/pokemon/manifest"
  wget -q -O /dev/null "${base_url}/readyz"
'

echo "Pokemon API catalog cache refreshed and prewarmed."
