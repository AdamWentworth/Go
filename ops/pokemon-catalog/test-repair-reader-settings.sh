#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
work_dir="$(mktemp -d)"
trap 'rm -rf "${work_dir}"' EXIT

pokemon_dir="${work_dir}/pokemon"
mkdir -p "${pokemon_dir}"
cat > "${pokemon_dir}/catalog-db.env" <<'EOF'
CATALOG_POSTGRES_HOST_PORT=5433
EOF
cat > "${pokemon_dir}/catalog-postgres.env" <<'EOF'
CATALOG_DATABASE_URL=postgres://pokemon_catalog_reader:reader-secret@pokemon_catalog_db:5432/pokemon_catalog?sslmode=disable
EOF

CATALOG_READER_REPAIR_TEST=1 bash "${repo_root}/ops/pokemon-catalog/repair-reader-settings.sh" "${work_dir}"

set -a
# shellcheck disable=SC1090
source "${pokemon_dir}/catalog-postgres.env"
set +a
[[ "${CATALOG_PARITY_DATABASE_URL}" == 'postgres://pokemon_catalog_reader:reader-secret@127.0.0.1:5433/pokemon_catalog?sslmode=disable' ]] || {
  echo "reader parity URL was not derived correctly" >&2
  exit 1
}
[[ "$(stat -c '%a' "${pokemon_dir}/catalog-postgres.env")" == "640" ]] || {
  echo "reader settings were not restricted to mode 640" >&2
  exit 1
}

echo "Pokemon reader settings repair test passed"
