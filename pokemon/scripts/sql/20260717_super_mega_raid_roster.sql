-- Super Mega raid roster and matching Mega Evolution catalog forms.
--
-- This script is intentionally idempotent. It updates authored stats and raid
-- metadata, inserts missing forms, and preserves every existing image field.
-- Future forms may be authored ahead of release; clients gate them by
-- mega_evolution.date_available.
--
-- Official event sources checked July 17, 2026:
-- - https://pokemongo.com/gotour/global?hl=en
-- - https://pokemongo.com/news/mega-evolution-2026-update
-- - https://pokemongo.com/news/falinks-super-mega-raid-day-2026?hl=en
-- - https://pokemongo.com/news/skarmory-super-mega-raid-day-2026?hl=en
-- - https://pokemongo.com/news/mega-mewtwo-gofest-2026?game_client=ios
-- - https://pokemongo.com/en/news/raichu-super-mega-raid-day-2026
-- - https://pokemongo.com/en/news/starmie-super-mega-raid-day-2026

BEGIN;

SET LOCAL search_path = pokemon_catalog, public;

CREATE TEMP TABLE desired_super_mega_forms (
  pokemon_id INTEGER NOT NULL,
  form TEXT NOT NULL,
  mega_energy_cost INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  defense INTEGER NOT NULL,
  stamina INTEGER NOT NULL,
  type_1_name TEXT NOT NULL,
  type_2_name TEXT,
  date_available TEXT NOT NULL,
  cp40 INTEGER NOT NULL,
  hp40 INTEGER NOT NULL,
  cp50 INTEGER NOT NULL,
  hp50 INTEGER NOT NULL,
  image_url TEXT,
  image_url_shiny TEXT,
  PRIMARY KEY (pokemon_id, form)
) ON COMMIT DROP;

INSERT INTO desired_super_mega_forms VALUES
  (71,  'Normal', 300, 265, 181, 190, 'Grass',    'Poison',   '2026-02-28', 3505, 162, 3963, 172, '/images/mega/mega_71.png?v=27deed1468b6', '/images/shiny_mega/shiny_mega_71.png?v=f6be71e940e3'),
  (149, 'Normal', 300, 299, 255, 209, 'Dragon',   'Flying',   '2026-02-28', 4823, 177, 5452, 188, '/images/mega/mega_149.png?v=ce7be8405884', '/images/shiny_mega/shiny_mega_149.png?v=39a65c4aaef5'),
  (687, 'Normal', 300, 208, 222, 200, 'Dark',     'Psychic',  '2026-03-01', 3143, 169, 3554, 180, '/images/mega/mega_687.png?v=f3fc0a495f8e', '/images/shiny_mega/shiny_mega_687.png?v=3bb8fe0858d6'),
  (870, 'Normal', 300, 267, 229, 163, 'Fighting', NULL,       '2026-05-23', 3670, 140, 4149, 149, '/images/mega/mega_870.png?v=927159064d01', '/images/shiny_mega/shiny_mega_870.png?v=a6577ca4bb48'),
  (150, 'X',      300, 399, 215, 228, 'Psychic',  'Fighting', '2026-05-25', 6112, 192, 6910, 204, '/images/mega/mega_150_X.png?v=f501b371423b', '/images/shiny_mega/shiny_mega_150_X.png?v=61ac40fa139c'),
  (150, 'Y',      300, 413, 223, 228, 'Psychic',  NULL,       '2026-05-25', 6428, 192, 7267, 204, '/images/mega/mega_150_Y.png?v=8f90dcbc9bb8', '/images/shiny_mega/shiny_mega_150_Y.png?v=328b588b2583'),
  (227, 'Normal', 300, 273, 228, 163, 'Steel',    'Flying',   '2026-06-27', 3741, 140, 4229, 149, '/images/mega/mega_227.png?v=cb53309b3310', '/images/shiny_mega/shiny_mega_227.png?v=be11cd4dd6fd'),
  (26,  'X',      300, 277, 203, 155, 'Electric', NULL,       '2026-07-18', 3510, 134, 3969, 142, '/images/mega/mega_26_X.png?v=449c6259b75a', '/images/shiny_mega/shiny_mega_26_X.png?v=2b10f58df5ea'),
  (26,  'Y',      300, 339, 157, 155, 'Electric', NULL,       '2026-07-18', 3780, 134, 4274, 142, '/images/mega/mega_26_Y.png?v=26570c047433', '/images/shiny_mega/shiny_mega_26_Y.png?v=c57577050e6a'),
  (121, 'Normal', 300, 276, 229, 155, 'Water',    'Psychic',  '2026-08-22', 3701, 134, 4184, 142, '/images/mega/mega_121.png?v=c0d132197291', '/images/shiny_mega/shiny_mega_121.png?v=2bb8beb55d19');

DO $$
DECLARE
  missing_pokemon TEXT;
  missing_types TEXT;
BEGIN
  SELECT STRING_AGG(d.pokemon_id::TEXT, ', ' ORDER BY d.pokemon_id)
    INTO missing_pokemon
  FROM desired_super_mega_forms d
  LEFT JOIN pokemon p ON p.pokemon_id = d.pokemon_id
  WHERE p.pokemon_id IS NULL;

  IF missing_pokemon IS NOT NULL THEN
    RAISE EXCEPTION 'Super Mega roster references missing Pokemon: %', missing_pokemon;
  END IF;

  SELECT STRING_AGG(required.name, ', ' ORDER BY required.name)
    INTO missing_types
  FROM (
    SELECT type_1_name AS name FROM desired_super_mega_forms
    UNION
    SELECT type_2_name FROM desired_super_mega_forms WHERE type_2_name IS NOT NULL
  ) required
  LEFT JOIN types t ON LOWER(t.name) = LOWER(required.name)
  WHERE t.type_id IS NULL;

  IF missing_types IS NOT NULL THEN
    RAISE EXCEPTION 'Super Mega roster references missing types: %', missing_types;
  END IF;
END $$;

UPDATE mega_evolution me
SET mega_energy_cost = desired.mega_energy_cost,
    attack = desired.attack,
    defense = desired.defense,
    stamina = desired.stamina,
    primal = NULL,
    form = CASE WHEN desired.form = 'Normal' THEN NULL ELSE desired.form END,
    type_1_id = (SELECT type_id FROM types WHERE LOWER(name) = LOWER(desired.type_1_name)),
    type_2_id = (SELECT type_id FROM types WHERE LOWER(name) = LOWER(desired.type_2_name)),
    date_available = desired.date_available
FROM desired_super_mega_forms desired
WHERE me.pokemon_id = desired.pokemon_id
  AND COALESCE(NULLIF(LOWER(BTRIM(me.form)), ''), 'normal') = LOWER(desired.form);

WITH missing AS (
  SELECT desired.*,
         ROW_NUMBER() OVER (ORDER BY desired.pokemon_id, desired.form) AS offset_id
  FROM desired_super_mega_forms desired
  WHERE NOT EXISTS (
    SELECT 1
    FROM mega_evolution me
    WHERE me.pokemon_id = desired.pokemon_id
      AND COALESCE(NULLIF(LOWER(BTRIM(me.form)), ''), 'normal') = LOWER(desired.form)
  )
), next_id AS (
  SELECT COALESCE(MAX(id), 0) AS max_id FROM mega_evolution
)
INSERT INTO mega_evolution (
  id, pokemon_id, mega_energy_cost, attack, defense, stamina, image_url,
  image_url_shiny, sprite_url, primal, form, type_1_id, type_2_id,
  date_available
)
SELECT next_id.max_id + missing.offset_id,
       missing.pokemon_id,
       missing.mega_energy_cost,
       missing.attack,
       missing.defense,
       missing.stamina,
       missing.image_url,
       missing.image_url_shiny,
       NULL,
       NULL,
       CASE WHEN missing.form = 'Normal' THEN NULL ELSE missing.form END,
       (SELECT type_id FROM types WHERE LOWER(name) = LOWER(missing.type_1_name)),
       (SELECT type_id FROM types WHERE LOWER(name) = LOWER(missing.type_2_name)),
       missing.date_available
FROM missing
CROSS JOIN next_id;

INSERT INTO mega_cp_stats (mega_id, level_id, cp, hp)
SELECT me.id, cp.level_id, cp.cp, cp.hp
FROM desired_super_mega_forms desired
JOIN mega_evolution me
  ON me.pokemon_id = desired.pokemon_id
 AND COALESCE(NULLIF(LOWER(BTRIM(me.form)), ''), 'normal') = LOWER(desired.form)
CROSS JOIN LATERAL (
  VALUES
    (40::DOUBLE PRECISION, desired.cp40, desired.hp40),
    (50::DOUBLE PRECISION, desired.cp50, desired.hp50)
) AS cp(level_id, cp, hp)
ON CONFLICT (mega_id, level_id) DO UPDATE
SET cp = EXCLUDED.cp,
    hp = EXCLUDED.hp;

CREATE TEMP TABLE desired_super_mega_raids (
  pokemon_id INTEGER NOT NULL,
  form TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  boosted_weather TEXT NOT NULL,
  max_boosted_cp INTEGER NOT NULL,
  max_unboosted_cp INTEGER NOT NULL,
  min_boosted_cp INTEGER NOT NULL,
  min_unboosted_cp INTEGER NOT NULL,
  possible_shiny BOOLEAN NOT NULL,
  shield_count INTEGER,
  PRIMARY KEY (pokemon_id, form)
) ON COMMIT DROP;

INSERT INTO desired_super_mega_raids VALUES
  (71,  'Normal', 'Victreebel', 'Grass,Poison',    'Clear,Overcast', 1736, 1389, 1648, 1318, TRUE, 8),
  (149, 'Normal', 'Dragonite',  'Dragon,Flying',   'Windy',         2709, 2167, 2599, 2079, TRUE, 10),
  (687, 'Normal', 'Malamar',    'Dark,Psychic',    'Fog,Windy',     1685, 1347, 1599, 1279, TRUE, 8),
  (870, 'Normal', 'Falinks',    'Fighting',        'Cloudy',        1683, 1347, 1598, 1278, TRUE, 8),
  (150, 'X',      'Mewtwo',     'Psychic,Fighting','Windy,Cloudy',  2984, 2387, 2868, 2294, TRUE, 10),
  (150, 'Y',      'Mewtwo',     'Psychic',         'Windy',         2984, 2387, 2868, 2294, TRUE, 10),
  (227, 'Normal', 'Skarmory',   'Steel,Flying',    'Snow,Windy',    1506, 1204, 1424, 1139, TRUE, 7),
  (26,  'X',      'Raichu',     'Electric',        'Rainy',         1558, 1247, 1476, 1180, TRUE, NULL),
  (26,  'Y',      'Raichu',     'Electric',        'Rainy',         1558, 1247, 1476, 1180, TRUE, NULL),
  (121, 'Normal', 'Starmie',    'Water,Psychic',   'Rainy,Windy',   1846, 1476, 1756, 1404, TRUE, NULL);

UPDATE raid_bosses raid
SET name = desired.name,
    form = desired.form,
    type = desired.type,
    boosted_weather = desired.boosted_weather,
    max_boosted_cp = desired.max_boosted_cp,
    max_unboosted_cp = desired.max_unboosted_cp,
    min_boosted_cp = desired.min_boosted_cp,
    min_unboosted_cp = desired.min_unboosted_cp,
    possible_shiny = desired.possible_shiny,
    tier = 'super_mega',
    costume_id = NULL,
    shield_count = desired.shield_count
FROM desired_super_mega_raids desired
WHERE raid.pokemon_id = desired.pokemon_id
  AND LOWER(COALESCE(raid.tier, '')) = 'super_mega'
  AND COALESCE(NULLIF(LOWER(BTRIM(raid.form)), ''), 'normal') = LOWER(desired.form);

INSERT INTO raid_bosses (
  pokemon_id, name, form, type, boosted_weather, max_boosted_cp,
  max_unboosted_cp, min_boosted_cp, min_unboosted_cp, possible_shiny, tier,
  costume_id, shield_count
)
SELECT desired.pokemon_id,
       desired.name,
       desired.form,
       desired.type,
       desired.boosted_weather,
       desired.max_boosted_cp,
       desired.max_unboosted_cp,
       desired.min_boosted_cp,
       desired.min_unboosted_cp,
       desired.possible_shiny,
       'super_mega',
       NULL,
       desired.shield_count
FROM desired_super_mega_raids desired
WHERE NOT EXISTS (
  SELECT 1
  FROM raid_bosses raid
  WHERE raid.pokemon_id = desired.pokemon_id
    AND LOWER(COALESCE(raid.tier, '')) = 'super_mega'
    AND COALESCE(NULLIF(LOWER(BTRIM(raid.form)), ''), 'normal') = LOWER(desired.form)
);

DO $$
DECLARE
  mega_count INTEGER;
  raid_count INTEGER;
  cp_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mega_count
  FROM desired_super_mega_forms desired
  JOIN mega_evolution me
    ON me.pokemon_id = desired.pokemon_id
   AND COALESCE(NULLIF(LOWER(BTRIM(me.form)), ''), 'normal') = LOWER(desired.form);

  SELECT COUNT(*) INTO raid_count
  FROM desired_super_mega_raids desired
  JOIN raid_bosses raid
    ON raid.pokemon_id = desired.pokemon_id
   AND LOWER(COALESCE(raid.tier, '')) = 'super_mega'
   AND COALESCE(NULLIF(LOWER(BTRIM(raid.form)), ''), 'normal') = LOWER(desired.form);

  SELECT COUNT(*) INTO cp_count
  FROM desired_super_mega_forms desired
  JOIN mega_evolution me
    ON me.pokemon_id = desired.pokemon_id
   AND COALESCE(NULLIF(LOWER(BTRIM(me.form)), ''), 'normal') = LOWER(desired.form)
  JOIN mega_cp_stats cp ON cp.mega_id = me.id AND cp.level_id IN (40, 50);

  IF mega_count <> 10 OR raid_count <> 10 OR cp_count <> 20 THEN
    RAISE EXCEPTION 'Super Mega roster verification failed (mega %, raid %, CP %)',
      mega_count, raid_count, cp_count;
  END IF;
END $$;

COMMIT;
