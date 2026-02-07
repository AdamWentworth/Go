# Pokemon Data Service (Go) 🐉

Production Pokemon API service for Pokemon Go Nexus, implemented in Go (`net/http` + `chi`) as the replacement for the legacy Node `pokemon_data` runtime.

## ✨ Highlights

- Fast in-memory response cache for `/pokemon/pokemons` (JSON + gzip + ETag)
- Startup prewarm support for lower first-request latency
- Health and readiness probes for deployment safety
- Internal endpoint protection via CIDR allowlist
- Production-focused CI/CD gates and rollback-ready deploy flow

## 🔌 Endpoints

- `GET /pokemon/pokemons`
- `GET /healthz`
- `GET /readyz`
- `GET /metrics` (internal-only when enabled)
- `GET /internal/cache/stats` (internal-only when enabled)
- `POST /internal/cache/refresh` (internal-only when enabled, optional token)

## ⚙️ Environment Variables

### Core

- `PORT` (default `3001`)
- `SQLITE_PATH` (default `./data/pokego.db`)
- `LOG_LEVEL` (`DEBUG`, `INFO`, `WARN`, `ERROR`)

### Cache

- `CACHE_PREWARM` (default `true`)
- `CACHE_BUILD_TIMEOUT` (default `60s`)
- `CACHE_REFRESH_TOKEN` (optional)

### CORS

- `ALLOWED_ORIGINS` (CSV list)
- `ALLOW_CLOUDFLARE_SUBDOMAINS` (default `true`)

### Internal Access Controls

- `INTERNAL_ONLY_ENABLED` (default enabled in production)
- `INTERNAL_ONLY_CIDRS` (CSV CIDR list for `/metrics` and `/internal/*`)
- `TRUSTED_PROXY_CIDRS` (CSV CIDR list for trusted proxy hops)

### Rate Limiting

- `RATE_LIMIT_ENABLED`
- `RATE_LIMIT_RPS`
- `RATE_LIMIT_BURST`

## 🧪 Local Run

```bash
cd Go/pokemon
go mod tidy
go run ./cmd/pokemon
```

Service default URL:

- `http://localhost:3001/pokemon/pokemons`

## 🐳 Docker + Networking

`pokemon`, `nginx`, and `monitoring` share a dedicated external Docker network named `pokemon_edge`.

Create once per host:

```bash
docker network create --driver bridge --subnet 172.30.0.0/24 --gateway 172.30.0.1 pokemon_edge
```

Compose:

```bash
cd Go/pokemon
docker compose up -d
```

## 🚀 Deployment Notes

- Current production deploy is automated via GitHub Actions manual CD (`deploy-pokemon-prod`).
- Service is deployed from `Go/pokemon` and replaces the runtime container name `pokemon_data_container`.
- Legacy Node `pokemon_data` code/image can still be used for rollback if needed.

## 🩺 Troubleshooting

- `502` via frontend usually means nginx upstream/network mismatch.
- Failing readiness often means DB path/permissions issue on `./data/pokego.db`.
- Confirm health quickly:

```bash
curl -i http://localhost:3001/healthz
curl -i http://localhost:3001/readyz
```

## 📚 Operations

- Runbook: `pokemon/RUNBOOK.md`
- SQLite backup script: `pokemon/scripts/sqlite_backup.ps1`
- SQLite restore drill: `pokemon/scripts/sqlite_restore_drill.ps1`
