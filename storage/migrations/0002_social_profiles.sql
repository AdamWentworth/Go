CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(191) NOT NULL,
  bio VARCHAR(280) NULL,
  profile_visibility VARCHAR(16) NOT NULL DEFAULT 'public',
  collection_visibility VARCHAR(16) NOT NULL DEFAULT 'public',
  friend_request_permission VARCHAR(16) NOT NULL DEFAULT 'everyone',
  trainer_code_visibility VARCHAR(16) NOT NULL DEFAULT 'friends',
  show_location TINYINT(1) NOT NULL DEFAULT 0,
  show_pokemon_go_name TINYINT(1) NOT NULL DEFAULT 1,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS friendships (
  friendship_id CHAR(36) NOT NULL,
  user_id_low VARCHAR(191) NOT NULL,
  user_id_high VARCHAR(191) NOT NULL,
  requested_by_user_id VARCHAR(191) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
    ON UPDATE CURRENT_TIMESTAMP(6),
  accepted_at DATETIME(6) NULL,
  PRIMARY KEY (friendship_id),
  UNIQUE KEY uq_friendships_pair (user_id_low, user_id_high),
  KEY idx_friendships_low_status (user_id_low, status),
  KEY idx_friendships_high_status (user_id_high, status),
  KEY idx_friendships_requester_status (requested_by_user_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_user_id VARCHAR(191) NOT NULL,
  blocked_user_id VARCHAR(191) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  KEY idx_user_blocks_blocked (blocked_user_id)
) ENGINE=InnoDB;
