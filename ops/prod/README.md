# Production Deploy State

The deploy workflows use GitHub's fresh checkout for compose definitions and use
`deploy_root` only as prod-local state:

- `.env` files
- service backups and logs
- Pokemon SQLite data
- Kafka and monitoring data

The workflow default is `/srv/pokegonexus`. The existing repo checkout can
stay at `/home/adam/deploy/Go`; the point is only to move durable runtime state
out of that checkout. Before triggering deploys against a prod host that still
keeps state under the source checkout, create the runtime root and copy the
state first:

```bash
sudo mkdir -p /srv/pokegonexus
sudo chown -R adam:adam /srv/pokegonexus
bash ops/prod/migrate-deploy-state.sh /home/adam/deploy/Go /srv/pokegonexus
```

The migration script copies files only when the target path is missing, so it is
safe to rerun while preparing the new state root.

## Pokemon Database

`pokemon/data/pokego.db` is core application data. Do not delete it.

The current release model is:

1. CI detects changes to `pokemon/data/pokego.db`.
2. CI packages the DB as a checksumed artifact and GitHub release.
3. Manual CD (`deploy-pokemon-db-prod`) selects a DB release to promote.
4. Prod backs up the existing DB before replacing it.
5. Prod deploys the DB with the matching `sha-<commit>` Pokemon image by default.
6. Prod verifies `/readyz` and rolls back DB plus image on failure.

Untracking the file is not the same thing as deleting it, but it must only happen
after prod is using this artifact flow comfortably.
