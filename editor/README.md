# Pokemon Catalog Editor

This Tkinter application is the internal authoring tool for the PokeGo Nexus
reference catalog. It edits Pokemon, moves, evolutions, shadows, costumes,
mega evolutions, fusions, gender-specific assets, backgrounds, and size data.

The production catalog lives in dedicated PostgreSQL. The checked-in SQLite
file is retained only as a recovery/import source and for local editor work.

## Setup

The editor needs Python 3.11+ with Tkinter. On Ubuntu:

```bash
sudo apt install python3-tk
cd editor
python -m venv .venv
./.venv/bin/pip install -r requirements.txt
```

## Production PostgreSQL

Copy `.env.example` to `.env` once, then update only
`POKEGO_EDITOR_PROD_HOST` when your server's local address changes. The other
values already match this deployment.

```bash
cd editor
cp .env.example .env
```

Normal catalog authoring is simply:

```bash
cd editor
python main.py
```

`main.py` reuses `editor/.venv` automatically when it exists. It creates a
retained PostgreSQL dump before the editor opens, starts a loopback-only SSH
tunnel, loads the publisher URL only into the editor process, and refreshes
and prewarms the Pokemon API cache after a normal editor exit. SSH asks for a
password only when your local SSH setup requires one.

The editor connects as `pokemon_catalog_publisher`, the schema-owning writer
role. It does not use the `postgres` superuser and the API continues to use
the separate read-only `pokemon_catalog_reader` role.

The window title identifies this target as `PRODUCTION PostgreSQL catalog`.
Close the editor normally after saving so the launcher can refresh the API
cache. If the editor or SSH session is interrupted after a save, run the cache
refresh script from the repository root:

```bash
ssh -i "$HOME/.ssh/pokegonexus_recovery_ed25519" adam@192.168.1.77 \
  'bash -s -- /srv/pokegonexus' \
  < ops/pokemon-catalog/refresh-api-cache-prod.sh
```

## Local Recovery Copy

Use this only for offline inspection or deliberate SQLite recovery-copy work:

```bash
cd editor
POKEGO_EDITOR_MODE=sqlite python main.py
```

The window title identifies this target as `SQLite recovery copy`.

## Data Safety

- The checked-in `.env.example` documents non-secret connection settings;
  the real `editor/.env` is ignored by Git. Shell variables take precedence
  when you need a one-off override.
- Each production editor session creates a compressed PostgreSQL dump under
  `/srv/pokegonexus/pokemon/catalog-backups`; the newest eight editor-session
  dumps are retained by default.
- Normal Pokemon service deployment applies versioned PostgreSQL schema
  migrations only. It does not replace catalog records from SQLite.
- The `rebuild-pokemon-catalog-from-sqlite-prod` GitHub workflow is a
  deliberately confirmed disaster-recovery action that replaces live catalog
  records from the checked-in SQLite copy.

## Tests

From the repository root:

```bash
editor/.venv/bin/python -m unittest discover -s editor/tests -p 'test_*.py' -v
PYTHON_BIN="$PWD/editor/.venv/bin/python" bash editor/tests/test-postgres-database-manager.sh
```

The PostgreSQL test imports a disposable catalog database and exercises the
editor's read, update, insert, and delete paths without touching production.
