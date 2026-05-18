# Pokemon DB Release Flow

`pokemon/data/pokego.db` is core production data. Do not delete it.

When `pokemon/data/pokego.db` changes on `main` or `master`, `ci-pokemon-data`
now:

1. runs the normal Pokemon quality gates;
2. builds, scans, and pushes the matching `sha-<commit>` Pokemon image;
3. validates and packages `pokego.db` as a checksumed artifact;
4. publishes a GitHub release named `pokemon-db-<commit>`.

Production promotion is manual through `deploy-pokemon-db-prod`. By default it
deploys the newest `pokemon-db-*` release with the matching `sha-<commit>`
Pokemon image from the DB manifest.

The prod install script backs up the existing DB under
`<deploy_root>/pokemon/data/backups/`, replaces the DB, recreates the Pokemon
container, checks `/readyz`, and restores the previous DB and image if readiness
fails.

The deploy workflow and install script default to `/srv/pokegonexus`.

Manual packaging:

```bash
bash ops/pokemon-db/package-pokemon-db.sh pokemon/data/pokego.db dist/pokemon-db "$(git rev-parse HEAD)"
```

Manual prod install from a package:

```bash
bash ops/pokemon-db/install-pokemon-db.sh \
  dist/pokemon-db/pokemon-db-*.tgz \
  /srv/pokegonexus \
  /path/to/checkout/pokemon/docker-compose.yml \
  adamwentworth/pokemon_service_go:sha-<commit>
```
