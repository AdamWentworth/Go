# 📡 Events Service (SSE + Kafka Reader)

Real-time reader service for client sync and live updates.

It:

- consumes `batchedUpdates` from Kafka
- streams live deltas to connected clients over SSE
- serves pull-based updates for reconnect/sync flows

## ✅ What This Service Does

- 🔐 Protects API routes with JWT cookie auth (`accessToken`)
- 🌐 Enforces CORS allowlist from `ALLOWED_ORIGINS`
- ❤️ Exposes `GET /healthz`, `GET /readyz`, and `GET /metrics`
- 📥 Consumes Kafka updates from topic `batchedUpdates`
- 📤 Broadcasts transformed updates to active SSE clients
- 🧠 Applies in-memory trade completion swap projection for SSE output
- 🐳 Runs as a loopback-bound container (`127.0.0.1:3008`)

## 🛣️ API Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/healthz` | No | Liveness check |
| GET | `/readyz` | No | Readiness check (DB ping) |
| GET | `/metrics` | No | Prometheus metrics endpoint |
| GET | `/api/sse?device_id=<id>` | Yes | Open SSE stream |
| GET | `/api/getUpdates?timestamp=<ms>&device_id=<id>` | Yes | Pull updates since timestamp |

## 🧭 Service Context (Mermaid)

```mermaid
flowchart LR
  Client[Web or Mobile Client]
  Nginx[frontend_nginx]
  Events[events_service]
  Receiver[receiver_service]
  Kafka[(Kafka topic batchedUpdates)]
  MySQL[(MySQL user_pokemon_management)]

  Client -->|GET /api/sse| Nginx
  Client -->|GET /api/getUpdates| Nginx
  Nginx --> Events

  Receiver -->|produce updates| Kafka
  Kafka -->|consume as sse_consumer_group| Events
  Events -->|read users, instances, trades| MySQL
  Events -->|SSE data| Client
```

## 🔄 Live Update Flow (UML Sequence)

```mermaid
sequenceDiagram
  participant C as Client
  participant N as frontend_nginx
  participant E as events_service
  participant K as Kafka
  participant R as receiver_service
  participant D as MySQL

  C->>N: GET /api/sse?device_id=...
  N->>E: Forward request with JWT cookie
  E-->>C: SSE connected event

  R->>K: Produce batchedUpdates (gzip payload)
  K-->>E: FetchMessage
  E->>E: Decompress + transform message
  E->>D: Query users/instances/trades as needed
  E-->>C: SSE data event (excluding same device_id)

  C->>N: GET /api/getUpdates?timestamp=...
  N->>E: Forward request
  E->>D: Query deltas by user_id and last_update
  E-->>C: JSON response with pokemon, trade, relatedInstances
```

## 🧱 Domain Model (UML Class)

```mermaid
classDiagram
  class AccessTokenClaims {
    +string UserID
    +string Username
    +string DeviceID
    +RegisteredClaims
  }

  class Client {
    +string UserID
    +string DeviceID
    +chan Channel
    +bool Connected
  }

  class User {
    +string UserID
    +string Username
    +float64 Latitude
    +float64 Longitude
  }

  class PokemonInstance {
    +string InstanceID
    +string UserID
    +int PokemonID
    +bool IsCaught
    +bool IsForTrade
    +bool IsWanted
    +bool MostWanted
    +int64 LastUpdate
  }

  class Trade {
    +string TradeID
    +string UserIDProposed
    +string UserIDAccepting
    +string TradeStatus
    +int64 LastUpdate
  }

  class Config {
    +EventsConfig Events
  }

  class EventsConfig {
    +string Hostname
    +string Port
    +string Topic
    +int MaxRetries
    +int RetryInterval
  }

  Config --> EventsConfig
  Client --> AccessTokenClaims
  PokemonInstance --> User
```

## ⚙️ Configuration

Set `reader/events/.env`:

```env
PORT=3008
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://pokemongonexus.com,https://www.pokemongonexus.com

JWT_SECRET=...

DB_USER=adam
DB_PASSWORD=...
DB_HOSTNAME=mysql_storage
DB_PORT=3306
DB_NAME=user_pokemon_management

LOG_LEVEL=info

KAFKA_HOSTNAME=kafka
KAFKA_PORT=9092
KAFKA_TOPIC=batchedUpdates
KAFKA_MAX_RETRIES=5
KAFKA_RETRY_INTERVAL=3

# Backward-compatible fallback for older config readers
HOST_IP=127.0.0.1
```

Notes:

- `KAFKA_*` env vars override values from `config/app_conf.yml`.
- `HOST_IP` is only a backward-compatible fallback for Kafka hostname.
- `JWT_SECRET` is required for protected routes.

## 🧪 Quality Gates

Local checks:

```bash
cd reader/events
go test ./...
go test -cover ./...
go vet ./...
go run golang.org/x/vuln/cmd/govulncheck@latest ./...
```

CI:

- workflow: `.github/workflows/ci-events.yml`
- includes test, coverage gate, vet, govulncheck, Trivy scans, SBOM, optional DockerHub push

## 🚀 Run Locally

```bash
cd reader/events
go run .
```

## 🐳 Run With Docker Compose

```bash
cd reader/events
docker compose up -d
```

Compose behavior:

- binds to `127.0.0.1:3008`
- healthcheck hits `/readyz`
- joins external network `kafka_default`

## 🛠️ CD Workflow

- workflow: `.github/workflows/deploy-events-prod.yml`
- dispatch inputs:
  - `image_ref` (`latest`, `sha-<commit>`, or full image ref)
  - `deploy_root` (default `/media/adam/storage/Code/Go`)
  - `service_name` (default `events_service`)
- deploy behavior:
  - sync git repo on prod runner
  - preflight env/network checks
  - rollout with readiness check (`http://127.0.0.1:3008/readyz`)
  - auto rollback to previous image on failure

## 🔍 Quick Verification

```bash
curl -i http://127.0.0.1:3008/healthz
curl -i http://127.0.0.1:3008/readyz
curl -i http://127.0.0.1:3008/metrics
```
