# 📍 Location Microservice — Pokémon Go Nexus

This Go-based microservice provides location-based utilities including geocoding, reverse geocoding, and autocomplete. It’s primarily used to support location tagging and queries within the Pokémon Go Nexus platform.

---

## 🚀 Features

- 🔍 `/autocomplete`: Suggest locations as users type
- 🧭 `/geocode`: Convert addresses to coordinates
- 📌 `/reverse`: Reverse geocode coordinates into readable places
- 🏙 `/city/:country/:state?/:name?`: Query location metadata and polygons
- 🌐 CORS support, static file serving, structured logging
- 🗺 Optional CLI tools for viewing/exporting boundaries and backups

---

## ⚙️ Tech Stack

- **Go Fiber** — HTTP server
- **PostgreSQL + PostGIS** — spatial data storage
- **Logrus** — logging
- 🐍 Python scripts for backup/export

---

## 📁 Directory Structure

```
location/
├── main.go                  # Entry point
├── config.go                # Loads env vars / config
├── db.go                    # DB connection logic
├── models.go                # Structs for location data
├── logging.go               # Sets up logrus and middleware
├── autocomplete.go          # Handler for /autocomplete
├── geocode.go               # Handler for /geocode
├── reverse.go               # Handler for /reverse
├── viewer.go                # Handler for /city
├── .env                     # Environment variables
├── go.mod / go.sum          # Go dependencies
├── backups/                 # Backup .sql and .dump files
├── backup_database_sql.py   # Export as SQL
├── backup_database_dump.py  # Export as .dump
├── restore_database.py      # Restore from backup
├── output_polygons.py       # Outputs polygons as JSON
├── view_polygons.py         # Visual viewer (optional)
├── export_shapefile.py      # Export shapefiles (optional)
└── update_search_sets.sql   # Helper SQL for faster autocomplete
```

---

## 🔧 .env Example

```env
DB_USER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=locations
DB_PASSWORD=yourpassword
POST_PASSWORD=yourpassword
```

*one password for connecting to database while running server, the other is for running backups, but they are the same password*

---

## 🧪 Running the Service

1. **Install Go dependencies**

```bash
go mod tidy
```

2. **Start the server**

```bash
go run .
```

It runs on `http://localhost:3007` by default.

---

## 🛠 Endpoints

| Route                        | Method | Description                              |
|-----------------------------|--------|------------------------------------------|
| `/autocomplete`             | GET    | Returns location suggestions by query    |
| `/geocode`                  | GET    | Converts place names to coordinates      |
| `/reverse`                  | GET    | Converts coordinates to location name    |
| `/city/:country/:state?/:name?` | GET | Returns metadata + polygon for city     |

> All endpoints use the connected PostGIS database for querying.

---

## 💾 Backups

There are Python scripts to dump and restore the PostgreSQL database:
- `backup_database_sql.py` → Creates `.sql` files
- `backup_database_dump.py` → Creates `.dump` files
- `restore_database.py` → Restores from those backups

Run any of them with Python 3 installed.

---

## 📊 Polygon Viewer

For debugging or visual confirmation of city boundary shapes:

```bash
viewer.html
```

A simple map viewer. Right click and click view in browser to test location polygons.

---

## 🧠 Notes

- Requires a properly set up PostGIS database with place + boundary data
- All routes log structured output with timestamps using Logrus
- CORS is enabled to allow requests from the frontend

---

## 🧭 Example Usage

```bash
curl "http://localhost:3007/autocomplete?q=San+Fran"
curl "http://localhost:3007/geocode?query=Tokyo"
curl "http://localhost:3007/reverse?lat=34.05&lon=-118.25"
curl "http://localhost:3007/city/US/CA/Los%20Angeles"
```

---

## 👨‍💻 Author Notes

This service was built to support  Pokémon across the Pokémon Go Nexus platform; however, can be used with any tech stack that can benefit from location data.
