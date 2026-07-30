SET @sql = IF(
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'friendships'
  ) AND NOT EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'friendships'
      AND index_name = 'idx_friendships_low_updated'
  ),
  'ALTER TABLE friendships ADD KEY idx_friendships_low_updated (user_id_low, updated_at, friendship_id)',
  'SELECT 1'
);
PREPARE migration_statement FROM @sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @sql = IF(
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'friendships'
  ) AND NOT EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'friendships'
      AND index_name = 'idx_friendships_high_updated'
  ),
  'ALTER TABLE friendships ADD KEY idx_friendships_high_updated (user_id_high, updated_at, friendship_id)',
  'SELECT 1'
);
PREPARE migration_statement FROM @sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

-- The production schema owns trades, while isolated storage test databases do
-- not. Keep this migration safe in both environments.
SET @sql = IF(
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'trades'
  ) AND NOT EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'trades'
      AND index_name = 'idx_trades_proposed_updated'
  ),
  'ALTER TABLE trades ADD KEY idx_trades_proposed_updated (user_id_proposed, last_update, trade_id)',
  'SELECT 1'
);
PREPARE migration_statement FROM @sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

SET @sql = IF(
  EXISTS(
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'trades'
  ) AND NOT EXISTS(
    SELECT 1 FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'trades'
      AND index_name = 'idx_trades_accepting_updated'
  ),
  'ALTER TABLE trades ADD KEY idx_trades_accepting_updated (user_id_accepting, last_update, trade_id)',
  'SELECT 1'
);
PREPARE migration_statement FROM @sql;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;
