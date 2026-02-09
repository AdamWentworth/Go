# 👤 Users Service

The users service provides profile and ownership-read APIs for the Pokemon app.
It runs as a JWT-protected API for user-specific endpoints and also exposes public trainer snapshots.

## 🎯 Responsibilities

- Serve authenticated user overview payloads (`user`, `pokemon_instances`, `trades`, `registrations`).
- Upsert user profile fields in MySQL.
- Serve public trainer snapshot data by username.
- Provide autocomplete suggestions for trainer search.
- Expose health and metrics endpoints for operations.

## 🏗️ Service Topology (Mermaid)

```mermaid
flowchart LR
  FE[Frontend]
  NGINX[Nginx]
  USERS[Users Service]
  MYSQL[(MySQL)]
  PROM[Prometheus]

  FE -->|HTTPS| NGINX
  NGINX -->|/api/users/*| USERS
  USERS -->|read and write| MYSQL
  PROM -->|scrape /metrics| USERS
```

## 🔐 Protected Update Flow (Mermaid Sequence)

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant US as Users Service
  participant DB as MySQL

  FE->>US: PUT /api/users/:user_id
  US->>US: verifyJWT
  US->>US: rate limit and body limit
  US->>DB: UPDATE users ... WHERE user_id=?
  DB-->>US: rows affected
  US->>DB: SELECT user by user_id
  DB-->>US: user row
  US-->>FE: 200 { success, user }
```

## 🧬 UML Domain Model (Mermaid Class Diagram)

```mermaid
classDiagram
  class User {
    +string user_id
    +string username
    +string pokemon_go_name
    +string team
    +int trainer_level
    +int total_xp
    +bool allow_location
    +float latitude
    +float longitude
  }

  class PokemonInstance {
    +string instance_id
    +string user_id
    +string variant_id
    +int pokemon_id
    +bool is_caught
    +bool is_for_trade
    +bool is_wanted
    +bool registered
    +int64 last_update
  }

  class Trade {
    +string trade_id
    +string user_id_proposed
    +string user_id_accepting
    +string trade_status
    +int64 last_update
  }

  class Registration {
    +string user_id
    +string variant_id
  }

  User "1" --> "0..*" PokemonInstance : owns
  User "1" --> "0..*" Trade : proposes or accepts
  User "1" --> "0..*" Registration : has
```

## 🧭 UML Use-Case View (Mermaid)

```mermaid
flowchart LR
  U[User]
  F[Frontend]
  A[Admin and Ops]
  S[(Users Service)]

  U --> F
  F --> UC1[View Overview]
  F --> UC2[Update Profile]
  F --> UC3[Search Trainers]
  F --> UC4[View Public Snapshot]

  UC1 --> S
  UC2 --> S
  UC3 --> S
  UC4 --> S

  A --> UC5[Health Check]
  A --> UC6[Scrape Metrics]
  UC5 --> S
  UC6 --> S
```

## 🧪 UML Activity Diagram (Overview Request)

```mermaid
flowchart TD
  A[Request GET overview] --> B{JWT valid}
  B -- No --> C[Return 403]
  B -- Yes --> D{user_id matches token}
  D -- No --> E[Return 403 user mismatch]
  D -- Yes --> F{device_id present}
  F -- No --> G[Return 400 missing device_id]
  F -- Yes --> H[Load user row]
  H --> I{user found}
  I -- No --> J[Return 200 empty object]
  I -- Yes --> K[Load instances, trades, registrations]
  K --> L[Build payload and ETag]
  L --> M{If-None-Match equals ETag}
  M -- Yes --> N[Return 304]
  M -- No --> O[Return 200 with overview payload]
```

## 🔁 UML State Diagram (JWT Gate)

```mermaid
stateDiagram-v2
  [*] --> NoCookie
  NoCookie --> Forbidden: accessToken missing

  NoCookie --> ParseToken: cookie present
  ParseToken --> Forbidden: invalid signature or parse error
  ParseToken --> CheckClaims: token valid

  CheckClaims --> Forbidden: exp missing or expired
  CheckClaims --> Forbidden: user_id missing
  CheckClaims --> Authorized: claims valid
  Authorized --> [*]
```

## 🗃️ UML Data Model (Mermaid ER)

```mermaid
erDiagram
  USERS ||--o{ INSTANCES : owns
  USERS ||--o{ REGISTRATIONS : has
  USERS ||--o{ TRADES : proposes_or_accepts

  USERS {
    string user_id PK
    string username
    string pokemon_go_name
    string trainer_code
    string team
    int trainer_level
    int total_xp
    datetime pogo_started_on
    datetime app_joined_at
    bool allow_location
    string location
    float latitude
    float longitude
    string highlight1_instance_id
    string highlight2_instance_id
    string highlight3_instance_id
    string highlight4_instance_id
    string highlight5_instance_id
    string highlight6_instance_id
  }

  INSTANCES {
    string instance_id PK
    string user_id FK
    string variant_id
    int pokemon_id
    string nickname
    string gender
    int cp
    int attack_iv
    int defense_iv
    int stamina_iv
    float level
    float weight
    float height
    bool shiny
    int costume_id
    bool lucky
    bool shadow
    bool purified
    int fast_move_id
    int charged_move1_id
    int charged_move2_id
    string pokeball
    string location_card
    string location_caught
    datetime date_caught
    datetime date_added
    int64 last_update
    bool disabled
    bool is_traded
    datetime traded_date
    string original_trainer_id
    string original_trainer_name
    bool mega
    string mega_form
    bool is_mega
    bool dynamax
    bool gigantamax
    bool crown
    string max_attack
    string max_guard
    string max_spirit
    bool is_fused
    json fusion
    string fusion_form
    string fused_with
    bool is_caught
    bool is_for_trade
    bool is_wanted
    bool most_wanted
    json caught_tags
    json trade_tags
    json wanted_tags
    json not_trade_list
    json not_wanted_list
    json trade_filters
    json wanted_filters
    int friendship_level
    bool mirror
    bool pref_lucky
    bool registered
    bool favorite
    string trace_id
  }

  REGISTRATIONS {
    string user_id PK
    string variant_id PK
  }

  TRADES {
    string trade_id PK
    string user_id_proposed
    string username_proposed
    string user_id_accepting
    string username_accepting
    string pokemon_instance_id_user_proposed
    string pokemon_instance_id_user_accepting
    string trade_status
    bool user_proposed_completion_confirmed
    bool user_accepting_completion_confirmed
    datetime trade_proposal_date
    datetime trade_accepted_date
    datetime trade_completed_date
    datetime trade_cancelled_date
    string trade_cancelled_by
    bool is_special_trade
    bool is_registered_trade
    bool is_lucky_trade
    int trade_dust_cost
    string trade_friendship_level
    int user_1_trade_satisfaction
    int user_2_trade_satisfaction
    string trace_id
    int64 last_update
  }
```

## 🌐 Endpoints

### Public

- `GET /healthz`
- `GET /readyz`
- `GET /metrics`
- `GET /api/public/users/:username`
- `GET /api/users/public/users/:username` (compatibility path)
- `GET /api/autocomplete-trainers?q=<prefix>`

### Protected (JWT cookie required)

Canonical:

- `GET /api/users/:user_id/overview?device_id=<id>`
- `PUT /api/users/:user_id`

Compatibility:

- `GET /api/:user_id/overview?device_id=<id>`
- `PUT /api/:user_id`
- `PUT /api/update-user/:user_id`
- `PUT /api/users/update-user/:user_id`

## 🛡️ Security and Guardrails

- JWT parser restricts signing method to HS256 and validates required claims.
- Oversized auth cookie guard rejects very large `accessToken` values.
- CORS allow-list via `ALLOWED_ORIGINS`.
- Request body-size guard via `MAX_BODY_BYTES`.
- Per-user/IP rate limiting via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_SEC`.
- Container runs as non-root user.

## ⚙️ Environment Variables

Required:

- `JWT_SECRET`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOSTNAME`
- `DB_PORT`
- `DB_NAME`

Common optional:

- `PORT` (default `3005`)
- `LOG_LEVEL` (default `info`)
- `ALLOWED_ORIGINS` (comma-separated)
- `MAX_BODY_BYTES` (default `1048576`)
- `RATE_LIMIT_MAX` (default `120`)
- `RATE_LIMIT_WINDOW_SEC` (default `60`)

DB pool tuning optional:

- `DB_MAX_OPEN_CONNS` (default `25`)
- `DB_MAX_IDLE_CONNS` (default `10`)
- `DB_CONN_MAX_LIFETIME_SEC` (default `300`)
- `DB_CONN_MAX_IDLE_TIME_SEC` (default `120`)

## 🧪 Testing

Run tests:

```bash
go test ./...
go vet ./...
```

Smoke checks (Linux or macOS):

```bash
BASE_URL=http://127.0.0.1:3005 ./scripts/smoke-users.sh
```

Smoke checks (PowerShell):

```powershell
.\scripts\smoke-users.ps1 -BaseUrl "http://127.0.0.1:3005"
```

Optional protected checks:

- Provide `USER_ID` and `ACCESS_TOKEN` in bash.
- Provide `-UserId` and `-AccessToken` in PowerShell.

## 🐳 Docker

```bash
docker compose up -d users_service
```

Default local bind:

- `127.0.0.1:3005:3005`

## 📈 Monitoring

- Prometheus should scrape `users_service:3005/metrics`.
- Alert rules for users service live in `monitoring/alerts.yml`.

## 📝 Notes

- Compatibility routes exist to support current frontend and nginx rewrite behavior.
