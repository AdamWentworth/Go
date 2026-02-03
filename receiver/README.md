# 📦 Receiver Service — Pokémon Go Nexus

This Go-based microservice accepts batched client updates (Pokémon ownership, trade updates, and optional location) and forwards them to Kafka for further processing.

---

## 🧩 Overview

| Feature                     | Description                                       |
|----------------------------|---------------------------------------------------|
| 🛡️ Security                | Rate limiting, TLS version/cipher validation, basic XSS/SQLi detection |
| 🔐 Auth                    | Verifies JWT access token and extracts user metadata |
| 🛰️ Kafka Integration       | Publishes parsed update payloads to `batchedUpdates` topic |
| 🌐 CORS Enabled            | Accepts requests from React frontend domains     |
| 🪵 Logging                 | Includes trace ID, user ID, device ID, and full update metadata |

---

## 📁 Project Structure

```
receiver/
├── .env                      # Environment config
├── config/
│   └── app_conf.yml          # Kafka config and other app settings
├── main.go                   # Entry point
├── handler.go                # Handles /api/batchedUpdates route
├── auth.go                   # JWT token verification
├── kafka.go                  # Kafka producer logic
├── config.go                 # Loads app_conf.yml
├── logging.go                # Sets up logger
├── retry.go                  # Kafka retry logic
├── go.mod / go.sum           # Go modules
└── app.log                   # Runtime logs
```

---

## 🔐 Security Features

Custom middleware enforces:

- 📈 **Rate limiting**: 60 requests per minute per IP
- 🔐 **TLS**: Only accepts TLS 1.2 / 1.3 with strong cipher suites
- 🚫 **Blocked IP list**
- 🧪 **Pattern detection**: Basic SQL injection / XSS heuristics
- 📏 **Header size limit**: 8KB

---

## 🔁 API Endpoint

### `POST /api/batchedUpdates`

**Headers:**

- `Authorization: Bearer <JWT>`
- `Content-Type: application/json`

**Payload:**

```json
{
  "location": { "latitude": ..., "longitude": ... },
  "pokemonUpdates": [ ... ],
  "tradeUpdates": [ ... ]
}
```

Fields are optional but default to empty arrays if missing.

---

## 🔄 Kafka Integration

- Connects to Kafka broker defined in `config/app_conf.yml`
- Publishes message as a JSON blob with metadata:

```json
{
  "user_id": "abc123",
  "username": "trainer",
  "device_id": "xyz456",
  "trace_id": "uuid-v4",
  "location": {...},
  "pokemonUpdates": [...],
  "tradeUpdates": [...]
}
```

- Topic: `batchedUpdates`

---

## 🌍 CORS Settings

Allows requests from:

- `http://localhost:3000`
- `https://pokemongonexus.com`
- `https://www.pokemongonexus.com`

Supports cookies and credentials.

---

## 🧪 Running Locally

### 1. Setup `.env`

```
JWT_SECRET=your_jwt_secret
HOST_IP=<your-host-ip>  # e.g. 192.168.1.42
```

### 2. Run Kafka

Start Kafka + Zookeeper via Docker (see [kafka service](../kafka/)).

### 3. Start the Receiver

```bash
go run .
```

Server will start on port `3003`.

---

## 🔧 Configuration

### `config/app_conf.yml`

```yaml
events:
  port: "9093"
  topic: "batchedUpdates"
  max_retries: 5
  retry_interval: 3
```

---

## 📄 Logging

Logs are written to `app.log` with traceable fields:

```
INFO User ash sent 3 Pokemon updates + 1 Trade updates to Kafka
trace_id=1234 user_id=abc device_id=xyz has_location=true ...
```

Errors also include trace ID for debugging.

---

## 🧠 Notes

- Fails gracefully on invalid/missing data
- Request body is limited to 50MB
- Uses `uuid` for traceability across logs and messages
- Designed to be robust, secure, and lightweight for event ingestion

---
