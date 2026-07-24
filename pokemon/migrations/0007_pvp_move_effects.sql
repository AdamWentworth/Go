ALTER TABLE pokemon_catalog.moves
  ADD COLUMN IF NOT EXISTS pvp_attacker_attack_stage_change INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pvp_attacker_defense_stage_change INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pvp_target_attack_stage_change INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pvp_target_defense_stage_change INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pvp_buff_activation_chance DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE pokemon_catalog.moves
  DROP CONSTRAINT IF EXISTS moves_pvp_stage_changes_valid,
  DROP CONSTRAINT IF EXISTS moves_pvp_buff_activation_chance_valid;

ALTER TABLE pokemon_catalog.moves
  ADD CONSTRAINT moves_pvp_stage_changes_valid CHECK (
    pvp_attacker_attack_stage_change BETWEEN -4 AND 4
    AND pvp_attacker_defense_stage_change BETWEEN -4 AND 4
    AND pvp_target_attack_stage_change BETWEEN -4 AND 4
    AND pvp_target_defense_stage_change BETWEEN -4 AND 4
  ),
  ADD CONSTRAINT moves_pvp_buff_activation_chance_valid CHECK (
    pvp_buff_activation_chance BETWEEN 0 AND 1
  );

COMMENT ON COLUMN pokemon_catalog.moves.pvp_buff_activation_chance IS
  'Chance from the Pokemon GO combatMove Game Master. Simulation applies chance effects deterministically.';
