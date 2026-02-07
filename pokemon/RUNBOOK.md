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

## SQLite Backup And Restore Drill

Use the PowerShell scripts in `pokemon/scripts/`:

- `sqlite_backup.ps1` creates timestamped backups including `-wal` and `-shm` when present.
- `sqlite_restore_drill.ps1` launches a temporary container from a backup and validates `/readyz`.

Run backup:

```powershell
powershell -ExecutionPolicy Bypass -File pokemon/scripts/sqlite_backup.ps1
```

Run restore drill:

```powershell
powershell -ExecutionPolicy Bypass -File pokemon/scripts/sqlite_restore_drill.ps1 -ImageRef adamwentworth/pokemon_data:latest
```
