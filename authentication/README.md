# Authentication Service (Node.js)

Authentication API for Pokemon Go Nexus.

## What It Handles

- User registration and login
- JWT access and refresh token issuance
- Refresh token rotation and logout
- Account update and delete flows
- Trade partner reveal endpoint for authenticated users
- Daily MongoDB backup task (`mongodump`)

## Current Scope

- OAuth/social login is intentionally disabled for now.
- Email delivery is intentionally disabled for now (no SMTP integration in this service).
- Password reset completion is intentionally disabled for now.
- Cookie-authenticated mutating routes enforce an Origin check against allowed frontend origins.
- Refresh tokens are stored as one-way hashes and rotated on refresh.
- `tradeRevealRoute` is transitional and can be removed once that capability moves to a dedicated service.

## Routes

Mounted under `/auth`:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `PUT /auth/update/:id`
- `DELETE /auth/delete/:id`
- `POST /auth/reset-password/` (currently returns `501 Not Implemented` by design)
- `POST /auth/reveal-partner-info`

API docs:

- `GET /api-docs`

## Environment Variables

### Required

- `DATABASE_URL` MongoDB connection string
- `JWT_SECRET` JWT signing secret

### Recommended

- `FRONTEND_URL` frontend origin used by CORS (for example `http://localhost:3000`)
- `NODE_ENV` (`development` or `production`)
- `ACCESS_TOKEN_SECRET` optional dedicated secret for access-token signing/verification
- `REFRESH_TOKEN_SECRET` optional dedicated secret for refresh-token signing/verification
- `JWT_ISSUER` optional JWT issuer claim (defaults to `pokemongonexus-auth`)
- `JWT_AUDIENCE` optional JWT audience claim (defaults to `pokemongonexus-clients`)

## Local Run

```bash
cd Go/authentication
npm ci
npm start
```

Dev mode with auto-reload:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

## Docker

```bash
cd Go/authentication
docker compose up -d
```

Notes:

- Uses `mongo:6` for local compose DB.
- Container includes `mongodb-tools` for backup tasks.
- MongoDB is no longer host-exposed by default.
- Auth service host exposure is loopback-only (`127.0.0.1:3002`).

## Production Deploy (Manual CD)

GitHub Actions workflow:

- `deploy-auth-prod`

Manual inputs:

- `image_ref` (for example `latest` or `sha-<commit>`)
- `deploy_root` (default `/media/adam/storage/Code/Go`)
- `service_name` (default `auth_service`)

Deployment behavior:

- Syncs prod repo to the selected branch ref
- Validates `authentication/.env` contains `DATABASE_URL` and `JWT_SECRET`
- Ensures `kafka_default` network exists
- Pulls target image and recreates `auth_service`
- Health checks with `GET /readyz` (expects `200`)
- Rolls back to previous image on failure when available

## Maintenance Notes

- Inactive social auth dependencies were removed to reduce attack surface.
- Vulnerability remediation was applied at patch level where non-breaking.
- CI workflow now validates install, JS syntax, integration tests, high-severity audit gate, and container security scan.
