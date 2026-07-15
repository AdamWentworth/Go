# Pokemon Service Runbook

This runbook is for one-host Docker deployments (no Ansible required).

## Deployment Model

Prefer:

1. Build once in CI.
2. Push image to DockerHub.
3. Deploy by immutable image digest on prod.

Avoid building directly on prod unless you are troubleshooting.

## CI DockerHub Push Prerequisites

Set these in GitHub Actions:

- Secret: `DOCKERHUB_TOKEN` (DockerHub access token)

The CI workflow currently pushes to a hardcoded image repository:
`adamwentworth/pokemon_service_go`.

The workflow tags and pushes:

- `adamwentworth/pokemon_service_go:sha-<git-sha>`
- `adamwentworth/pokemon_service_go:latest`

## Deploy By Digest

After CI publishes, grab the pushed digest and deploy exactly that image:

```bash
docker pull <user>/<repo>:sha-<git-sha>
docker inspect --format='{{index .RepoDigests 0}}' <user>/<repo>:sha-<git-sha>
```

Use the digest in your compose/image reference.

## Rollback

Keep the previous known-good digest in your release notes.

Rollback steps:

1. Update service image to previous digest.
2. Restart only the pokemon container.
3. Verify:
   - `GET /healthz` returns `200`
   - `GET /readyz` returns `200`
   - Prometheus target `pokemon_data` is `up`

## Catalog PostgreSQL Operations

`pokemon_data` reads the reference catalog from the dedicated
`pokemon_catalog_db` PostgreSQL container. The runtime account is
`pokemon_catalog_reader`; catalog authoring uses the separate
`pokemon_catalog_publisher` role through the editor launcher documented in
`editor/README.md`.

Normal API deployments apply any pending migrations through
`go run ./cmd/catalog-migrate` before recreating the API container. They do not
import SQLite data.

Before every production editor session, the launcher creates a compressed dump
in `/srv/pokegonexus/pokemon/catalog-backups`. The newest eight editor-session
dumps are retained by default. To refresh the API cache manually after an
interrupted editor session, run:

```bash
ssh -i "$HOME/.ssh/pokegonexus_recovery_ed25519" adam@192.168.1.77 \
  'bash -s -- /srv/pokegonexus' \
  < ops/pokemon-catalog/refresh-api-cache-prod.sh
```

The checked-in SQLite catalog is a recovery source and local parity fixture.
Use `rebuild-pokemon-catalog-from-sqlite-prod` only for an explicitly confirmed
recovery rebuild of the live PostgreSQL catalog.
