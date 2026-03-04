# Editor Tests

These tests verify editor database manager behavior against an isolated temporary copy of `pokego.db`.

## Run

From repo root:

```bash
python -m unittest discover -s editor/tests -p "test_*.py" -v
```

## Safety

- Every test copies `pokemon/data/pokego.db` into a temp directory.
- Inserts/updates/deletes only run against that temp file.
- The real DB is never modified by the test suite.
