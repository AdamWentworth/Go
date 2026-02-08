# Pokemon Data Service (Go) 🐉

Production Pokemon API service for Pokemon Go Nexus, implemented in Go (`net/http` + `chi`) as the replacement for the legacy Node `pokemon_data` runtime.

## ✨ Highlights

- Fast in-memory response cache for `/pokemon/pokemons` (JSON + gzip + ETag)
- Startup prewarm support for lower first-request latency
- Health and readiness probes for safer deploys
- Internal endpoint protection via CIDR allowlist
- Production CI/CD gates with rollback-aware deployment

## 🔌 Endpoints

- `GET /pokemon/pokemons`
- `GET /healthz`
- `GET /readyz`
- `GET /metrics` (internal-only when enabled)
- `GET /internal/cache/stats` (internal-only when enabled)
- `POST /internal/cache/refresh` (internal-only when enabled, optional token)

## ⚙️ Environment Variables

### Minimal Production `.env` (recommended)

```env
PORT=3001
SQLITE_PATH=./data/pokego.db
ALLOWED_ORIGINS=https://pokemongonexus.com,https://www.pokemongonexus.com
INTERNAL_ONLY_ENABLED=true
INTERNAL_ONLY_CIDRS=127.0.0.0/8,::1/128,172.30.0.11/32
TRUSTED_PROXY_CIDRS=127.0.0.0/8,::1/128,172.30.0.10/32
```

### Minimal Local Dev `.env` (recommended)

```env
PORT=3001
SQLITE_PATH=./data/pokego.db
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
INTERNAL_ONLY_ENABLED=false
```

### Optional Runtime Knobs (safe to omit)

- `NODE_ENV` (default `production`)
- `ENV` (legacy fallback if `NODE_ENV` is unset)
- `LOG_LEVEL` (`DEBUG`, `INFO`, `WARN`, `ERROR`; default `INFO`)
- `JSON_PRETTY` (default true outside production)
- `CACHE_PREWARM` (default `true`)
- `CACHE_BUILD_TIMEOUT` (default `60s`)
- `CACHE_REFRESH_TOKEN` (optional, protects manual cache refresh endpoint)
- `ALLOW_CLOUDFLARE_SUBDOMAINS` (default `true`)
- `RATE_LIMIT_ENABLED` (default true in production)
- `RATE_LIMIT_RPS` (default `5`)
- `RATE_LIMIT_BURST` (default `10`)

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

## 📐 Architecture Diagrams

### 1) Request Path and Cache Lifecycle (Mermaid)

```mermaid
flowchart LR
  Client[Frontend or API client] -->|GET /pokemon/pokemons| Nginx[nginx reverse proxy]
  Nginx --> App[Pokemon Go service :3001]
  App --> Cache{Cache hit?}
  Cache -->|Yes| Hit[Return cached JSON/gzip + ETag]
  Cache -->|No| Build[Build full payload]
  Build --> DB[(SQLite pokego.db)]
  DB --> Build
  Build --> Store[Store JSON + gzip + ETag in cache]
  Store --> MissReturn[Return built response]

  Start[Service startup] --> Prewarm[Prewarm /pokemon/pokemons cache]
  Prewarm --> Build
```

### 2) Prod Container Topology (Mermaid)

```mermaid
flowchart TB
  User[Users / Browsers] -->|HTTPS 443| Nginx

  subgraph ProdHost[Prod Host Docker]
    subgraph PokemonEdge[pokemon_edge network]
      direction LR
      Nginx[frontend_nginx
      172.30.0.10]
      Pokemon[pokemon_data_container
      172.30.0.12:3001]
      Prom[prometheus
      172.30.0.11:9090]
      Alert[alertmanager
      172.30.0.13:9093]
    end
  end

  Nginx -->|/api/pokemon/*| Pokemon
  Prom -->|Scrape /metrics| Pokemon
  Prom -->|Send alerts| Alert
```

Kafka is not part of the Pokemon service request/data path. This service reads directly from SQLite and is called through nginx. `pokemon_edge` CIDR on prod is `172.30.0.0/24`.

### 3) CI -> CD -> Rollback Path (Mermaid)

```mermaid
flowchart LR
  Change[Push or PR touching pokemon/**] --> CI[pokemon-data-ci]
  CI --> Quality[Tests + SLO + Coverage + Lint + Vet + Govulncheck]
  Quality --> Security[Docker build + Trivy scans + SBOM]
  Security --> PushGate{DOCKERHUB_TOKEN set?}

  PushGate -->|Yes| Push[Push image tags:\nlatest and sha-commit]
  PushGate -->|No| Skip[Skip image push]

  Push --> Manual[Manual deploy-pokemon-prod]
  Skip --> Manual

  Manual --> Preflight[Git sync + compose/env/network preflight]
  Preflight --> Deploy[Compose deploy with selected image]
  Deploy --> Health{Readyz healthy?}
  Health -->|Yes| Done[Deploy success]
  Health -->|No| Rollback[Recreate with previous image]
```

### 4) UML Sequence: `GET /pokemon/pokemons` (Mermaid UML-style)

```mermaid
sequenceDiagram
  actor Browser
  participant N as nginx
  participant API as Pokemon Service
  participant C as Cache
  participant B as Builder
  participant DB as SQLite

  Browser->>N: GET /api/pokemon/pokemons
  N->>API: GET /pokemon/pokemons
  API->>C: lookup(route key)

  alt cache hit
    C-->>API: JSON + gzip + ETag
    API-->>N: 200 response
    N-->>Browser: 200 response
  else cache miss
    API->>B: build payload
    B->>DB: query rows
    DB-->>B: dataset
    B-->>API: payload
    API->>C: store(payload, etag, gzip)
    API-->>N: 200 response
    N-->>Browser: 200 response
  end
```

### 5) UML Class View: Core Components (Mermaid UML-style)

```mermaid
classDiagram
  class Router {
    +ServeHTTP()
  }

  class PokemonHandler {
    +GetPokemons()
    +Healthz()
    +Readyz()
    +Metrics()
  }

  class CacheStore {
    +Get(name)
    +Set(name, payload)
    +Refresh(name)
    +Stats()
  }

  class PayloadBuilder {
    +BuildFullPokemonPayload(ctx)
  }

  class SQLiteRepo {
    +QueryPokemonRows(ctx)
  }

  Router --> PokemonHandler : routes
  PokemonHandler --> CacheStore : read/write
  PokemonHandler --> PayloadBuilder : build on miss
  PayloadBuilder --> SQLiteRepo : fetch data
```

## 🚀 Deployment Notes

- Production deploy is automated via GitHub Actions manual CD (`deploy-pokemon-prod`).
- Service deploys from `Go/pokemon` and currently runs with container name `pokemon_data_container`.
- Existing image tags are pushed to `adamwentworth/pokemon_service_go`.
- Legacy Node `pokemon_data` image can be redeployed manually if rollback is ever needed.

## 🩺 Troubleshooting

- `502` from frontend usually means nginx upstream or Docker network mismatch.
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
