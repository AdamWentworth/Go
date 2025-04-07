# 🗃️ Storage Service - Pokemon Go Nexus

This service listens to a Kafka topic for batched Pokémon and trade updates, persists them to a MySQL database, and performs scheduled backups. It also manages conflict resolution, ownership logic, and secure data validation for each update.

---

## 📦 Features

- Listens to the `batchedUpdates` Kafka topic
- Processes and upserts Pokémon ownership and metadata
- Handles bidirectional trade processing and validation
- Detects and resolves data conflicts
- Performs automatic SQL backups daily at midnight
- Re-attempts failed Kafka messages every 5 minutes
- Logs everything to `app.log` using `logrus`

---

## 🚀 Getting Started

### Prerequisites

- Go 1.21+
- MySQL 8+
- Kafka running with a `batchedUpdates` topic
- `.env.development` and `config/app_conf.yml` set up

### Install dependencies

```bash
go mod download
```

### Run locally

```bash
go run .
```

This will:

- Connect to MySQL
- Start consuming Kafka messages
- Begin scheduling backups and retry logic

---

## 🗄️ Database Schema

The service stores:

- Pokémon instance data (`instances` table)
- Trade data (`trades` table)
- User location metadata (`users` table)

See `models.go` for GORM definitions.

---

## 🧠 How It Works

### 🔁 Kafka Message Flow

The service consumes `batchedUpdates` messages from Kafka. Each message may contain:

- `pokemonUpdates`: array of Pokémon instances (ownership, IVs, level, etc.)
- `tradeUpdates`: array of trade records (statuses, confirmations, etc.)
- `location`: optional user location update
- `trace_id`: request-level correlation ID for logging

### 🔄 Pokémon Handling

- Ownership changes, moves, level, IVs, tags, etc. are persisted
- Deletions are triggered if marked `is_unowned` and not owned/wanted/traded
- Only newer updates (based on `last_update`) are accepted
- Invalid or unauthorized updates are skipped with a warning

### 🔄 Trade Handling

- Handles proposed, pending, completed, denied, and cancelled trades
- Enforces valid status transitions
- Automatically deletes conflicting trades on confirmed swaps
- Swaps Pokémon ownership on completion
- Ensures both parties confirm before finalizing trades

---

## 📅 Scheduled Jobs

| Job                     | Schedule      | Description                                |
|------------------------|---------------|--------------------------------------------|
| `CreateBackup()`       | Daily @ 00:00 | Exports the full `user_pokemon_backup_YYYY-MM-DD.sql` |
| `ReprocessFailedMessages()` | Every 5m   | Retries any failed Kafka messages           |

See `scheduler.go` and `backup.go`.

---

## 🛠 Configuration

### `.env.development`

```env
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOSTNAME=localhost
DB_PORT=3306
DB_NAME=pokemon_storage

HOST_IP=<your-host-ip>  # e.g. 192.168.1.42
```

### `config/app_conf.yml`

Stores additional configuration such as batch size, retry policies, logging options, etc.

---

## 🗃️ Backups

SQL backups are stored in `./backups/` and rotated daily.

Example:

```
user_pokemon_backup_2025-04-07.sql
```

Use `restore_database.go` (coming soon) or standard MySQL CLI to restore.

---

## 📜 Logging

All logs are stored in:

```
app.log
```

Each message is tagged with `trace_id` for easy correlation between Kafka, Pokémon, and trade activity.

---

## 🔐 Security

- All incoming updates are validated before processing
- Unauthorized modifications (e.g. tampering with another user’s data) are skipped and logged
- No external access is exposed (Kafka consumer only)

---
