# Pokémon Go Nexus Frontend

This is the **React frontend** for the Pokémon Go Nexus platform, designed to provide a rich, responsive interface for managing Pokémon ownership, proposing trades, creating a wanted list, viewing Pokédex entries, and filtering or comparing Pokémon attributes.

---

## 🧩 Overview

The app supports:
- 🧠 Ownership tracking with deep variant detail
- 📊 Filtering by traits (shiny, lucky, CP, gender, etc.)
- 🔁 Trade proposal & negotiation flows
- 🔍 Full search & map-based Pokémon discovery
- 🧬 Fusion and Mega evolution management
- 🧭 Pokedex-based browsing and list organization

> 🔧 The frontend is actively in development. Many components are still evolving, and some pages (like search, trades, and ownership overlays) may be incomplete or frequently changing.

---

## ⚙️ Tech Stack

- **React 18+**
- **React Router** for navigation
- **Context API** for shared state (auth, theme, Pokémon data, trades, etc.)
- **Custom Hooks** for filtering, sorting, fetching, etc.
- **IndexedDB** + **SSE** for fast offline caching and syncing
- **Vitest** + **Testing Library** for unit/integration tests

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```
---

## CI/CD (GitHub Actions)

This service now has dedicated frontend workflows:

- `ci-frontend` (`.github/workflows/ci-frontend.yml`)
- `deploy-frontend-prod` (`.github/workflows/deploy-frontend-prod.yml`)

### What `ci-frontend` does

- Runs on changes under `frontend/**`, `nginx/**`, and the frontend workflow files.
- Installs deps with `npm ci`.
- Builds with `npm run build`.
- Enforces a blocking production audit gate with `npm audit --omit=dev --audit-level=moderate`.
- Runs full (prod + dev) audit as informational output for visibility without blocking deploys.
- Builds nginx image after staging `frontend/apps/web/dist` into `nginx/build`.
- Runs Trivy scans and publishes an SBOM artifact.
- Pushes `adamwentworth/frontend-nginx` tags (`sha-<commit>` + `latest`) when `DOCKERHUB_TOKEN` is set.

### What `deploy-frontend-prod` does

- Manual trigger (`workflow_dispatch`) on your self-hosted prod runner.
- Fast-forwards repo at deploy root (default `/media/adam/storage/Code/Go`).
- Validates compose and required Docker networks (`kafka_default`, `pokemon_edge`).
- Pulls requested image and recreates `frontend_nginx` with rollback on failed health check.

### Deploy input examples

- `image_ref=latest`
- `image_ref=sha-<commit>`
- `image_ref=adamwentworth/frontend-nginx:sha-<commit>`

### Required repository secret

- `DOCKERHUB_TOKEN` (used by CI for DockerHub login/push)

---

## ⚙️ Environment Configuration

Set up your environment variables for API connections in the appropriate `.env` files.
If you're developing the frontend and don't need to run the backend locally, you can use the `.env.production` values to connect directly to the live APIs.

### 🛠️ `.env.development`

```env
VITE_POKEMON_API_URL=http://localhost:3001/pokemon
VITE_AUTH_API_URL=http://localhost:3002/auth
VITE_RECEIVER_API_URL=http://localhost:3003/api
VITE_USERS_API_URL=http://localhost:3005/api
VITE_SEARCH_API_URL=http://localhost:3006/api
VITE_LOCATION_SERVICE_URL=http://localhost:3007
VITE_EVENTS_API_URL=http://localhost:3008/api

VITE_FORCED_REFRESH_TIMESTAMP=1740519179122
```

### 🚀 `.env.production`

```env
VITE_POKEMON_API_URL=https://pokemongonexus.com/api/pokemon
VITE_AUTH_API_URL=https://pokemongonexus.com/api/auth
VITE_RECEIVER_API_URL=https://pokemongonexus.com/api/receiver
VITE_USERS_API_URL=https://pokemongonexus.com/api/users
VITE_SEARCH_API_URL=https://pokemongonexus.com/api/search
VITE_LOCATION_SERVICE_URL=https://pokemongonexus.com/api/location
VITE_EVENTS_API_URL=https://pokemongonexus.com/api/events

VITE_FORCED_REFRESH_TIMESTAMP=1741290124604
```

🧠 The VITE_FORCED_REFRESH_TIMESTAMP can be set to override the standard 24-hour Pokémon data cache. When updated, it forces all clients to re-fetch fresh data even if their local cache is still considered valid. Update this value whenever a major data update occurs.

Make sure to restart your dev server after changing `.env` values.

### 3. Start the dev server

```bash
npm run dev
```

---

## 🧱 Project Structure

```plaintext
frontend/
├── public/              # Static files, assets, images, favicons, loading screens
├── src/                 # Main app source code
│   ├── components/      # Global reusable components (modals, spinners, nav, etc.)
│   ├── contexts/        # Global React contexts (Auth, Session, TradeData, etc.)
│   ├── hooks/           # Custom hooks for search, sort, filtering, etc.
│   ├── pages/           # Main route-based app pages
│   ├── services/        # API, SSE, location, IndexedDB interactions
│   ├── utils/           # Constants, formatters, ID utils, etc.
│   └── index.js         # Entry point
```

---

## 🧠 Core Page: `Pokemon.jsx`

This is the **main UI** for managing a user's collection or another player's Pokémon list.

### 🧩 Key features:

- **Horizontal 3-panel layout**:
  - **Left:** Pokédex filters & saved lists
  - **Center:** Main Pokémon grid with ownership status
  - **Right:** Tag/Trade list manager
- **Swipe/drag gesture support** (touch + mouse in dev)
- **Dynamic filtering, sorting, searching**
- **Fusion, Mega, Lucky, Max, IV, CP, Gender, Shadow, etc.**
- **Trade mode integration**

### 🧠 Key logic includes:

- `usePokemonProcessing` → handles filtering/sorting
- `useSwipeHandler` → controls sliding views
- `useInstanceIdProcessor` → preselects specific Pokémon by query
- `useMegaPokemonHandler` and `useFusionPokemonHandler` → dynamic modals for variant selection
- `getTransform()` → calculates transform for panel slide animation

### 🔄 View modes:

```plaintext
[pokedex] <--> [pokemon] <--> [tags]
```

---

## 📍 Routes

Currently implemented:

- `/pokemon` — your collection
- `/pokemon/:username` — view someone else's collection
- `/login`, `/register`, `/account` — auth screens
- `/trades` — trade list (work in progress)
- `/search` — Pokémon search via filters or location

---

## 🗂 Major Contexts

Located in `src/contexts/`, these React contexts help manage global state across the app:

- `AuthContext` — Handles login state, authentication tokens, and user data.
- `PokemonDataContext` — Core Pokémon ownership data, variants, syncing, and mutation helpers.
- `TradeDataContext` — Centralized trade data and related helpers for proposal, acceptance, and state changes.
- `ModalContext` — Global modal system for alerts, confirmation dialogs, and custom overlays.
- `LocationContext` — Handles map view logic and geolocation features.
- `ThemeContext` — Manages dark/light mode and theme switching.
- `EventsContext` — Manages real-time updates via Server-Sent Events (SSE), including missed data syncing and reconnection logic.
- `GlobalStateContext` — Shared flags like `isLoggedIn`, usable outside of auth logic.
- `SessionContext` — Tracks session freshness and the last known update timestamp for conditional data refreshes.
- `UserSearchContext` — Handles searching other users’ Pokémon collections and caches results using IndexedDB + ETag-aware API calls.

---

## ⚒ Development Tips

- All components and pages are written in modular files with separate `.css` styles
- Variant image files are under `public/images/` and structured by type (shiny, shadow, costumes, etc.)
- UX messaging standards (modal vs toast) are documented in `docs/UX_MESSAGING_POLICY.md`.
- Performance baseline capture workflow is documented in `docs/PERF_BASELINE_WORKFLOW.md`.

---

## 🧪 Testing

### Recommended local commands

```bash
npm run test:unit
```

- Default local unit path (batched) to avoid Node heap OOM on Windows.
- Uses `frontend/apps/web/scripts/run-unit-tests-batched.mjs`.

### Additional test modes

```bash
npm run test:unit:single-process
npm run test:unit:parallel
npm run test:integration
npm run test:e2e
npm run test
```

- `test:unit:single-process`: one-process unit run (lowest memory mode).
- `test:unit:parallel`: standard Vitest parallel unit run.
- `test`: full Vitest suite used by CI quality gates.

### Notes

- If you hit memory pressure locally, prefer `npm run test:unit` (batched).
- CI runs the full suite and is not constrained to local Windows batching behavior.

---

## 🎨 Theming

Dark/light mode is toggleable via `ThemeContext`. You can adjust base themes in:

```plaintext
public/Light-Mode.css
src/components/ThemeSwitch.jsx
```

---

## 🧭 Future Plans

- Pokédex in Pokemon Page to be more fleshed out
- Home page to be more fleshed out to offer a how to for everything along with boilerplate content to appear like a professional site
- Profile pages + friend management
- More Animations and UI niceties. 
- Advanced / Bulk operations so that Pokemon Customization can be done with many in mind rather than one by one.
- Refinement and more Development in frontend UI for Search page and Trades page.

---

## 🧠 Author Notes

This frontend was designed to be modular, touch-friendly, and scale as features evolve. The complexity of Pokémon variant data is abstracted into centralized processing hooks and context providers, with flexibility in mind for trading, sharing, and managing multi-variant collections.

The current codebase is large, but **structured for rapid iteration**, with clean folder grouping and reusable UI components.

> If you're working on a section or need help tracking data flow — `contexts/`, `hooks/`, and `pages/Pokemon/` are the best starting points.



