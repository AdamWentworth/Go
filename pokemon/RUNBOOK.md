# Pokemon Service Runbook

This runbook is for one-host Docker deployments (no Ansible required).

## Deployment Model

Prefer:

1. Build once in CI.
2. Push image to DockerHub.
3. Deploy by immutable image digest on prod.

Avoid building directly on prod unless you are troubleshooting.

## CI DockerHub Push Prerequisites

Set these in GitHub Actions:

- Secret: `DOCKERHUB_TOKEN` (DockerHub access token)

The CI workflow currently pushes to a hardcoded image repository:
`adamwentworth/pokemon_service_go`.

The workflow tags and pushes:

- `adamwentworth/pokemon_service_go:sha-<git-sha>`
- `adamwentworth/pokemon_service_go:latest`

## Deploy By Digest

After CI publishes, grab the pushed digest and deploy exactly that image:

```bash
docker pull <user>/<repo>:sha-<git-sha>
docker inspect --format='{{index .RepoDigests 0}}' <user>/<repo>:sha-<git-sha>
```

Use the digest in your compose/image reference.

## Rollback

Keep the previous known-good digest in your release notes.

Rollback steps:

1. Update service image to previous digest.
2. Restart only the pokemon container.
3. Verify:
   - `GET /healthz` returns `200`
   - `GET /readyz` returns `200`
   - Prometheus target `pokemon_data` is `up`

## Catalog PostgreSQL Operations

`pokemon_data` reads the reference catalog from the dedicated
`pokemon_catalog_db` PostgreSQL container. The runtime account is
`pokemon_catalog_reader`; catalog authoring uses the separate
`pokemon_catalog_publisher` role through the editor launcher documented in
`editor/README.md`.

Normal API deployments apply any pending migrations through
`go run ./cmd/catalog-migrate` before recreating the API container. They do not
replace catalog records.

Before every production editor session, the launcher creates a compressed dump
in `/srv/pokegonexus/pokemon/catalog-backups`. The newest eight editor-session
dumps are retained by default. To refresh the API cache manually after an
interrupted editor session, run:

```bash
ssh -i "$HOME/.ssh/pokegonexus_recovery_ed25519" adam@192.168.1.77 \
  'bash -s -- /srv/pokegonexus' \
  < ops/pokemon-catalog/refresh-api-cache-prod.sh
```

Recovery uses the retained private PostgreSQL dumps and the two independently
verified cutover archives. Catalog binaries are not tracked or released from
the public repository.

## Redis L2 Cache Operations

`pokemon_cache` is a private, non-persistent Redis service used only to avoid
rebuilding serialized catalog payloads when an API process starts. It is not a
database and does not require backup or restore procedures. The API remains
ready when Redis is unavailable and falls back to memory and PostgreSQL.

Check the service and memory policy:

```bash
docker compose -f /srv/pokegonexus/pokemon/docker-compose.yml \
  --env-file /srv/pokegonexus/pokemon/.env ps pokemon_cache
docker exec pokemon_cache redis-cli INFO memory
docker exec pokemon_cache redis-cli CONFIG GET maxmemory maxmemory-policy
```

Inspect cache behavior through the API metrics rather than treating Redis key
contents as a public contract:

```bash
curl -fsS http://127.0.0.1:3001/internal/cache/stats
curl -fsS http://127.0.0.1:3001/metrics | grep pokemon_catalog_cache
```

To prove fallback behavior during maintenance, stop Redis and verify the API
before starting it again:

```bash
docker stop pokemon_cache
curl -fsS https://pokegonexus.com/api/pokemon/manifest >/dev/null
docker start pokemon_cache
```

After Redis restarts, an existing API process continues serving its L1 memory
cache and repopulates L2 on the next catalog refresh. Restarting the API also
rebuilds any missing Redis payloads from PostgreSQL. Do not make `/readyz`
depend on Redis and do not add persistence to this cache.

## PvP Data Refresh

The catalog keeps two independently versioned PvP inputs:

- Niantic Game Master move stats and legal move pools, mirrored by PokeMiners.
- PvPoke's MIT-licensed Great, Ultra, and Master League simulation rankings.

From `editor/`, audit current move data without writing:

```bash
./.venv/bin/python ../pokemon/scripts/refresh_game_master_moves.py
```

Apply only after reviewing the reported move and assignment counts:

```bash
./.venv/bin/python ../pokemon/scripts/refresh_game_master_moves.py --apply
```

After catalog migration `0006_pvp_rankings.sql` is deployed, import the current
PvPoke commit:

```bash
./.venv/bin/python ../pokemon/scripts/import_pvpoke_rankings.py
```

Both production commands use the editor's retained-backup SSH session, refresh
and prewarm the API cache on success, and leave source version and license
metadata in the published `/pokemon/pvp-data` payload. The importer filters
unreleased or locally unsupported forms instead of publishing entries the app
cannot display.

### PvP simulator parity

`internal/pvp` is PokeGoNexus's deterministic Go implementation of the
PvPoke ranking simulation used by the active snapshot. It covers:

- legacy turn resolution, CMP, fast-move interruption, shields, damage, and
  deterministic move effects;
- charged-move selection, baiting, farming, move timing, and self-debuff
  handling;
- lead, closer, switch, charger, and attacker ranking scenarios;
- matchup weighting, score normalization, moveset consistency, and overall
  aggregation.

Production continues to serve the imported snapshot as the fallback until the
local generator is validated over complete Great, Ultra, and Master League
rosters. The current engine ranks a supplied fixed moveset, matching PvPoke's
published `force` workflow. Automatic discovery of a new optimal moveset is not
part of this implementation.

The differential fixture is pinned to PvPoke commit
`f59fc0a2c78ace0b4d3b1bdcd161880e3287e4e0`. It contains more than 400 exact
published matchup ratings and 100 exact overall-score cases. Regenerate it only
from a checkout at that commit:

```bash
python3 scripts/generate_pvpoke_parity_fixture.py \
  --pvpoke-dir /path/to/pvpoke \
  --output internal/pvp/testdata/pvpoke-ranking-matchups-v1.json
go test ./internal/pvp -count=1
```

For a single failing matchup, run the pinned JavaScript engine locally and
compare its timeline with the Go test:

```bash
node scripts/run_pvpoke_matchup_oracle.js \
  /path/to/pvpoke 1500 chargers malamar_shadow tinkaton
```

The oracle script is a development tool. It is never called by the API or
shipped in the service image.

The parity target deliberately excludes species that use PvPoke's dynamic form
change or native stat-buff extensions. `MechanicsCurrent` also fails closed:
the June 2026 Trainer Battle timing changes require their own validated model
and must not silently reuse the pinned legacy rules.
