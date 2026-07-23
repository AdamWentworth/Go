-- Synthetic catalog data for PostgreSQL-only editor and API tests.
-- Keep this intentionally small: it proves behavior without publishing the
-- production Pokemon catalog or any editor-authored data.
SET search_path = pokemon_catalog, public;

INSERT INTO types (type_id, name, icon_url) VALUES
  (1, 'Normal', '/images/types/Normal.png'),
  (2, 'Grass', '/images/types/Grass.png'),
  (3, 'Poison', '/images/types/Poison.png'),
  (4, 'Dragon', '/images/types/Dragon.png'),
  (5, 'Fighting', '/images/types/Fighting.png'),
  (6, 'Psychic', '/images/types/Psychic.png'),
  (7, 'Fire', '/images/types/Fire.png'),
  (8, 'Water', '/images/types/Water.png'),
  (9, 'Bug', '/images/types/Bug.png'),
  (10, 'Flying', '/images/types/Flying.png'),
  (11, 'Electric', '/images/types/Electric.png'),
  (12, 'Ghost', '/images/types/Ghost.png'),
  (13, 'Ice', '/images/types/Ice.png'),
  (14, 'Dark', '/images/types/Dark.png'),
  (15, 'Steel', '/images/types/Steel.png'),
  (16, 'Fairy', '/images/types/Fairy.png');

INSERT INTO evolution_items (item_id, name, image_url) VALUES
  (1, 'Sun Stone', '/images/items/sun_stone.png');

INSERT INTO cp_multipliers (level_id, multiplier) VALUES
  (40, 0.79030001),
  (50, 0.84029999);

INSERT INTO pokemon (
  pokemon_id, name, pokedex_number, image_url, image_url_shiny, sprite_url,
  attack, defense, stamina, type_1_id, type_2_id, gender_rate, rarity, form,
  generation, available, shiny_available, shiny_rarity, date_available,
  date_shiny_available, female_unique
) VALUES
  (1, 'Bulbasaur', 1, '/images/pokemon_1.png', '/images/shiny_pokemon_1.png', '/sprites/1.png', 118, 111, 128, 2, 3, '1:1', 'Common', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2017-03-22', FALSE),
  (2, 'Ivysaur', 2, '/images/pokemon_2.png', '/images/shiny_pokemon_2.png', '/sprites/2.png', 151, 143, 155, 2, 3, '1:1', 'Common', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2017-03-22', FALSE),
  (3, 'Venusaur', 3, '/images/pokemon_3.png', '/images/shiny_pokemon_3.png', '/sprites/3.png', 198, 189, 190, 2, 3, '1:1', 'Rare', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2017-03-22', TRUE),
  (10, 'Caterpie', 10, '/images/pokemon_10.png', '/images/shiny_pokemon_10.png', '/sprites/10.png', 55, 55, 128, 9, NULL, '1:1', 'Common', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2018-08-01', FALSE),
  (11, 'Metapod', 11, '/images/pokemon_11.png', '/images/shiny_pokemon_11.png', '/sprites/11.png', 45, 80, 137, 9, NULL, '1:1', 'Common', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2018-08-01', FALSE),
  (12, 'Butterfree', 12, '/images/pokemon_12.png', '/images/shiny_pokemon_12.png', '/sprites/12.png', 167, 137, 155, 9, 10, '1:1', 'Rare', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2018-08-01', FALSE),
  (25, 'Pikachu', 25, '/images/pokemon_25.png', '/images/shiny_pokemon_25.png', '/sprites/25.png', 112, 96, 111, 1, NULL, '1:1', 'Common', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2017-08-08', FALSE),
  (54, 'Psyduck', 54, '/images/pokemon_54.png', '/images/shiny_pokemon_54.png', '/sprites/54.png', 122, 95, 137, 8, NULL, '1:1', 'Common', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2019-08-23', FALSE),
  (133, 'Eevee', 133, '/images/pokemon_133.png', '/images/shiny_pokemon_133.png', '/sprites/133.png', 104, 114, 146, 1, NULL, '1:1', 'Common', NULL, 1, TRUE, TRUE, '1 in 512', '2016-07-06', '2018-08-11', FALSE),
  (150, 'Mewtwo', 150, '/images/pokemon_150.png', '/images/shiny_pokemon_150.png', '/sprites/150.png', 300, 182, 214, 6, NULL, 'Genderless', 'Legendary', NULL, 1, TRUE, TRUE, '1 in 20', '2017-08-14', '2018-09-20', FALSE),
  (861, 'Grimmsnarl', 861, '/images/pokemon_861.png', NULL, NULL, 227, 139, 216, 14, 16, '100M_0F_0GL', 'Standard', NULL, 8, FALSE, FALSE, NULL, NULL, NULL, FALSE),
  (884, 'Duraludon', 884, '/images/pokemon_884.png', NULL, NULL, 239, 185, 172, 15, 4, '50M_50F_0GL', 'Standard', NULL, 8, FALSE, FALSE, NULL, NULL, NULL, FALSE),
  (999001, 'Fixture Alpha', 999001, '/images/pokemon_fixture_alpha.png', '/images/shiny_pokemon_fixture_alpha.png', '/sprites/fixture_alpha.png', 100, 100, 100, 1, NULL, 'Genderless', 'Test', NULL, 9, TRUE, FALSE, NULL, '2026-01-01', NULL, FALSE),
  (999002, 'Fixture Beta', 999002, '/images/pokemon_fixture_beta.png', '/images/shiny_pokemon_fixture_beta.png', '/sprites/fixture_beta.png', 100, 100, 100, 1, NULL, 'Genderless', 'Test', NULL, 9, TRUE, FALSE, NULL, '2026-01-01', NULL, FALSE);

INSERT INTO backgrounds (background_id, name, location, image_url, date)
SELECT value, 'Fixture Background ' || value, 'Test Location', '/images/backgrounds/fixture_' || value || '.png', '2026-01-' || LPAD(value::TEXT, 2, '0')
FROM generate_series(1, 20) AS value;

INSERT INTO moves (
  move_id, name, type_id, raid_power, pvp_power, raid_energy, pvp_energy,
  raid_cooldown, pvp_turns, is_fast, fusion_id, shadow, purified, apex
) VALUES
  (1, 'Tackle', 1, 5, 3, 0, 3, 500, 1, TRUE, NULL, FALSE, FALSE, FALSE),
  (2, 'Vine Whip', 2, 7, 5, 0, 8, 600, 2, TRUE, NULL, FALSE, FALSE, FALSE),
  (3, 'Power Whip', 2, 90, 90, -50, -50, 2600, 0, FALSE, NULL, FALSE, FALSE, FALSE),
  (4, 'Dragon Tail', 4, 15, 9, 0, 9, 1100, 3, TRUE, NULL, FALSE, FALSE, FALSE),
  (5, 'Counter', 5, 12, 8, 0, 7, 900, 2, TRUE, NULL, FALSE, FALSE, FALSE),
  (6, 'Psystrike', 6, 90, 90, -50, -45, 2300, 0, FALSE, NULL, FALSE, FALSE, FALSE),
  (7, 'Flamethrower', 7, 70, 90, -50, -55, 2200, 0, FALSE, NULL, FALSE, FALSE, FALSE),
  (8, 'Water Gun', 8, 5, 3, 0, 3, 500, 1, TRUE, NULL, FALSE, FALSE, FALSE),
  (9, 'Bug Bite', 9, 5, 3, 0, 3, 500, 1, TRUE, NULL, FALSE, FALSE, FALSE),
  (10, 'Aerial Ace', 10, 55, 55, -45, -45, 2400, 0, FALSE, NULL, FALSE, FALSE, FALSE),
  (11, 'Metal Claw', 15, 8, 5, 7, 6, 700, 2, TRUE, NULL, FALSE, FALSE, FALSE),
  (12, 'Flash Cannon', 15, 100, 110, -100, -70, 2700, 0, FALSE, NULL, FALSE, FALSE, FALSE),
  (13, 'Dragon Claw', 4, 50, 50, -33, -35, 1700, 0, FALSE, NULL, FALSE, FALSE, FALSE),
  (14, 'Hyper Beam', 1, 150, 150, -100, -80, 3800, 0, FALSE, NULL, FALSE, FALSE, FALSE),
  (15, 'Bite', 14, 6, 4, 4, 2, 500, 1, TRUE, NULL, FALSE, FALSE, FALSE),
  (16, 'Low Kick', 5, 5, 4, 5, 5, 500, 2, TRUE, NULL, FALSE, FALSE, FALSE),
  (17, 'Sucker Punch', 14, 5, 5, 6, 7, 500, 2, TRUE, NULL, FALSE, FALSE, FALSE),
  (18, 'Dark Pulse', 14, 80, 80, -50, -50, 3000, 1, FALSE, NULL, FALSE, FALSE, FALSE),
  (19, 'Foul Play', 14, 70, 70, -50, -45, 2000, 1, FALSE, NULL, FALSE, FALSE, FALSE),
  (20, 'Play Rough', 16, 90, 90, -50, -60, 3000, 1, FALSE, NULL, FALSE, FALSE, FALSE),
  (21, 'Power-Up Punch', 5, 50, 20, -33, -35, 2000, 1, FALSE, NULL, FALSE, FALSE, FALSE);

INSERT INTO costume_pokemon (
  costume_id, pokemon_id, costume_name, shiny_available, date_available,
  date_shiny_available, image_url_costume, image_url_shiny_costume,
  image_url_costume_female, image_url_shiny_costume_female
) VALUES
  (25, 1, 'Fixture Hat', TRUE, '2026-01-01', '2026-01-02', '/images/costumes/fixture_hat.png', '/images/costumes/fixture_hat_shiny.png', NULL, NULL),
  (99, 2, 'Fixture Crown', FALSE, '2026-01-03', NULL, '/images/costumes/fixture_crown.png', NULL, NULL, NULL);

INSERT INTO female_pokemon (pokemon_id, image_url, shiny_image_url, shadow_image_url, shiny_shadow_image_url) VALUES
  (3, '/images/female/3.png', '/images/female/shiny_3.png', '/images/female/shadow_3.png', '/images/female/shiny_shadow_3.png');

INSERT INTO shadow_pokemon (
  id, pokemon_id, shiny_available, apex, date_available, date_shiny_available,
  image_url_shadow, image_url_shiny_shadow, shiny_rarity
) VALUES
  (1, 1, '1', NULL, '2026-01-01', '2026-01-02', '/images/shadow/1.png', '/images/shadow/shiny_1.png', '1 in 64');

INSERT INTO fusion_pokemon (
  fusion_id, base_pokemon_id1, base_pokemon_id2, name, pokedex_number,
  image_url, image_url_shiny, sprite_url, attack, defense, stamina, type_1_id,
  type_2_id, generation, available, shiny_available, shiny_rarity,
  date_available, date_shiny_available
) VALUES
  (1, 1, 2, 'Fixture Fusion', 10001, '/images/fusions/fixture.png', '/images/fusions/fixture_shiny.png', '/sprites/fusions/fixture.png', 250, 180, 200, 2, 3, 9, TRUE, TRUE, '1 in 64', '2026-01-01', '2026-01-02');

INSERT INTO mega_evolution (
  id, pokemon_id, mega_energy_cost, attack, defense, stamina, image_url,
  image_url_shiny, sprite_url, primal, form, type_1_id, type_2_id, date_available
) VALUES
  (1501, 150, 300, 399, 215, 228, '/images/mega/mega_150_X.png?v=f8169f5', '/images/shiny_mega/shiny_mega_150_X.png?v=f8169f5', '/sprites/mega/150_X.png', NULL, 'X', 6, 5, '2026-05-25'),
  (1502, 150, 300, 413, 223, 228, '/images/mega/mega_150_Y.png?v=f8169f5', '/images/shiny_mega/shiny_mega_150_Y.png?v=f8169f5', '/sprites/mega/150_Y.png', NULL, 'Y', 6, NULL, '2026-05-25');

INSERT INTO max_pokemon (
  pokemon_id, dynamax, gigantamax, dynamax_release_date, gigantamax_release_date,
  gigantamax_image_url, shiny_gigantamax_image_url, gigantamax_move_name,
  gigantamax_move_type_id
) VALUES
  (1, TRUE, FALSE, '2026-01-01', NULL, NULL, NULL, NULL, NULL),
  (3, TRUE, TRUE, '2026-01-01', '2026-02-01',
   '/images/max/gigantamax_3.png', '/images/max/shiny_gigantamax_3.png',
   'G-Max Vine Lash', 2);

INSERT INTO max_battle_profiles (
  profile_id, pokemon_id, variant_kind, form, tier_key, is_default, priority,
  source_name, source_url, notes
) VALUES
  (1, 1, 'dynamax', NULL, 'one-star', TRUE, 100,
   'Synthetic fixture', 'https://example.test/max/bulbasaur',
   'Default one-star Dynamax Bulbasaur fixture profile.'),
  (2, 1, 'dynamax', NULL, 'three-star', FALSE, 10,
   'Synthetic fixture', NULL,
   'Promoted three-star event option.'),
  (3, 3, 'gigantamax', NULL, 'gigantamax', TRUE, 100,
   'Synthetic fixture', 'https://example.test/max/venusaur',
   'Default Gigantamax Venusaur fixture profile.');

INSERT INTO pokemon_sizes (
  pokemon_id, pokedex_height, pokedex_weight, height_standard_deviation,
  weight_standard_deviation, height_xxs_threshold, height_xs_threshold,
  height_xl_threshold, height_xxl_threshold, weight_xxs_threshold,
  weight_xs_threshold, weight_xl_threshold, weight_xxl_threshold
) VALUES
  (1, 0.7, 6.9, 0.05, 0.5, 0.4, 0.5, 0.9, 1.0, 4.0, 5.0, 8.0, 9.0);

INSERT INTO pokemon_backgrounds (id, pokemon_id, background_id, costume_id) VALUES
  (1, 1, 1, NULL),
  (2, 2, 2, 99);

INSERT INTO pokemon_evolutions (evolution_id, pokemon_id, evolves_to, candies_needed, trade_discount, item_id, other) VALUES
  (1, 1, 2, 25, NULL, NULL, NULL),
  (2, 2, 3, 100, NULL, NULL, NULL),
  (3, 10, 11, 12, NULL, NULL, NULL),
  (4, 11, 12, 50, NULL, NULL, NULL);

INSERT INTO pokemon_moves (id, move_id, pokemon_id, legacy) VALUES
  (1, 1, 1, FALSE), (2, 2, 1, FALSE), (3, 3, 1, FALSE),
  (4, 1, 2, FALSE), (5, 2, 2, FALSE), (6, 3, 2, FALSE),
  (7, 2, 3, FALSE), (8, 3, 3, FALSE), (9, 9, 10, FALSE),
  (10, 9, 11, FALSE), (11, 10, 12, FALSE), (12, 1, 25, FALSE),
  (13, 8, 54, FALSE), (14, 1, 133, FALSE), (15, 5, 150, TRUE),
  (16, 6, 150, FALSE);

INSERT INTO pokemon_cp_stats (pokemon_id, level_id, cp, hp) VALUES
  (1, 40, 1115, 128), (1, 50, 1260, 137),
  (2, 40, 1699, 155), (2, 50, 1921, 165),
  (3, 40, 2720, 190), (3, 50, 3075, 202),
  (150, 40, 4724, 214), (150, 50, 5355, 228);

INSERT INTO shadow_costume_pokemon (
  id, shadow_id, costume_id, date_available, date_shiny_available,
  image_url_shadow_costume, image_url_shiny_shadow_costume,
  image_url_female_shadow_costume, image_url_female_shiny_shadow_costume
) VALUES
  (1, 1, 25, '2026-01-01', '2026-01-02', '/images/shadow_costumes/fixture.png', '/images/shadow_costumes/fixture_shiny.png', NULL, NULL);

INSERT INTO mega_cp_stats (mega_id, level_id, cp, hp) VALUES
  (1501, 40, 6112, 228), (1501, 50, 6910, 242),
  (1502, 40, 6428, 228), (1502, 50, 7267, 242);

INSERT INTO fusion_cp_stats (fusion_id, level_id, cp, hp) VALUES
  (1, 40, 4000, 200), (1, 50, 4500, 215);

INSERT INTO fusion_moveset (fusion_id, move_id, legacy) VALUES
  (1, 2, FALSE), (1, 3, FALSE);

INSERT INTO crown_forms (id, base_pokemon_id, crown_pokemon_id, display_form, is_active) VALUES
  (1, 25, 25, 'Fixture Crown Form', TRUE);

INSERT INTO fusion_background_combo_rules (
  fusion_id, member1_background_id, member2_background_id, combo_background_id,
  is_active, notes
) VALUES
  (1, 13, 14, 15, TRUE, 'fixture');

INSERT INTO raid_bosses (
  pokemon_id, name, form, type, boosted_weather, max_boosted_cp,
  max_unboosted_cp, min_boosted_cp, min_unboosted_cp, possible_shiny, tier,
  costume_id, shield_count
) VALUES
  (1, 'Bulbasaur', NULL, '1-star', 'Cloudy', 1000, 900, 800, 700, TRUE, '1', NULL, NULL);

INSERT INTO catalog_releases (release_id, source_sha256, source_label, table_counts, is_active, activated_at) VALUES
  ('fixture-20260715', repeat('0', 64), 'synthetic-test-fixture', '{"pokemon": 12}', TRUE, CURRENT_TIMESTAMP);

INSERT INTO pvp_ranking_snapshots (
  snapshot_id, source_name, source_version, source_url, source_license, is_active, metadata
) VALUES (
  'pvpoke-fixture',
  'PvPoke',
  'fixture-commit',
  'https://github.com/pvpoke/pvpoke/tree/fixture-commit',
  'MIT',
  TRUE,
  '{"importedCounts":{"great":1,"ultra":1,"master":1}}'
);

INSERT INTO pvp_rankings (
  snapshot_id, league, rank, source_rank, species_id, species_name,
  pokemon_id, fusion_id, variant_kind, image_url, types, moveset,
  score, rating, category_scores, recommended_level, attack_iv, defense_iv,
  stamina_iv, stat_product, battle_attack, battle_defense, battle_hp
) VALUES
  (
    'pvpoke-fixture', 'great', 1, 1, 'bulbasaur', 'Bulbasaur',
    1, NULL, 'pokemon', '/images/default/pokemon_1.png',
    '["grass","poison"]',
    '[{"id":"VINE_WHIP","name":"Vine Whip","type":"grass","kind":"fast"},{"id":"POWER_WHIP","name":"Power Whip","type":"grass","kind":"charged"}]',
    91.2, 700, '[90,92,88]', 50, 15, 15, 15, 1800, 110.2, 115.3, 130
  ),
  (
    'pvpoke-fixture', 'ultra', 1, 1, 'ivysaur', 'Ivysaur',
    2, NULL, 'pokemon', '/images/default/pokemon_2.png',
    '["grass","poison"]',
    '[{"id":"VINE_WHIP","name":"Vine Whip","type":"grass","kind":"fast"},{"id":"POWER_WHIP","name":"Power Whip","type":"grass","kind":"charged"}]',
    89.4, 680, '[89,91,87]', 50, 15, 15, 15, 2400, 140.2, 145.3, 155
  ),
  (
    'pvpoke-fixture', 'master', 1, 1, 'mewtwo', 'Mewtwo',
    150, NULL, 'pokemon', '/images/default/pokemon_150.png',
    '["psychic"]',
    '[{"id":"COUNTER","name":"Counter","type":"fighting","kind":"fast"},{"id":"PSYSTRIKE","name":"Psystrike","type":"psychic","kind":"charged"}]',
    96.8, 820, '[97,95,96]', 50, 15, 15, 15, 7200, 250.2, 180.3, 190
  );

SELECT setval('pokemon_catalog.pokemon_backgrounds_id_seq', 2, TRUE);
SELECT setval('pokemon_catalog.max_battle_profiles_profile_id_seq', 3, TRUE);
