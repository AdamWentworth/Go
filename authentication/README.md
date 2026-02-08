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

## Routes

Mounted under `/auth`:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `PUT /auth/update/:id`
- `DELETE /auth/delete/:id`
- `POST /auth/reset-password/`
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
- Health checks with `POST /auth/login` (expects `404` or `401`)
- Rolls back to previous image on failure when available

## Maintenance Notes

- Inactive social auth dependencies were removed to reduce attack surface.
- Vulnerability remediation was applied at patch level where non-breaking.
- CI workflow now validates install, JS syntax, integration tests, high-severity audit gate, and container security scan.
