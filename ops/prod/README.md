# Production Deploy State

The deploy workflows use GitHub's fresh checkout for compose definitions and use
`deploy_root` only as prod-local state:

- `.env` files
- service backups and logs
- Pokemon SQLite data
- Kafka and monitoring data

The current default remains `/home/adam/deploy/Go` for compatibility. To move to a
clean state-only root, copy the state first:

```bash
bash ops/prod/migrate-deploy-state.sh /home/adam/deploy/Go /home/adam/deploy/state
```

Then run one deploy manually with:

```text
deploy_root=/home/adam/deploy/state
```

After all services have deployed successfully from the new root, update workflow
defaults from `/home/adam/deploy/Go` to `/home/adam/deploy/state`.

## Pokemon Database

`pokemon/data/pokego.db` is core application data. Do not delete it.

The current release model is:

1. CI detects changes to `pokemon/data/pokego.db`.
2. CI packages the DB as a checksumed artifact and GitHub release.
3. Prod backs up the existing DB before replacing it.
4. Prod deploys the DB with the matching `sha-<commit>` Pokemon image.
5. Prod verifies `/readyz` and rolls back DB plus image on failure.

Untracking the file is not the same thing as deleting it, but it must only happen
after prod is using this artifact flow comfortably.
