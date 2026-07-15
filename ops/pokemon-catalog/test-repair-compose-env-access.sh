#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
work_dir="$(mktemp -d)"
trap 'rm -rf "${work_dir}"' EXIT

pokemon_dir="${work_dir}/pokemon"
mkdir -p "${pokemon_dir}"
for name in catalog-db.env catalog-publisher.env catalog-postgres.env; do
  printf 'PRIVATE_%s=value\n' "${name}" > "${pokemon_dir}/${name}"
  chmod 600 "${pokemon_dir}/${name}"
done

CATALOG_COMPOSE_ACCESS_REPAIR_TEST=1 bash "${repo_root}/ops/pokemon-catalog/repair-compose-env-access.sh" "${work_dir}"

for name in catalog-db.env catalog-publisher.env catalog-postgres.env; do
  [[ "$(stat -c '%a' "${pokemon_dir}/${name}")" == "640" ]] || {
    echo "${name} was not set to mode 640" >&2
    exit 1
  }
done

echo "Pokemon catalog Compose environment access repair test passed"
