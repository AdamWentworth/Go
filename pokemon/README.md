# Pokemon Catalog Service

This Go service publishes the PokeGo Nexus reference catalog. PostgreSQL is
the sole catalog store. The API builds a complete browser payload from the
dedicated `pokemon_catalog_db` container and keeps the serialized result in an
in-process cache.

## Local Development

Start the database and API together:

```bash
docker compose up --build pokemon_catalog_db pokemon_data
```

Or run the API against an existing catalog:

```bash
export CATALOG_DATABASE_URL='postgresql://user:password@127.0.0.1:5433/pokemon_catalog'
go run ./cmd/catalog-migrate
go run ./cmd/pokemon
```

The API listens on `PORT` (default `3001`). Important endpoints are:

- `GET /healthz`: process health
- `GET /readyz`: catalog connectivity and cache readiness
- `GET /pokemon/pokemons`: complete catalog payload
- `POST /internal/cache/refresh`: protected cache refresh for catalog authoring

## Configuration

- `CATALOG_DATABASE_URL`: required PostgreSQL reader URL
- `PORT`: HTTP port
- `CACHE_REFRESH_TOKEN`: protects the internal cache refresh endpoint
- `DB_MAX_OPEN_CONNS`, `DB_MAX_IDLE_CONNS`, `DB_CONN_MAX_LIFETIME`: pool controls

Credentials live in private production environment files and are never
committed.

## Schema And Deployment

Versioned schema changes live in `migrations/`. Production deployment runs
`go run ./cmd/catalog-migrate` before recreating the API container. Migrations
are idempotent and recorded in `pokemon_catalog.schema_migrations`.

The service and its dedicated database are defined together in
`docker-compose.yml`. Catalog data persists in the
`pokemon_catalog_pgdata` named volume.

## Catalog Authoring

Use the Tkinter editor from `../editor`:

```bash
cd ../editor
python main.py
```

The editor opens an SSH tunnel to the publisher role, creates a private dump
before authoring, and refreshes the API cache after a normal exit. Maintenance
scripts use the same authoring session by default.

## Tests

```bash
go test ./...
bash scripts/test-postgres-catalog.sh
```

The contract test starts an isolated PostgreSQL container, applies the real
migrations, loads a small synthetic fixture, and verifies the browser payload.

Operational details are in [RUNBOOK.md](RUNBOOK.md) and
`../ops/pokemon-catalog/README.md`.
