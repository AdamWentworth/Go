# Pokémon Go Nexus Pokemon Data API

A comprehensive API for accessing enriched Pokémon Go data, including Pokémon details, evolutions, costumes, raid bosses, CP stats, fusions, megas, backgrounds, and more.

## 🚀 Overview

This service provides a rich dataset built from a custom SQLite database, with detailed processing of costume data, moves, evolutions, combat power (CP), and other in-game attributes. It powers endpoints for frontend clients and tools, enabling deep insights into Pokémon characteristics and behavior in Pokémon Go.

> 🧠 **Note:** The Python scripts located in `data/scripts/` were primarily used to **build and enrich the database**. They're **not part of the live server runtime**, but have been retained for reference and potential future data preprocessing needs. The data has been sourced and currated manually but the data does need updating from time to time. I have built a custom editor (in the editor folder at the top level) to help with that. It has functions for most data to be updated.

---

## 📁 Project Structure

```plaintext
pokemon_data/
├── .env.*                    # Environment-specific config
├── server.js                 # Main server entry point
├── config/                   # App and OpenAPI configuration
├── data/                     # Contains database and data scripts
│   ├── pokego.db             # Main SQLite database
│   ├── scripts/              # Python scripts for data
│   └── sql/                  # Some SQL queries
├── middlewares/             # Custom Express middleware
├── routes/                  # API route handlers
├── services/                # Core logic/services per data domain
├── utils/                   # Utility modules
└── package.json             # Node.js dependencies
```

---

## 🧪 Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.development` or `.env.production` as needed
   - Set your `PORT`, `NODE_ENV`, or any other relevant config
   - The Server runs on 3001 currently for both development and for production.

3. **Run the server**
   ```bash
   npm start
   ```

   The server's package.json is configured to run with nodemon, so you don’t need to run nodemon manually.

4. **Access the API**
   - Default local URL: `http://localhost:3001/pokemon/pokemons`
   - Swagger docs: `http://localhost:3001/api-docs`

---

## 🧬 Pokémon Data Endpoint

The primary route is:

```
GET /pokemon/pokemons
```

This endpoint returns an array of Pokémon with the following enriched data:
- Basic Details and Stats
- Variants (Shiny, Shadow, etc)
- Image paths (including female variants)
- Costumes
- Moves
- Fusion data (with level-based CP)
- Backgrounds
- Max CP for level 40 and 50
- Evolutions
- Mega evolutions (with CP)
- Raid boss info
- Max Pokémon data
- Size metrics

---

## ⚙️ Scripts (data/scripts/)

These Python scripts were invaluable during the database creation phase and include utilities like:

- Adding attributes to the database (e.g., `add_shadow_costume.py`)
- Preloading image URLs (`add_image_urls.py`)
- Calculating and storing CP (`store_cp.py`, `output_cp.py`)
- Handling shiny variants, raid boss logic, costume IDs, and more

> **Reminder:** These scripts are not executed as part of the server. They’re mainly retained for historical and reference purposes.

---

## 📄 OpenAPI & Swagger

You can view and test all documented routes through the Swagger UI:

```
GET /api-docs
```

This is backed by `config/openapi.yml`.
The OpenAPI spec is currently outdated and may not reflect recent changes to the API.

I would recommend just ignoring the openapi for now. I used it when starting the server but I quickly found the progress outrunning the documentation.

---

## 🔐 CORS and Security

CORS is enabled for:
- `localhost:3000` (dev frontend)
- `*.pokemongonexus.com`
- Any domain ending with `.cloudflare.com` (for deployed frontends)

Unauthorized origins will be blocked and logged via the custom logger.

The server does log IP addresses to allow us to trace requests should we need to. I am open to considering rate limiting and other security measures.

---

## 🧭 Future Work

- Possibly migrate Database to an SQL server based database, and or Migrate JSON style response data to Redis?

---

## 👨‍💻 Author Notes

This server was built to be an all in one endpoint to retrieve all Pokemon Go Data for the Pokemon Go Nexus web app and site. If you’re diving into the codebase, the `services/` directory is where the core logic lives, while the database scripts helped with building the database, at this stage the Server does what it needs to do but may need to be optimized down the road to offer faster speeds, more scalability and perhaps custom endpoints so that users can request only the data that is missing or has changed since they last requested (All these requests should be happening in the background automatically from the Frontend of the stack).
