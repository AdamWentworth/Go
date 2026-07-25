CREATE TABLE IF NOT EXISTS pokemon_variant_rankings (
  variant_id VARCHAR(191) NOT NULL,
  wanted_user_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  most_wanted_user_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  caught_user_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (variant_id),
  KEY idx_variant_rankings_wanted (wanted_user_count DESC, caught_user_count ASC, variant_id),
  KEY idx_variant_rankings_rarest (caught_user_count ASC, wanted_user_count DESC, variant_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pokemon_rankings_snapshot (
  snapshot_key TINYINT UNSIGNED NOT NULL,
  collector_user_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  wishlist_user_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (snapshot_key),
  CONSTRAINT chk_pokemon_rankings_snapshot_key CHECK (snapshot_key = 1)
) ENGINE=InnoDB;

SET @wanted_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'instances'
    AND index_name = 'idx_instances_variant_wanted_user'
);
SET @wanted_index_sql = IF(
  @wanted_index_exists = 0,
  'CREATE INDEX idx_instances_variant_wanted_user ON instances (variant_id, is_wanted, disabled, user_id)',
  'SELECT 1'
);
PREPARE wanted_index_statement FROM @wanted_index_sql;
EXECUTE wanted_index_statement;
DEALLOCATE PREPARE wanted_index_statement;

SET @caught_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'instances'
    AND index_name = 'idx_instances_variant_caught_user'
);
SET @caught_index_sql = IF(
  @caught_index_exists = 0,
  'CREATE INDEX idx_instances_variant_caught_user ON instances (variant_id, is_caught, disabled, user_id)',
  'SELECT 1'
);
PREPARE caught_index_statement FROM @caught_index_sql;
EXECUTE caught_index_statement;
DEALLOCATE PREPARE caught_index_statement;
