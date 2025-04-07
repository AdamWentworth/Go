# 🔎 Discover Service (Search Reader)

This service powers advanced Pokémon instance discovery. It allows users to query Pokémon listed for trade or wanted by others, with support for detailed filters and trade matching logic.

---

## ⚙️ Features

- Search Pokémon instances across all users
- Filter by IVs, gender, moves, costumes, ownership, and more
- Location-aware range searching via lat/lng + Haversine distance
- Matchmaking logic for trading based on user preferences
- JWT-protected routes
- Optional "only matching trades" and "trade in wanted list" filters

---

## 🚀 Running Locally

### Prerequisites

- Go 1.21+
- MySQL database populated with Pokémon data
- `.env.development` configured

### Install dependencies

```bash
go mod tidy
```

### Start the service

```bash
go run .
```

---

## 🔐 JWT Auth

- Protected routes require a valid JWT in the `Authorization` header
- Middleware will extract the `user_id` from the token

---

## 🔍 API Endpoint

### `GET /api/discoverPokemon/`

Query parameters:

| Param                  | Type     | Description                                              |
|------------------------|----------|----------------------------------------------------------|
| `pokemon_id`           | int      | Filter by Pokémon species ID                             |
| `shiny`                | bool     | Whether shiny                                            |
| `shadow`               | bool     | Whether shadow                                           |
| `costume_id`           | int/null | Specific costume (or `null` to exclude all)              |
| `fast_move_id`         | int      | Filter by fast move                                      |
| `charged_move_1_id`    | int      | First charged move                                       |
| `charged_move_2_id`    | int      | Second charged move                                      |
| `gender`               | string   | "Male", "Female", "Any", "Genderless"                    |
| `ownership`            | string   | "trade", "wanted", or "owned"                            |
| `latitude`/`longitude` | float    | User location                                            |
| `range_km`             | float    | Radius for geolocation filtering                         |
| `attack_iv` / `defense_iv` / `stamina_iv` | int | IV filters                         |
| `background_id`        | int      | Filter by location_card ID                               |
| `pref_lucky`           | bool     | User prefers lucky trades                                |
| `already_registered`   | bool     | If the user already has this Pokémon registered          |
| `friendship_level`     | int      | Required friendship level (1–4)                          |
| `limit`                | int      | Max number of results (default: 25)                      |
| `only_matching_trades` | bool     | Show only trade instances matching user’s wanted list    |
| `trade_in_wanted_list` | bool     | Show only wanted Pokémon that match user's trade list    |
| `dynamax` / `gigantamax` | bool   | Additional form filters                                  |

Response includes ownership, distance, and optional `wanted_list` or `trade_list` sections depending on query.

---

## 🧠 Matching Logic

When either `only_matching_trades=true` or `trade_in_wanted_list=true`:

- The backend checks if the current user’s Pokémon match the remote user’s wanted/trade list using:
  - Species ID
  - Costume
  - Shiny/Shadow
  - Gender
  - Moves (fast + charged)
  - Other custom fields (Dynamax, etc.)
- Skips blocked matches using `not_trade_list` or `not_wanted_list`

---

## 📦 Data Schema

This service expects:

- Pokémon instances in `pokemon_instances` table
- Each instance associated with a `User` (lat/lng stored on user)

See `models.go` for full schema definition.

---

## 🛠 Dev Notes

- Errors and queries are logged via `logrus`
- Results are preloaded with associated `User` data
- JWTs are decoded to get `user_id` context
- Filters default to generous behavior unless explicitly set

---

## 📁 Project Structure

```
discover/
├── main.go                 # Entry point
├── pokemon_handlers.go     # Main route logic
├── middleware.go           # JWT and CORS middleware
├── models.go               # GORM models
├── logging.go              # Logging setup
├── init.go                 # Env/config/bootstrap
├── auth.go                 # JWT helper methods
├── .env.development
├── app.log
```

---
