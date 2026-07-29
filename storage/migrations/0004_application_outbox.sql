CREATE TABLE IF NOT EXISTS application_outbox (
  event_id CHAR(36) NOT NULL,
  aggregate_type VARCHAR(32) NOT NULL,
  aggregate_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  recipient_user_ids JSON NOT NULL,
  source_device_id VARCHAR(128) NULL,
  payload JSON NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  processed_at DATETIME(6) NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_error VARCHAR(500) NULL,
  PRIMARY KEY (event_id),
  KEY idx_application_outbox_pending (processed_at, next_attempt_at, created_at),
  KEY idx_application_outbox_aggregate (aggregate_type, aggregate_id)
) ENGINE=InnoDB;
