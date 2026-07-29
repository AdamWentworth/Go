CREATE TABLE IF NOT EXISTS processed_sync_batches (
  sync_batch_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  processed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (sync_batch_id, user_id),
  KEY idx_processed_sync_batches_time (processed_at)
) ENGINE=InnoDB;
