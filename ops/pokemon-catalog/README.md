# Pokemon Catalog PostgreSQL Flow

The Pokemon reference catalog has its own PostgreSQL service boundary, defined
directly beside `pokemon_data` in `pokemon/docker-compose.yml`. It is not
stored in the location/PostGIS database: this keeps ownership, storage,
backups, upgrades, and future cloud placement independent.

## Runtime Topology

- `pokemon_catalog_db`: dedicated official PostgreSQL container, pinned by
  digest for reproducible deployments.
- `pokemon_catalog_pgdata`: its named Docker volume.
- `pokemon_catalog_internal`: an isolated Compose-managed Docker network shared
  only by `pokemon_data` and `pokemon_catalog_db`.
- `pokemon_catalog_publisher`: schema owner used only by catalog publishing.
- `pokemon_catalog_reader`: read-only account used by the Pokemon API after
  cutover.

The database exposes only `127.0.0.1:5433` to the host for the publisher. The
API uses the internal hostname `pokemon_catalog_db:5432`; no catalog database
port is exposed to the public network.

No credentials are committed. Provisioning writes mode-600 files under the
production deploy root:

- `pokemon/catalog-db.env`: the container bootstrap credential.
- `pokemon/catalog-publisher.env`: publisher-only connection details.
- `pokemon/catalog-postgres.env`: reader settings for the later API cutover.

## First Provisioning

Copy `pokemon/docker-compose.yml` and `ops/pokemon-catalog/provision-postgres.sh`
to the production host, then run:

```bash
sudo bash /tmp/provision-postgres.sh \
  /srv/pokegonexus \
  /tmp/pokemon-docker-compose.yml
```

It installs the service compose file, starts the dedicated database, generates
private credentials, and creates the read/write roles. It does not change
`pokemon/.env`, restart the Pokemon API, or change serving behavior.

After provisioning, `deploy-pokemon-catalog-db-prod` is the manual workflow
that updates only this database service's compose configuration and verifies
its health. It preserves `pokemon_catalog_pgdata` and never restarts the
Pokemon API.

## Publishing

The manual `publish-pokemon-catalog-prod` GitHub Action imports the checked-in
SQLite catalog directly into the dedicated Postgres service. It takes a schema
dump first, imports in one transaction, verifies the active revision, grants
the reader role, and retains four rolling dumps by default.

The workflow never creates a public GitHub Release. The API remains on SQLite
until a separate cutover changes its private runtime environment to the reader
settings and verifies `/readyz` plus byte-for-byte payload parity.

## Guardrail

Run the full publisher drill locally or in CI:

```bash
bash ops/pokemon-catalog/test-publisher.sh
```

It starts the same `pokemon/docker-compose.yml` database service in an ephemeral environment,
provisions roles, proves the reader can select but cannot write, publishes two
catalog revisions, then restores the retained dump and verifies the prior
revision is active again.
