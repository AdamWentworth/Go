# Pokemon Catalog PostgreSQL Flow

This directory introduces a private, direct publication path for the Pokemon
reference catalog. It is intentionally staged beside the current SQLite and
GitHub-release path; do not retire the old path until the service is reading
PostgreSQL in production and rollback has been exercised.

## Roles And Databases

The existing PostgreSQL 17 / PostGIS host gets one separate logical database:

- `pokemon_catalog`: catalog source of truth.
- `pokemon_catalog_publisher`: schema owner used only by the publish workflow.
- `pokemon_catalog_reader`: read-only account used by the Pokemon API after
  cutover.

No credentials are committed. Provisioning writes two mode-600 files under the
prod deploy root:

- `pokemon/catalog-publisher.env`: publisher-only connection details.
- `pokemon/catalog-postgres.env`: reader settings for the later API cutover.

## First Provisioning

Run this once on the production host after a current backup and while the
existing SQLite service is still healthy:

```bash
bash ops/pokemon-catalog/provision-postgres.sh /srv/pokegonexus
```

It does not change `pokemon/.env` or restart the Pokemon API.

## Publishing

The manual `publish-pokemon-catalog-prod` GitHub Action imports the checked-in
SQLite catalog directly into PostgreSQL. It takes a schema dump of the current
PostgreSQL catalog first, imports in one transaction, verifies the active
revision, grants the reader role, and retains four rolling dumps by default.

The workflow never creates a public GitHub Release. The API remains on SQLite
until a separate cutover changes its private runtime environment to the reader
settings and verifies `/readyz` plus payload parity.

## Guardrail

Run the full publisher drill locally or in CI:

```bash
bash ops/pokemon-catalog/test-publisher.sh
```

It creates an ephemeral PostgreSQL container, provisions roles, proves the API
reader can select but cannot write, publishes two catalog revisions, then
restores the retained dump and verifies the prior revision is active again.
