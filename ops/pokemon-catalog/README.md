# Pokemon Catalog PostgreSQL Operations

The reference catalog has a dedicated PostgreSQL service boundary beside the
Pokemon API in `pokemon/docker-compose.yml`.

## Topology

- `pokemon_catalog_db`: pinned official PostgreSQL container
- `pokemon_catalog_pgdata`: persistent named volume
- `pokemon_cache`: pinned, disposable Redis L2 response cache
- `pokemon_catalog_internal`: private API/database network
- `pokemon_catalog_reader`: read-only API role
- `pokemon_catalog_publisher`: editor and maintenance writer role
- `postgres`: bootstrap and human-administration superuser

Only `127.0.0.1:5433` is exposed on the host. The API connects through the
private Compose network at `pokemon_catalog_db:5432`.

Redis is exposed only on host loopback port `6380` for diagnostics. It has no
persistent volume and is not included in catalog backups. API deployment makes
a best-effort attempt to start it, but PostgreSQL and API health remain the
hard deployment requirements.

Private environment files live under `/srv/pokegonexus/pokemon`:

- `catalog-db.env`: database bootstrap credentials
- `catalog-publisher.env`: publisher connection settings
- `catalog-postgres.env`: read-only API settings

They must remain mode `640`, owned by `root` and the deployment-runner group.

## Provisioning

Provision a new host with the service compose file and
`provision-postgres.sh`:

```bash
sudo bash /tmp/provision-pokemon-catalog-postgres.sh \
  /srv/pokegonexus \
  /tmp/pokemon-docker-compose.yml
```

For an existing host, `repair-compose-env-access.sh` and
`repair-reader-settings.sh` repair private file access without rotating
credentials or changing catalog records.

`sync-bootstrap-admin-from-location-postgres.sh` can align the catalog
`postgres` superuser password with the location database while preserving the
least-privileged reader and publisher roles.

## Deployment And Authoring

Normal Pokemon deployment:

1. Starts or verifies `pokemon_catalog_db`.
2. Makes a best-effort start of the optional `pokemon_cache` service.
3. Applies versioned migrations with `cmd/catalog-migrate`.
4. Recreates `pokemon_data` with the read-only catalog URL.
5. Verifies `/healthz` and `/readyz`.

Normal authoring uses `editor/main.py`. It creates a private compressed dump,
opens the publisher tunnel, and refreshes the API cache on clean exit.

After an interrupted authoring session, refresh manually:

```bash
ssh -i ~/.ssh/pokegonexus_recovery_ed25519 adam@192.168.1.77 \
  'bash -s -- /srv/pokegonexus' \
  < ops/pokemon-catalog/refresh-api-cache-prod.sh
```

## Guardrails

```bash
bash ops/pokemon-catalog/test-repair-reader-settings.sh
bash ops/pokemon-catalog/test-repair-compose-env-access.sh
bash ops/pokemon-catalog/test-sync-bootstrap-admin-from-location-postgres.sh
bash ops/pokemon-catalog/test-refresh-api-cache-prod.sh
bash pokemon/scripts/test-postgres-catalog.sh
bash editor/tests/test-postgres-database-manager.sh
```

Recovery uses private PostgreSQL dumps and the independently retained cutover
archives. Catalog data is not packaged in public repository releases.
