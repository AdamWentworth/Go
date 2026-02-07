# Pokémon Go Nexus Pokemon Data API (Go)

Go rewrite of the Node service using `net/http` + `chi` with:
- In-memory cache of the full `/pokemon/pokemons` payload (JSON + gzip + ETag)
- Optional cache prewarm on startup
- Manual cache refresh endpoint
- Simple CORS allowlist compatible with your current setup

## Endpoints

- `GET /pokemon/pokemons`
- `GET /healthz`
- `GET /internal/cache/stats`
- `POST /internal/cache/refresh` (optional token header)

## Environment

- `PORT` (default 3001)
- `SQLITE_PATH` (default `./data/pokego.db`)
- `CACHE_PREWARM` (default 1)
- `CACHE_BUILD_TIMEOUT` (default 60s)
- `CACHE_REFRESH_TOKEN` (optional; if set, require `X-Cache-Refresh-Token`)
- `ALLOWED_ORIGINS` (csv)
- `ALLOW_CLOUDFLARE_SUBDOMAINS` (default true)
- `LOG_LEVEL` (DEBUG/INFO/WARN/ERROR)

## Notes

This builder intentionally uses dynamic row scanning (`SELECT *`) for many tables so it can preserve extra DB columns without hard-coding the entire schema.

## Network Prerequisite

`pokemon/docker-compose.yml`, `nginx/docker-compose.yml`, and `monitoring/docker-compose.yml` share a dedicated external Docker network named `pokemon_edge`.

Create it once on each host before starting those services:

```bash
docker network create --driver bridge --subnet 172.30.0.0/24 --gateway 172.30.0.1 pokemon_edge
```
