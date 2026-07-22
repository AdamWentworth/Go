#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
coverprofile="${1:-}"
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

docker exec -i "${container_name}" \
  psql -v ON_ERROR_STOP=1 -U catalog -d pokemon_catalog_test >/dev/null <<'SQL'
CREATE ROLE pokemon_catalog_reader NOLOGIN;
SQL

(
  cd "${repo_root}/pokemon"
  go run ./cmd/catalog-migrate --database-url "${database_url}" >/dev/null
)
docker exec -i "${container_name}" \
  psql -v ON_ERROR_STOP=1 -U catalog -d pokemon_catalog_test < "${fixture_path}" >/dev/null

# A migration must remain deployable through the publisher while immediately
# exposing its new tables to the least-privileged API role.
docker exec -i "${container_name}" \
  psql -v ON_ERROR_STOP=1 -U catalog -d pokemon_catalog_test >/dev/null <<'SQL'
SET ROLE pokemon_catalog_reader;
SELECT COUNT(*) FROM pokemon_catalog.max_battle_tiers;
SELECT COUNT(*) FROM pokemon_catalog.max_battle_profiles;
RESET ROLE;
SQL

(
  cd "${repo_root}/pokemon"
  test_args=(-count=1 -tags=integration)
  if [[ -n "${coverprofile}" ]]; then
    test_args+=("-coverprofile=${coverprofile}")
  fi
  POSTGRES_TEST_URL="${database_url}" go test "${test_args[@]}" ./internal/builder
)

# Prove that the authored Super Mega roster can be applied repeatedly without
# duplicating rows or erasing editor-managed images.
docker exec -i "${container_name}" \
  psql -v ON_ERROR_STOP=1 -U catalog -d pokemon_catalog_test >/dev/null <<'SQL'
SET search_path = pokemon_catalog, public;

INSERT INTO types (type_id, name, icon_url) VALUES
  (101, 'Electric', '/images/types/Electric.png'),
  (102, 'Dark', '/images/types/Dark.png'),
  (103, 'Steel', '/images/types/Steel.png');

WITH desired (pokemon_id, name, type_1_name, type_2_name) AS (
  VALUES
    (26, 'Raichu', 'Electric', NULL),
    (71, 'Victreebel', 'Grass', 'Poison'),
    (121, 'Starmie', 'Water', 'Psychic'),
    (149, 'Dragonite', 'Dragon', 'Flying'),
    (227, 'Skarmory', 'Steel', 'Flying'),
    (687, 'Malamar', 'Dark', 'Psychic'),
    (870, 'Falinks', 'Fighting', NULL)
)
INSERT INTO pokemon (
  pokemon_id, name, pokedex_number, attack, defense, stamina, type_1_id,
  type_2_id, available, shiny_available, date_available
)
SELECT desired.pokemon_id,
       desired.name,
       desired.pokemon_id,
       100,
       100,
       100,
       type_1.type_id,
       type_2.type_id,
       TRUE,
       TRUE,
       '2026-01-01'
FROM desired
JOIN types type_1 ON LOWER(type_1.name) = LOWER(desired.type_1_name)
LEFT JOIN types type_2 ON LOWER(type_2.name) = LOWER(desired.type_2_name);
SQL

for _ in 1 2; do
  docker exec -i "${container_name}" \
    psql -v ON_ERROR_STOP=1 -U catalog -d pokemon_catalog_test \
    < "${repo_root}/pokemon/scripts/sql/20260717_super_mega_raid_roster.sql" >/dev/null
done

docker exec -i "${container_name}" \
  psql -v ON_ERROR_STOP=1 -U catalog -d pokemon_catalog_test >/dev/null <<'SQL'
SET search_path = pokemon_catalog, public;

DO $$
DECLARE
  roster_mega_count INTEGER;
  roster_raid_count INTEGER;
  roster_cp_count INTEGER;
  populated_new_images INTEGER;
BEGIN
  SELECT COUNT(*) INTO roster_mega_count
  FROM mega_evolution
  WHERE pokemon_id IN (26, 71, 121, 149, 150, 227, 687, 870);

  SELECT COUNT(*) INTO roster_raid_count
  FROM raid_bosses
  WHERE LOWER(COALESCE(tier, '')) = 'super_mega';

  SELECT COUNT(*) INTO roster_cp_count
  FROM mega_cp_stats cp
  JOIN mega_evolution me ON me.id = cp.mega_id
  WHERE me.pokemon_id IN (26, 71, 121, 149, 150, 227, 687, 870)
    AND cp.level_id IN (40, 50);

  SELECT COUNT(*) INTO populated_new_images
  FROM mega_evolution
  WHERE pokemon_id IN (26, 71, 121, 149, 227, 687, 870)
    AND image_url IS NOT NULL
    AND image_url_shiny IS NOT NULL
    AND sprite_url IS NULL;

  IF roster_mega_count <> 10 OR roster_raid_count <> 10 OR roster_cp_count <> 20 THEN
    RAISE EXCEPTION 'unexpected Super Mega roster counts (mega %, raid %, CP %)',
      roster_mega_count, roster_raid_count, roster_cp_count;
  END IF;

  IF populated_new_images <> 8 THEN
    RAISE EXCEPTION 'new authored images are missing: % of 8 populated', populated_new_images;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM mega_evolution
    WHERE pokemon_id = 150 AND form = 'X'
      AND image_url = '/images/mega/mega_150_X.png?v=f8169f5'
  ) THEN
    RAISE EXCEPTION 'idempotent roster update overwrote an existing Mega image';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM raid_bosses
    WHERE pokemon_id = 227 AND tier = 'super_mega' AND shield_count = 7
  ) OR NOT EXISTS (
    SELECT 1 FROM raid_bosses
    WHERE pokemon_id = 870 AND tier = 'super_mega' AND shield_count = 8
  ) THEN
    RAISE EXCEPTION 'released Super Mega shield counts are incorrect';
  END IF;

  IF EXISTS (
    SELECT 1 FROM raid_bosses
    WHERE pokemon_id IN (26, 121) AND tier = 'super_mega' AND shield_count IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'future unconfirmed shield counts must remain NULL';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM mega_evolution me
    JOIN mega_cp_stats cp ON cp.mega_id = me.id
    WHERE me.pokemon_id = 121 AND me.form IS NULL
      AND cp.level_id = 50 AND cp.cp = 4184
  ) THEN
    RAISE EXCEPTION 'Mega Starmie level-50 CP is missing or incorrect';
  END IF;
END $$;
SQL
