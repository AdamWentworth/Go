CREATE TABLE IF NOT EXISTS pokemon_catalog.pvp_ranking_snapshots (
  snapshot_id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_version TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_license TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS pvp_ranking_snapshots_one_active
  ON pokemon_catalog.pvp_ranking_snapshots ((is_active))
  WHERE is_active;

CREATE TABLE IF NOT EXISTS pokemon_catalog.pvp_rankings (
  snapshot_id TEXT NOT NULL
    REFERENCES pokemon_catalog.pvp_ranking_snapshots(snapshot_id) ON DELETE CASCADE,
  league TEXT NOT NULL CHECK (league IN ('great', 'ultra', 'master')),
  rank INTEGER NOT NULL CHECK (rank > 0),
  source_rank INTEGER NOT NULL CHECK (source_rank > 0),
  species_id TEXT NOT NULL,
  species_name TEXT NOT NULL,
  pokemon_id INTEGER REFERENCES pokemon_catalog.pokemon(pokemon_id) ON DELETE CASCADE,
  fusion_id INTEGER REFERENCES pokemon_catalog.fusion_pokemon(fusion_id) ON DELETE CASCADE,
  variant_kind TEXT NOT NULL CHECK (variant_kind IN ('pokemon', 'shadow', 'fusion', 'crown')),
  image_url TEXT NOT NULL,
  types JSONB NOT NULL,
  moveset JSONB NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  rating DOUBLE PRECISION NOT NULL,
  category_scores JSONB NOT NULL DEFAULT '[]'::JSONB,
  recommended_level DOUBLE PRECISION NOT NULL,
  attack_iv INTEGER NOT NULL CHECK (attack_iv BETWEEN 0 AND 15),
  defense_iv INTEGER NOT NULL CHECK (defense_iv BETWEEN 0 AND 15),
  stamina_iv INTEGER NOT NULL CHECK (stamina_iv BETWEEN 0 AND 15),
  stat_product DOUBLE PRECISION,
  battle_attack DOUBLE PRECISION,
  battle_defense DOUBLE PRECISION,
  battle_hp INTEGER,
  PRIMARY KEY (snapshot_id, league, species_id),
  UNIQUE (snapshot_id, league, rank),
  CHECK (
    (variant_kind = 'fusion' AND fusion_id IS NOT NULL)
    OR (variant_kind <> 'fusion' AND pokemon_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_pvp_rankings_active_read
  ON pokemon_catalog.pvp_rankings(snapshot_id, league, rank);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'pokemon_catalog_reader'
  ) THEN
    EXECUTE 'GRANT USAGE ON SCHEMA pokemon_catalog TO pokemon_catalog_reader';
    EXECUTE 'GRANT SELECT ON pokemon_catalog.pvp_ranking_snapshots TO pokemon_catalog_reader';
    EXECUTE 'GRANT SELECT ON pokemon_catalog.pvp_rankings TO pokemon_catalog_reader';
  END IF;
END $$;
