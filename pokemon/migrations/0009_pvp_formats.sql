CREATE TABLE IF NOT EXISTS pokemon_catalog.pvp_ranking_formats (
  snapshot_id TEXT NOT NULL
    REFERENCES pokemon_catalog.pvp_ranking_snapshots(snapshot_id) ON DELETE CASCADE,
  format_key TEXT NOT NULL,
  league TEXT NOT NULL CHECK (league IN ('little', 'great', 'ultra', 'master')),
  title TEXT NOT NULL,
  cup TEXT NOT NULL,
  cp_limit INTEGER,
  rules JSONB NOT NULL DEFAULT '[]'::JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_cup BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (snapshot_id, format_key)
);

INSERT INTO pokemon_catalog.pvp_ranking_formats (
  snapshot_id,
  format_key,
  league,
  title,
  cup,
  cp_limit,
  rules,
  sort_order,
  is_cup
)
SELECT
  snapshot_id,
  league,
  league,
  CASE league
    WHEN 'great' THEN 'Great League'
    WHEN 'ultra' THEN 'Ultra League'
    ELSE 'Master League'
  END,
  'all',
  CASE league
    WHEN 'great' THEN 1500
    WHEN 'ultra' THEN 2500
    ELSE NULL
  END,
  '[]'::JSONB,
  CASE league
    WHEN 'great' THEN 0
    WHEN 'ultra' THEN 1
    ELSE 2
  END,
  FALSE
FROM pokemon_catalog.pvp_rankings
GROUP BY snapshot_id, league
ON CONFLICT (snapshot_id, format_key) DO NOTHING;

ALTER TABLE pokemon_catalog.pvp_rankings
  ADD COLUMN IF NOT EXISTS format_key TEXT;

UPDATE pokemon_catalog.pvp_rankings
SET format_key = league
WHERE format_key IS NULL;

ALTER TABLE pokemon_catalog.pvp_rankings
  ALTER COLUMN format_key SET NOT NULL;

ALTER TABLE pokemon_catalog.pvp_rankings
  DROP CONSTRAINT IF EXISTS pvp_rankings_league_check;

ALTER TABLE pokemon_catalog.pvp_rankings
  ADD CONSTRAINT pvp_rankings_league_check
  CHECK (league IN ('little', 'great', 'ultra', 'master'));

ALTER TABLE pokemon_catalog.pvp_rankings
  DROP CONSTRAINT IF EXISTS pvp_rankings_pkey,
  DROP CONSTRAINT IF EXISTS pvp_rankings_snapshot_id_league_rank_key;

ALTER TABLE pokemon_catalog.pvp_rankings
  ADD PRIMARY KEY (snapshot_id, format_key, species_id),
  ADD UNIQUE (snapshot_id, format_key, rank),
  ADD CONSTRAINT pvp_rankings_format_fk
    FOREIGN KEY (snapshot_id, format_key)
    REFERENCES pokemon_catalog.pvp_ranking_formats(snapshot_id, format_key)
    ON DELETE CASCADE;

DROP INDEX IF EXISTS pokemon_catalog.idx_pvp_rankings_active_read;

CREATE INDEX idx_pvp_rankings_active_read
  ON pokemon_catalog.pvp_rankings(snapshot_id, format_key, rank);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'pokemon_catalog_reader'
  ) THEN
    EXECUTE 'GRANT SELECT ON pokemon_catalog.pvp_ranking_formats TO pokemon_catalog_reader';
  END IF;
END $$;
