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

No credentials are committed. Provisioning writes private files under the
production deploy root:

- `pokemon/catalog-db.env`: mode 600 container bootstrap credential.
- `pokemon/catalog-publisher.env`: publisher-only connection details. When
  provisioned through `sudo`, it is mode 640 for `root` and the invoking
  deployment-runner user's group so the self-hosted publish workflow can read
  only this credential.
- `pokemon/catalog-postgres.env`: read-only API settings. When provisioned
  through `sudo`, it is mode 640 for `root` and the invoking deployment-runner
  user's group so the guarded cutover can configure the service with the
  least-privileged catalog account. It also contains a reader-only loopback URL
  used only to prove live SQLite/PostgreSQL payload parity before cutover.

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
until the manual `cutover-pokemon-catalog-postgres-prod` workflow runs. The
cutover proves byte-for-byte parity between the actual production SQLite file
and PostgreSQL through the read-only account, backs up `pokemon/.env`, switches
only the private runtime settings, and checks `/readyz`. If the replacement API
does not become ready, it restores both the prior environment and image. The
SQLite file remains in place after a successful cutover.

## Guardrail

Run the full publisher drill locally or in CI:

```bash
bash ops/pokemon-catalog/test-publisher.sh
```

It starts the same `pokemon/docker-compose.yml` database service in an ephemeral environment,
provisions roles, proves the reader can select but cannot write, publishes two
catalog revisions, then restores the retained dump and verifies the prior
revision is active again.

The CI runtime-environment test separately proves the cutover can replace only
the catalog driver settings, preserve unrelated runtime configuration, keep a
private backup, and restore the SQLite configuration exactly.

## Existing Provisioned Hosts

Hosts provisioned before the reader parity URL was added can be updated without
rotating credentials. Copy `repair-reader-settings.sh` to the host and run:

```bash
sudo bash /tmp/repair-reader-settings.sh /srv/pokegonexus
```

It derives a loopback-only URL for the existing read-only account and changes
the reader file to `root:<deployment-runner-group>` mode 640. It does not alter
the database, catalog contents, publisher credentials, SQLite file, or running
Pokemon API.
