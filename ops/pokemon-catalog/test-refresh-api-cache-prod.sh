#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
work_dir="$(mktemp -d)"
bin_dir="${work_dir}/bin"
calls_file="${work_dir}/curl-calls"

cleanup() {
  rm -rf "${work_dir}"
}
trap cleanup EXIT

mkdir -p "${bin_dir}"

cat > "${bin_dir}/docker" <<'DOCKER'
#!/usr/bin/env bash
set -euo pipefail

arguments="$*"
printf '%s\n' "${arguments}" >> "${CACHE_REFRESH_CALLS_FILE}"
DOCKER
chmod +x "${bin_dir}/docker"

run_refresh() {
  : > "${calls_file}"
  PATH="${bin_dir}:${PATH}" \
  CACHE_REFRESH_CALLS_FILE="${calls_file}" \
  bash "${repo_root}/ops/pokemon-catalog/refresh-api-cache-prod.sh" /unused
}

run_refresh
grep -Fq 'inspect pokemon_data_container' "${calls_file}"
grep -Fq 'exec pokemon_data_container sh -ec' "${calls_file}"
grep -Fq 'base_url="http://127.0.0.1:3001"' "${calls_file}"
grep -Fq '${base_url}/internal/cache/refresh' "${calls_file}"
grep -Fq '${base_url}/pokemon/manifest' "${calls_file}"
grep -Fq '${base_url}/readyz' "${calls_file}"
grep -Fq 'X-Cache-Refresh-Token: ${CACHE_REFRESH_TOKEN}' "${calls_file}"
if grep -Fq '172.30.0.12' "${calls_file}"; then
  echo "cache refresh unexpectedly targets the host-visible container address" >&2
  exit 1
fi

echo "Pokemon API cache refresh helper test passed"
