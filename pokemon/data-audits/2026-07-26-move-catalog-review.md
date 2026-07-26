# Move and movepool catalog review

Reviewed on 2026-07-26.

## Source

- Pinned PokeMiners Game Master:
  <https://github.com/PokeMiners/game_masters/tree/5ac6c0edd9315644d5ead8f45847157126ba73cd>
- Reviewed Game Master commit: `5ac6c0edd9315644d5ead8f45847157126ba73cd`

The pinned commit was still the current Game Master commit at review time.

## Catalog result

- Game Master moves reviewed: 322
- Standard Pokémon movepools matched: 1,274
- Fusion movepools matched: 4
- Move-stat rows corrected: 98
- Remaining move-stat drift: 0
- Remaining movepool additions, updates, or removals: 0

The final dry run is idempotent: it proposes no move inserts, stat changes, or
movepool changes.

## Updater correction

The refresh utility previously normalized `Aeroblast+` to `Aeroblast` and
`Sacred Fire+` to `Sacred Fire`. That could repeatedly rewrite the six Apex move
rows even after a successful refresh. Plus-suffixed move names now retain their
identity, duplicate catalog rows are updated deterministically, and assignments
prefer a stable existing move ID.

Regression tests cover the Apex normalization and duplicate-row behavior.
