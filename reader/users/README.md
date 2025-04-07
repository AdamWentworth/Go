# 👤 Users Service

This service provides **authenticated access** to user-specific Pokémon ownership data, trade history, and user profile management.

---

## 🔍 Overview

The Users service exposes endpoints to:

- Retrieve a user's Pokémon instances and related trade data
- Fetch ownership data by either `user_id` or `username`
- Update a user’s profile (username and location)
- Return trade-aware Pokémon ownership status
- Support cache-friendly `ETag` headers for data freshness

---

## 📦 Endpoints

### 🔐 Protected Routes (JWT Required)

#### `GET /api/ownershipData/:user_id`
Fetch all Pokémon instances, trades, and related instances for the given `user_id`.

#### `GET /api/ownershipData/username/:username`
Fetch Pokémon instances for a user by username.

- Adds `ETag` support for client-side cache invalidation.
- Filters out Pokémon currently involved in **pending trades**.

#### `PUT /api/update-user/:user_id`
Update a user’s profile (username, latitude, longitude).

**Body (JSON):**
```json
{
  "username": "newUsername",
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

---

## 🛠 Setup

### Prerequisites

- Go 1.21+
- `.env.development` file:
  ```
  DB_USER=
  DB_PASS=
  DB_HOST=
  DB_PORT=
  DB_NAME=
  JWT_SECRET=
  ```

### Install deps

```bash
go mod tidy
```

### Run locally

```bash
go run .
```

Service runs on:  
**http://127.0.0.1:3005**

---

## 🗂 Directory Structure

```
users/
├── main.go               # Entry point
├── pokemon_handlers.go   # Ownership + related data handlers
├── users_handlers.go     # Update user endpoint
├── auth.go               # JWT helpers
├── middleware.go         # JWT + CORS
├── helpers.go            # Utility helpers
├── init.go               # DB, env init
├── logging.go
├── models.go             # GORM models
├── .env.development
├── app.log
```

---

## 🧠 Notable Behaviors

- Ownership and trade data are deeply structured by `instance_id` or `trade_id`.
- Related Pokémon in trades are fetched for full context.
- Pending trades suppress Pokémon from being marked as "for trade."
- `PUT /update-user` includes retry logic for transient DB issues.
- Username changes are validated and de-duped.

---

## 🧪 Example Response: `GET /api/ownershipData/username/:username`

```json
{
  "username": "ashketchum",
  "instances": {
    "instance_abc": {
      "pokemon_id": 25,
      "nickname": "Pika",
      "shiny": true,
      ...
    }
  }
}
```
