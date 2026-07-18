ALTER TABLE pokemon_catalog.raid_bosses
  ADD COLUMN IF NOT EXISTS shield_count INTEGER;

ALTER TABLE pokemon_catalog.raid_bosses
  DROP CONSTRAINT IF EXISTS raid_bosses_shield_count_check;

ALTER TABLE pokemon_catalog.raid_bosses
  ADD CONSTRAINT raid_bosses_shield_count_check
  CHECK (shield_count IS NULL OR shield_count > 0);

UPDATE pokemon_catalog.raid_bosses
SET shield_count = CASE pokemon_id
  WHEN 71 THEN 8
  WHEN 149 THEN 10
  WHEN 150 THEN 10
  WHEN 227 THEN 7
  WHEN 687 THEN 8
  WHEN 870 THEN 8
  ELSE shield_count
END
WHERE LOWER(COALESCE(tier, '')) = 'super_mega'
  AND pokemon_id IN (71, 149, 150, 227, 687, 870);
