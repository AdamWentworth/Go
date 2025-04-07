# 📡 Events Service (SSE + Kafka Consumer)

This service handles real-time updates and change tracking via **Server-Sent Events (SSE)** for Pokémon and Trade data. It also consumes updates from Kafka and pushes them to connected clients in real time.

---

## ⚙️ Features

- 🔐 **JWT-Protected** endpoints (`/api/sse`, `/api/getUpdates`)
- 📤 **SSE Streaming** for real-time updates
- 🔄 **Pull-based** `/getUpdates` endpoint to fetch deltas since last timestamp
- 📨 **Kafka consumer** that listens to backend updates
- 🧠 In-memory diffing and swap logic for completed trades
- 🧩 Related data enrichment (trades, Pokémon, filters)
- 🔁 Automatic reconnection logic on the frontend (via SSE)

---

## 🚀 Running Locally

### 1. Prerequisites

- Go 1.21+
- Kafka broker running (see `config/app_conf.yml`)
- Database with Pokémon/trade schema
- `.env.development` with valid values:
    ```
    DB_USER=
    DB_PASS=
    DB_HOST=
    DB_PORT=
    DB_NAME=
    JWT_SECRET=
    ```

### 2. Install dependencies

```bash
go mod tidy
```

### 3. Start the service

```bash
go run .
```

---

## 🔐 Authentication

- All endpoints require a valid **JWT**.
- Extracted claims (`user_id`, `device_id`, `username`) are used in SSE and Kafka logic.

---

## 📡 SSE Endpoint

### `GET /api/sse?device_id=...`

**Headers:**

```
Authorization: Bearer <your_jwt>
```

- Opens a persistent connection streaming updates.
- Each message includes `pokemon`, `trade`, and `relatedInstance` maps.
- Reconnection handled automatically by frontend using standard `EventSource`.

---

## 🕵️‍♂️ Polling Endpoint

### `GET /api/getUpdates?timestamp=...&device_id=...`

- Returns Pokémon and trades for the current user updated since the provided **Unix timestamp (ms)**.
- Used by clients for initial sync after app open.

---

## 🔄 Kafka Consumer

- Subscribes to the Kafka topic configured in `app_conf.yml` under `events.topic`.
- Accepts compressed, batched updates and:
  - Parses `pokemonUpdates` and `tradeUpdates`
  - Handles trade completion swaps (in-memory)
  - Gathers `relatedInstance` metadata
  - Sends deltas to all **connected SSE clients**, excluding the initiating device

---

## 🧠 In-Memory Swap (Trade Completion)

When a trade reaches `status="completed"`:
- Pokémon ownership is virtually swapped (without DB write)
- The `pokemonMap` in the SSE payload reflects this change immediately
- Ensures both parties see their updated collections in real time

---

## 📁 Project Structure

```
events/
├── main.go              # Entry point
├── sse_handler.go       # SSE stream logic
├── update_handler.go    # Pull endpoint logic
├── kafka_consumer.go    # Kafka streaming + routing
├── client_manager.go    # SSE connection state
├── auth.go              # JWT helpers
├── init.go              # Bootstrap config/env
├── config/
│   └── app_conf.yml     # Kafka config
├── models.go            # Shared GORM models
├── logging.go
├── middleware.go        # CORS and JWT middleware
├── .env.development
├── app.log
```

---

## 📬 Kafka Message Schema

Expected fields in Kafka messages (compressed JSON):

```json
{
  "user_id": "abc123",
  "device_id": "ios_001",
  "pokemonUpdates": [...],
  "tradeUpdates": [...]
}
```
