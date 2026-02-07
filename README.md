# 🌐 Pokémon Go Nexus — Full Stack Monorepo

Welcome to the **Pokémon Go Nexus** — a full-stack web application and data ecosystem for tracking, managing, and trading Pokémon Go collections. This monorepo includes all services required for the platform: from a React frontend and Express/Go backends, to Kafka-based event syncing, to location intelligence and database editors.

---

## 📦 Monorepo Structure

```plaintext
Go/
├── authentication/     # JWT auth microservice with MongoDB
├── editor/             # Tkinter-based GUI to edit pokego.db
├── frontend/           # React 18+ app with SSE & IndexedDB
├── location/           # Go + PostGIS location microservice
├── nginx/              # Reverse proxy config and SSL setup
├── notes/              # Technical notes and architecture
├── pokemon/            # Pokémon API (Go) powered by enriched SQLite
├── reader/             # Read microservices: discover, users, events
├── receiver/           # Kafka producer, ingest client updates
├── storage/            # Kafka consumer, persist to MySQL, backup jobs
├── tests/              # Data mocks, fake user generators
```

Legacy Node `pokemon_data` service has been moved to archive outside this repo.
Use `pokemon/` for all current Pokemon API development and deployment.

---

## 🧰 Tech Stack Overview

| Layer         | Tech                                              |
|---------------|---------------------------------------------------|
| Frontend      | React 18, Context API, SSE, IndexedDB             |
| Auth          | Node.js + Express + MongoDB + JWT                 |
| Pokémon API   | Go (`net/http` + `chi`) + SQLite + cache layer     |
| Location      | Go + PostgreSQL/PostGIS                           |
| Event Sync    | Kafka (Docker) + Go consumers/producers           |
| Search        | Go + MySQL + Haversine filters                    |
| Users         | Go + MySQL + JWT                                  |
| Trades/SSE    | Go + Kafka + Server-Sent Events                   |
| Storage       | Go + Kafka + MySQL                                |
| Reverse Proxy | NGINX + SSL + Route rewriting                     |

---

## 🚀 Getting Started (Local Development)

### 🔐 1. Authentication

```bash
cd Go/authentication
npm install
npm start
```

- MongoDB required  
- Tokens set via secure cookies  
- Uses `.env.development` for config

---

### 📦 2. Pokémon Data API (Go)

```bash
cd Go/pokemon
go mod tidy
go run ./cmd/pokemon
```

- Powered by `pokego.db`  
- Runs on port `3001`  
- Supports mega, shiny, costumes, evolutions

---

### 🌍 3. Location Service

```bash
cd Go/location
go mod tidy
go run .
```

- Needs PostGIS database  
- `.env` contains DB info

---

### ⚡ 4. Kafka (Event Queue)

```bash
cd Go/kafka
docker-compose up -d
```

- Kafka + Zookeeper  
- Topic: `batchedUpdates`

---

### 🛰️ 5. Receiver (Kafka Producer)

```bash
cd Go/receiver
go run .
```

- Auth required  
- Forwards batched payloads to Kafka

---

### 🗃 6. Storage (Kafka Consumer)

```bash
cd Go/storage
go run .
```

- Stores Pokémon + Trade updates in MySQL  
- Scheduled SQL backups at midnight

---

### 🔎 7. Discover (Search)

```bash
cd Go/reader/discover
go run .
```

- Filter-based Pokémon search  
- Uses user coordinates

---

### 📡 8. Events (SSE + Kafka Consumer)

```bash
cd Go/reader/events
go run .
```

- Live updates via `/api/sse`  
- Pushes updates from Kafka to frontend

---

### 👤 9. Users Service

```bash
cd Go/reader/users
go run .
```

- Fetch Pokémon ownership data  
- Supports ETag caching

---

### 🧠 10. Editor (Data GUI)

```bash
cd Go/editor
python main.py
```

- Tkinter GUI  
- Directly edits `pokego.db`  
- Always back up before changes

---

### 💻 11. Frontend

```bash
cd Go/frontend
npm install
npm start
```

- React 18+  
- Uses `.env.development` to point to local APIs  
- Features: Pokédex, trade proposals, filtering, variant management, map-based search

---

## ⚙️ Environment Overview

Each service has its own `.env` or `.env.development`. Some important shared configs:

| Key                  | Description                                     |
|----------------------|-------------------------------------------------|
| JWT_SECRET           | Shared across auth, receiver, reader, etc       |
| FRONTEND_URL         | For CORS config and cookies                     |
| REACT_APP_*          | Frontend uses these to reach APIs               |
| DATABASE_URL         | Used in services with persistent storage        |

---

## 🔁 Kafka Event Flow

```plaintext
Frontend → Sends updates via /api/batchedUpdates
Receiver Service → Validates + forwards to Kafka
Storage Service → Consumes Kafka messages → writes to MySQL
Events Service → Notifies connected clients via SSE
```

---

## 📚 API Services

| Service         | Port  | Language | Notes                                                  |
|-----------------|-------|----------|--------------------------------------------------------|
| Pokémon API     | 3001  | Go       | Shiny, Mega, IV, moves, costume, fusion data          |
| Auth            | 3002  | Node.js  | JWT, cookie-based auth, per-device sessions           |
| Receiver        | 3003  | Go       | Kafka producer, client update ingest                  |
| Storage         | 3004  | Go       | Kafka consumer, MySQL writer, backup jobs             |
| Users           | 3005  | Go       | Pokémon ownership per user                            |
| Discover        | 3006  | Go       | Pokémon matchmaking and filters                       |
| Location        | 3007  | Go       | Geocoding, reverse, autocomplete                      |
| Events (SSE)    | 3008  | Go       | SSE feed, Kafka consumer, diff push                   |

---

## 🧪 Testing

- **Frontend:** `npm test` (Jest + React Testing Library)  
- **Backend:** Currently ad-hoc using the `tests/` service for generating fake data

---

## 🔐 Security

- HTTPS enforced via NGINX + Certbot  
- Tokens stored in `httpOnly` cookies  
- SSE streams only accept verified JWTs  
- SQL + XSS pattern detection in Receiver  
- Rate limiting per IP  
- Multiple layers of CORS enforcement

---

## 🗃️ Backups

| System         | Method                                  |
|----------------|------------------------------------------|
| Pokémon Data   | Manual backups via Editor or scripts     |
| Auth Service   | Daily gzipped MongoDB dumps              |
| Storage Service| Daily MySQL `.sql` backups               |
| Location       | SQL + .dump backups via Python scripts   |

---

## 🧭 Admin Tools

| Tool         | Purpose                                    |
|--------------|--------------------------------------------|
| Editor GUI   | Modify `pokego.db` visually                |
| Kafka        | Monitor message flow (`batchedUpdates`)    |
| NGINX        | Central API router + TLS termination       |
| Notes/       | Includes design docs, plans, and ideas     |

---

## 🌐 Production Deployment

- Served via **NGINX on Windows**
- TLS certs via **Certbot**
- Frontend build output in `/build`
- Reverse proxy maps `/api/*` routes to correct services
- SSE and CORS handled in proxy config

---

## 🧠 Author Notes

This project is built with scalability, structure, and flexibility in mind. It supports deeply nested Pokémon variants, live sync across devices, and advanced trade filtering. Designed to evolve with the game, the stack supports rich editing, fast search, and cross-platform usage.

If you're contributing:

- Start with `frontend/src/pages/Pokemon/` or `pokemon/internal/`
- Kafka event schema is your friend
- For data changes, use the Editor or scripts carefully
- Always **back up** before making major changes

---

## 📌 Future Enhancements

### 🖼️ Frontend & UI/UX
- Major UI/UX enhancements including styling, transitions, animations
- Continued development on Pokédex, Home page, and new feature pages
- Better onboarding, how-it-works guides, and visual polish

### 👥 Social Features
- Friends list and user profiles
- Trade history visibility and partner interactions

### 🔐 Authentication & Accounts
- Password reset functionality
- Social login support (Auth0 integration)

### 📱 Mobile Support
- React Native wrapper for iOS/Android
- Mobile-first optimizations across all components

### 📊 Admin & Moderation
- Admin dashboard monitoring with Prometheus
- Metrics tracking, audit logs, and system insights

### 🧠 Backend & Infra
- Redis or PostgreSQL migration for Pokémon API scalability
- Selective data sync with improved caching strategies

---

## 👨‍💻 Author Notes

This monorepo is built by a passionate trainer/dev and is not affiliated with Niantic or Pokémon.

**Gotta catch 'em all!** 🧢✨
