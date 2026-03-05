-- Crown-form mapping for Zacian/Zamazenta hero <-> crowned forms.
-- Safe to run multiple times.

BEGIN;

CREATE TABLE IF NOT EXISTS crown_forms (
  id INTEGER PRIMARY KEY,
  base_pokemon_id INTEGER NOT NULL,
  crown_pokemon_id INTEGER NOT NULL,
  display_form TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(base_pokemon_id, crown_pokemon_id)
);

INSERT OR IGNORE INTO crown_forms (id, base_pokemon_id, crown_pokemon_id, display_form, is_active)
VALUES
  (1, 2290, 888, 'Crowned Sword', 1),
  (2, 2292, 889, 'Crowned Shield', 1);

COMMIT;
