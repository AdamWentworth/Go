BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS fusion_background_combo_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fusion_id INTEGER NOT NULL,
  member1_background_id INTEGER NOT NULL,
  member2_background_id INTEGER NOT NULL,
  combo_background_id INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fusion_id) REFERENCES fusion_pokemon(fusion_id),
  FOREIGN KEY (member1_background_id) REFERENCES backgrounds(background_id),
  FOREIGN KEY (member2_background_id) REFERENCES backgrounds(background_id),
  FOREIGN KEY (combo_background_id) REFERENCES backgrounds(background_id),
  UNIQUE (fusion_id, member1_background_id, member2_background_id, combo_background_id)
);

CREATE INDEX IF NOT EXISTS idx_fusion_bg_combo_rules_fusion_id
ON fusion_background_combo_rules (fusion_id);

INSERT INTO fusion_background_combo_rules (
  fusion_id,
  member1_background_id,
  member2_background_id,
  combo_background_id,
  is_active,
  notes
) VALUES
  (1, 18, 16, 20, 1, 'Dusk Mane combo background'),
  (2, 18, 17, 19, 1, 'Dawn Wings combo background')
ON CONFLICT(fusion_id, member1_background_id, member2_background_id, combo_background_id)
DO UPDATE SET
  is_active = excluded.is_active,
  notes = excluded.notes,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;
