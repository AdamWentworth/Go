#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
python_bin="${PYTHON_BIN:-python3}"
container_name="${EDITOR_POSTGRES_TEST_CONTAINER:-pokegonexus_editor_catalog_test}"
postgres_port="${EDITOR_POSTGRES_TEST_PORT:-55432}"
postgres_password="editor_test_password"
postgres_url="postgresql://editor_test:${postgres_password}@127.0.0.1:${postgres_port}/pokemon_catalog?sslmode=disable"
postgres_image="postgres@sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193"

cleanup() {
  docker rm -f "${container_name}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup
docker run -d --name "${container_name}" \
  -e POSTGRES_USER=editor_test \
  -e POSTGRES_PASSWORD="${postgres_password}" \
  -e POSTGRES_DB=pokemon_catalog \
  -p "127.0.0.1:${postgres_port}:5432" \
  "${postgres_image}" >/dev/null

ready=0
for _ in $(seq 1 45); do
  if [[ "$(docker exec "${container_name}" psql -U editor_test -d pokemon_catalog -Atc 'SELECT 1' 2>/dev/null || true)" == "1" ]]; then
    ready=1
    break
  fi
  sleep 1
done
if [[ "${ready}" -ne 1 ]]; then
  docker logs "${container_name}" >&2 || true
  exit 1
fi

(
  cd "${repo_root}/pokemon"
  go run ./cmd/catalog-import \
    --sqlite ./data/pokego.db \
    --database-url "${postgres_url}" \
    --release-id editor-postgres-manager-test \
    --source-label editor-postgres-manager-test >/dev/null
  go run ./cmd/catalog-migrate --database-url "${postgres_url}" >/dev/null
)

EDITOR_POSTGRES_TEST_URL="${postgres_url}" \
  "${python_bin}" "${repo_root}/editor/tests/test_postgres_database_manager.py"
