# Editor Tests

These tests verify editor database manager behavior against an isolated
PostgreSQL catalog populated with a small synthetic fixture.

## Run

From repo root:

```bash
bash editor/tests/test-postgres-database-manager.sh
```

## Safety

- The harness starts a disposable PostgreSQL container.
- It applies the production migrations before loading synthetic test data.
- Inserts, updates, and deletes never target the production catalog.
