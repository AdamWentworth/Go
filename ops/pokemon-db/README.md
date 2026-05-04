# Pokemon DB Release Flow

`pokemon/data/pokego.db` is core production data. Do not delete it.

When `pokemon/data/pokego.db` changes on `main` or `master`, `ci-pokemon-data`
now:

1. runs the normal Pokemon quality gates;
2. builds, scans, and pushes the matching `sha-<commit>` Pokemon image;
3. validates and packages `pokego.db` as a checksumed artifact;
4. publishes a GitHub release named `pokemon-db-<commit>`;
5. deploys the DB and matching image on the prod runner.

The prod install script backs up the existing DB under
`<deploy_root>/pokemon/data/backups/`, replaces the DB, recreates the Pokemon
container, checks `/readyz`, and restores the previous DB and image if readiness
fails.

The workflow uses the repository/org variable `PROD_DEPLOY_ROOT` when present;
otherwise it keeps the existing `/home/adam/deploy/Go` default.

Manual packaging:

```bash
bash ops/pokemon-db/package-pokemon-db.sh pokemon/data/pokego.db dist/pokemon-db "$(git rev-parse HEAD)"
```

Manual prod install from a package:

```bash
bash ops/pokemon-db/install-pokemon-db.sh \
  dist/pokemon-db/pokemon-db-*.tgz \
  /home/adam/deploy/Go \
  /path/to/checkout/pokemon/docker-compose.yml \
  adamwentworth/pokemon_service_go:sha-<commit>
```
