#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
container_name="pokegonexus-catalog-test-${RANDOM}"
database_url="postgres://catalog:catalog-test-password@127.0.0.1:55432/pokemon_catalog_test?sslmode=disable"
fixture_path="${repo_root}/editor/tests/postgres_catalog_fixture.sql"

cleanup() {
  docker rm -f "${container_name}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach --rm --name "${container_name}" --tmpfs /var/lib/postgresql/data \
  -e POSTGRES_DB=pokemon_catalog_test \
  -e POSTGRES_USER=catalog \
  -e POSTGRES_PASSWORD=catalog-test-password \
  -p 127.0.0.1:55432:5432 postgres:17-alpine >/dev/null

database_ready=0
for _ in $(seq 1 30); do
  if docker exec "${container_name}" \
    psql -v ON_ERROR_STOP=1 -U catalog -d pokemon_catalog_test -Atqc 'SELECT 1' >/dev/null 2>&1; then
    database_ready=1
    break
  fi
  sleep 1
done
if [[ "${database_ready}" -ne 1 ]]; then
  echo "ephemeral PostgreSQL catalog test database did not accept queries" >&2
  docker logs --tail 200 "${container_name}" >&2 || true
  exit 1
fi

(
  cd "${repo_root}/pokemon"
  go run ./cmd/catalog-migrate --database-url "${database_url}" >/dev/null
)
docker exec -i "${container_name}" \
  psql -v ON_ERROR_STOP=1 -U catalog -d pokemon_catalog_test < "${fixture_path}" >/dev/null

(
  cd "${repo_root}/pokemon"
  POSTGRES_TEST_URL="${database_url}" go test -count=1 -tags=integration ./internal/builder
)
