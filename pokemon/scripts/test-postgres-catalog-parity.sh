#!/usr/bin/env bash
set -euo pipefail

container_name="pokegonexus-catalog-parity-${RANDOM}"
database_url="postgres://catalog:catalog-test-password@127.0.0.1:55432/pokemon_catalog_test?sslmode=disable"

cleanup() {
  docker rm -f "${container_name}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run --detach --rm --name "${container_name}" --tmpfs /var/lib/postgresql/data \
  -e POSTGRES_DB=pokemon_catalog_test \
  -e POSTGRES_USER=catalog \
  -e POSTGRES_PASSWORD=catalog-test-password \
  -p 127.0.0.1:55432:5432 postgres:17-alpine >/dev/null

for _ in $(seq 1 30); do
  if docker exec "${container_name}" pg_isready -U catalog -d pokemon_catalog_test >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "${container_name}" pg_isready -U catalog -d pokemon_catalog_test >/dev/null

go run ./cmd/catalog-import \
  --sqlite ./data/pokego.db \
  --database-url "${database_url}" \
  --release-id "catalog-parity-${GITHUB_SHA:-local}" \
  --source-label "sqlite-parity-source" >/dev/null

POSTGRES_TEST_URL="${database_url}" go test -count=1 -run TestPostgresPayloadParity ./internal/builder
