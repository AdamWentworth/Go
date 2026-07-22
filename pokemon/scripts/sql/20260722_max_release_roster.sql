-- Canonical Pokemon GO Dynamax and Gigantamax availability through 2026-07-22.
--
-- Sources:
--   https://bulbapedia.bulbagarden.net/wiki/Dynamax_(GO)
--   https://bulbapedia.bulbagarden.net/wiki/Gigantamax_(GO)
--   https://pokemongo.com/news/steel-skyline-2025
--
-- This is catalog authoring data, not an application schema migration. It is
-- deliberately idempotent and preserves editor-managed Gigantamax images.

SET search_path = pokemon_catalog, public;

-- Duraludon debuted with its Dynamax release. Its normal image already exists
-- in the media tree; shiny availability remains disabled until the matching
-- shiny asset is authored so clients never render a broken image.
INSERT INTO pokemon (
  pokemon_id,
  name,
  pokedex_number,
  image_url,
  image_url_shiny,
  sprite_url,
  attack,
  defense,
  stamina,
  type_1_id,
  type_2_id,
  gender_rate,
  rarity,
  form,
  generation,
  available,
  shiny_available,
  shiny_rarity,
  date_available,
  date_shiny_available,
  female_unique
)
SELECT
  884,
  'Duraludon',
  884,
  '/images/default/pokemon_884.png',
  NULL,
  NULL,
  239,
  185,
  172,
  steel.type_id,
  dragon.type_id,
  '50M_50F_0GL',
  'Standard',
  NULL,
  8,
  TRUE,
  FALSE,
  NULL,
  '2025-09-30T00:00:00Z',
  NULL,
  FALSE
FROM types AS steel
CROSS JOIN types AS dragon
WHERE LOWER(steel.name) = 'steel'
  AND LOWER(dragon.name) = 'dragon'
ON CONFLICT (pokemon_id) DO NOTHING;

INSERT INTO pokemon_sizes (
  pokemon_id,
  pokedex_height,
  pokedex_weight,
  height_standard_deviation,
  weight_standard_deviation,
  height_xxs_threshold,
  height_xs_threshold,
  height_xl_threshold,
  height_xxl_threshold,
  weight_xxs_threshold,
  weight_xs_threshold,
  weight_xl_threshold,
  weight_xxl_threshold
)
SELECT
  884,
  1.8,
  40.0,
  0.45,
  10.0,
  0.9,
  1.35,
  2.25,
  2.7,
  20.0,
  30.0,
  50.0,
  60.0
WHERE EXISTS (SELECT 1 FROM pokemon WHERE pokemon_id = 884)
ON CONFLICT (pokemon_id) DO NOTHING;

WITH duraludon_moves (move_name) AS (
  VALUES
    ('Metal Claw'),
    ('Dragon Tail'),
    ('Flash Cannon'),
    ('Dragon Claw'),
    ('Hyper Beam')
), resolved AS (
  SELECT moves.move_id
  FROM moves
  JOIN duraludon_moves
    ON LOWER(duraludon_moves.move_name) = LOWER(moves.name)
)
INSERT INTO pokemon_moves (id, move_id, pokemon_id, legacy)
SELECT
  (SELECT COALESCE(MAX(id), 0) FROM pokemon_moves)
    + ROW_NUMBER() OVER (ORDER BY resolved.move_id),
  resolved.move_id,
  884,
  FALSE
FROM resolved
WHERE EXISTS (SELECT 1 FROM pokemon WHERE pokemon_id = 884)
  AND NOT EXISTS (
    SELECT 1
    FROM pokemon_moves
    WHERE pokemon_moves.pokemon_id = 884
      AND pokemon_moves.move_id = resolved.move_id
  );

INSERT INTO pokemon_cp_stats (pokemon_id, level_id, cp, hp)
SELECT
  884,
  cp_multipliers.level_id,
  GREATEST(
    10,
    FLOOR(
      239
      * SQRT(185)
      * SQRT(172)
      * POWER(cp_multipliers.multiplier, 2)
      / 10
    )::INTEGER
  ),
  GREATEST(10, FLOOR(172 * cp_multipliers.multiplier)::INTEGER)
FROM cp_multipliers
WHERE EXISTS (SELECT 1 FROM pokemon WHERE pokemon_id = 884)
ON CONFLICT (pokemon_id, level_id) DO NOTHING;

WITH released_dynamax (pokemon_id, released_on) AS (
  VALUES
    (819, '2024-09-04'), (820, '2024-09-04'),
    (831, '2024-09-04'), (832, '2024-09-04'),
    (1, '2024-09-10'), (2, '2024-09-10'), (3, '2024-09-10'),
    (4, '2024-09-10'), (5, '2024-09-10'), (6, '2024-09-10'),
    (7, '2024-09-10'), (8, '2024-09-10'), (9, '2024-09-10'),
    (374, '2024-09-18'), (375, '2024-09-18'), (376, '2024-09-18'),
    (810, '2024-10-01'), (811, '2024-10-01'), (812, '2024-10-01'),
    (813, '2024-10-01'), (814, '2024-10-01'), (815, '2024-10-01'),
    (816, '2024-10-01'), (817, '2024-10-01'), (818, '2024-10-01'),
    (870, '2024-10-01'),
    (92, '2024-10-22'), (93, '2024-10-22'), (94, '2024-10-22'),
    (529, '2024-11-15'), (530, '2024-11-15'),
    (849, '2024-11-16'), (2275, '2024-11-16'),
    (66, '2024-12-03'), (67, '2024-12-03'), (68, '2024-12-03'),
    (98, '2024-12-09'), (99, '2024-12-09'),
    (615, '2024-12-23'),
    (144, '2025-01-20'), (145, '2025-01-27'), (146, '2025-02-03'),
    (519, '2025-02-17'), (520, '2025-02-17'),
    (521, '2025-02-17'), (2339, '2025-02-17'),
    (554, '2025-02-24'), (555, '2025-02-24'),
    (891, '2025-03-05'), (243, '2025-03-15'),
    (113, '2025-03-17'), (242, '2025-03-17'),
    (10, '2025-03-24'), (11, '2025-03-24'), (12, '2025-03-24'),
    (766, '2025-04-07'), (244, '2025-04-26'), (245, '2025-05-10'),
    (302, '2025-05-19'), (892, '2025-05-21'), (2294, '2025-05-21'),
    (821, '2025-05-26'), (822, '2025-05-26'), (823, '2025-05-26'),
    (856, '2025-06-16'), (857, '2025-06-16'), (858, '2025-06-16'),
    (213, '2025-06-30'),
    (320, '2025-07-14'), (321, '2025-07-14'),
    (380, '2025-07-26'), (381, '2025-07-26'),
    (140, '2025-07-28'), (141, '2025-07-28'),
    (138, '2025-08-04'), (139, '2025-08-04'),
    (568, '2025-08-11'), (569, '2025-08-11'),
    (63, '2025-09-15'), (64, '2025-09-15'), (65, '2025-09-15'),
    (884, '2025-09-30'),
    (761, '2025-10-13'), (762, '2025-10-13'), (763, '2025-10-13'),
    (527, '2025-10-27'), (528, '2025-10-27'),
    (686, '2025-11-03'), (687, '2025-11-03'),
    (280, '2025-11-10'), (281, '2025-11-10'),
    (282, '2025-11-10'), (475, '2025-11-10'),
    (133, '2025-11-24'), (134, '2025-11-24'), (135, '2025-11-24'),
    (136, '2025-11-24'), (196, '2025-11-24'), (197, '2025-11-24'),
    (470, '2025-11-24'), (471, '2025-11-24'), (700, '2025-11-24'),
    (249, '2025-11-29'),
    (106, '2025-12-11'), (107, '2025-12-11'),
    (363, '2025-12-22'), (364, '2025-12-22'), (365, '2025-12-22'),
    (780, '2026-01-05'),
    (524, '2026-01-26'), (525, '2026-01-26'), (526, '2026-01-26'),
    (250, '2026-01-31'),
    (58, '2026-02-09'), (59, '2026-02-09'),
    (25, '2026-03-09'), (26, '2026-03-09'),
    (378, '2026-03-23'),
    (328, '2026-04-06'), (329, '2026-04-06'), (330, '2026-04-06'),
    (377, '2026-04-20'),
    (546, '2026-05-04'), (547, '2026-05-04'),
    (379, '2026-05-18'),
    (415, '2026-05-25'), (416, '2026-05-25'),
    (125, '2026-06-08'), (466, '2026-06-08'),
    (163, '2026-06-22'), (164, '2026-06-22'),
    (633, '2026-07-13'), (634, '2026-07-13'), (635, '2026-07-13')
)
INSERT INTO max_pokemon (
  pokemon_id,
  dynamax,
  gigantamax,
  dynamax_release_date,
  gigantamax_release_date,
  gigantamax_image_url,
  shiny_gigantamax_image_url,
  gigantamax_move_name,
  gigantamax_move_type_id
)
SELECT
  released_dynamax.pokemon_id,
  TRUE,
  FALSE,
  released_dynamax.released_on,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL
FROM released_dynamax
JOIN pokemon
  ON pokemon.pokemon_id = released_dynamax.pokemon_id
ON CONFLICT (pokemon_id) DO UPDATE SET
  dynamax = TRUE,
  dynamax_release_date = EXCLUDED.dynamax_release_date;

WITH released_gigantamax (
  pokemon_id,
  released_on,
  move_name,
  move_type
) AS (
  VALUES
    (3, '2024-10-26', 'G-Max Vine Lash', 'Grass'),
    (6, '2024-10-26', 'G-Max Wildfire', 'Fire'),
    (9, '2024-10-26', 'G-Max Cannonade', 'Water'),
    (94, '2024-10-31', 'G-Max Terror', 'Ghost'),
    (849, '2024-11-16', 'G-Max Stun Shock', 'Electric'),
    (2275, '2024-11-16', 'G-Max Stun Shock', 'Electric'),
    (131, '2024-12-08', 'G-Max Resonance', 'Ice'),
    (99, '2025-02-01', 'G-Max Foam Burst', 'Water'),
    (143, '2025-04-19', 'G-Max Replenish', 'Normal'),
    (68, '2025-05-25', 'G-Max Chi Strike', 'Fighting'),
    (812, '2025-05-29', 'G-Max Drum Solo', 'Grass'),
    (815, '2025-06-05', 'G-Max Fireball', 'Fire'),
    (818, '2025-06-12', 'G-Max Hydrosnipe', 'Water'),
    (12, '2025-08-03', 'G-Max Befuddle', 'Bug'),
    (569, '2025-11-01', 'G-Max Malodor', 'Poison'),
    (861, '2025-11-07', 'G-Max Snooze', 'Dark'),
    (52, '2026-02-15', 'G-Max Gold Rush', 'Normal'),
    (25, '2026-03-28', 'G-Max Volt Crash', 'Electric')
), resolved AS (
  SELECT
    released_gigantamax.pokemon_id,
    released_gigantamax.released_on,
    released_gigantamax.move_name,
    types.type_id
  FROM released_gigantamax
  JOIN types
    ON LOWER(types.name) = LOWER(released_gigantamax.move_type)
  JOIN pokemon
    ON pokemon.pokemon_id = released_gigantamax.pokemon_id
)
INSERT INTO max_pokemon (
  pokemon_id,
  dynamax,
  gigantamax,
  dynamax_release_date,
  gigantamax_release_date,
  gigantamax_image_url,
  shiny_gigantamax_image_url,
  gigantamax_move_name,
  gigantamax_move_type_id
)
SELECT
  resolved.pokemon_id,
  FALSE,
  TRUE,
  NULL,
  resolved.released_on,
  NULL,
  NULL,
  resolved.move_name,
  resolved.type_id
FROM resolved
ON CONFLICT (pokemon_id) DO UPDATE SET
  gigantamax = TRUE,
  gigantamax_release_date = EXCLUDED.gigantamax_release_date,
  gigantamax_move_name = EXCLUDED.gigantamax_move_name,
  gigantamax_move_type_id = EXCLUDED.gigantamax_move_type_id;

-- A released Max form must also be visible through the base catalog query.
-- Some species were pre-authored as unavailable before their Pokemon GO debut,
-- so the Max upserts above alone are not enough to publish them.
UPDATE pokemon
SET
  available = TRUE,
  date_available = COALESCE(
    pokemon.date_available,
    LEAST(
      COALESCE(max_pokemon.dynamax_release_date, max_pokemon.gigantamax_release_date),
      COALESCE(max_pokemon.gigantamax_release_date, max_pokemon.dynamax_release_date)
    )
  )
FROM max_pokemon
WHERE pokemon.pokemon_id = max_pokemon.pokemon_id
  AND (max_pokemon.dynamax IS TRUE OR max_pokemon.gigantamax IS TRUE)
  AND LEAST(
    COALESCE(max_pokemon.dynamax_release_date, max_pokemon.gigantamax_release_date),
    COALESCE(max_pokemon.gigantamax_release_date, max_pokemon.dynamax_release_date)
  ) <= '2026-07-22';

-- Sizzlipede has appeared in Pokemon GO, but not as a released Dynamax form.
DELETE FROM max_pokemon
WHERE pokemon_id = 850
  AND gigantamax IS DISTINCT FROM TRUE;
