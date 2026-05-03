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

The desired future model is:

1. Keep `pokego.db` as an explicit release artifact.
2. Back up prod before replacing it.
3. Copy the new DB to prod state.
4. Verify checksum and `/readyz`.
5. Only then consider removing it from Git tracking with `git rm --cached`.

Untracking the file is not the same thing as deleting it, but it must only happen
after prod is using the state-only DB path.
