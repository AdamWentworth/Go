-- Curated raid variant rows missing from the upstream raid_bosses seed.
--
-- These rows model raid bosses whose battle form is different from the
-- catch encounter or whose raid category is variant-specific. The existing
-- raid_bosses table stores rows by base pokemon_id, so fusion and shadow
-- rows are attached to the base species and filtered to the matching variant
-- by the frontend variant builder.
--
-- Sources checked July 13, 2026:
-- - Pokemon.com Black/White Kyurem raid tips:
--   https://www.pokemon.com/us/features/black-kyurem-and-white-kyurem-pokemon-go-raid-battle-tips
-- - Pokemon.com Dusk Mane/Dawn Wings Necrozma raid tips:
--   https://www.pokemon.com/us/features/dusk-mane-necrozma-pokemon-go-raid-battle-tips
--   https://www.pokemon.com/us/features/dawn-wings-necrozma-pokemon-go-raid-battle-tips
-- - Pokémon GO Hub fusion raid guides:
--   https://pokemongohub.net/post/guide/black-kyurem-raid-guide/
--   https://pokemongohub.net/post/guide/white-kyurem-raid-guide/
--   https://pokemongohub.net/post/guide/dusk-mane-necrozma-raid-guide/
--   https://pokemongohub.net/post/guide/dawn-wings-necrozma-raid-guide/
-- - Leek Duck / PokéBase current shadow raid listings:
--   https://leekduck.com/raid-bosses/
--   https://pokebase.app/pokemon-go/raids

BEGIN;

DELETE FROM raid_bosses
WHERE id BETWEEN 900001 AND 900099;

INSERT INTO raid_bosses (
  id,
  pokemon_id,
  name,
  form,
  type,
  boosted_weather,
  max_boosted_cp,
  max_unboosted_cp,
  min_boosted_cp,
  min_unboosted_cp,
  possible_shiny,
  tier
) VALUES
  -- Fusion raids battle the fused form, then reward the base encounter.
  (900001, 646, 'Black Kyurem', 'Black', 'Dragon / Ice', 'Windy / Snow', 2553, 2042, 2446, 1957, 1, 'fusion_5'),
  (900002, 646, 'White Kyurem', 'White', 'Dragon / Ice', 'Windy / Snow', 2553, 2042, 2446, 1957, 1, 'fusion_5'),
  (900003, 800, 'Dusk Mane Necrozma', 'Dusk Mane', 'Psychic / Steel', 'Windy', 2630, 2104, 2522, 2018, 1, 'fusion_5'),
  (900004, 800, 'Dawn Wings Necrozma', 'Dawn Wings', 'Psychic / Ghost', 'Windy', 2630, 2104, 2522, 2018, 1, 'fusion_5'),

  -- Shadow raid rows are current/known appearances and use separate tier keys
  -- so Shadow bosses do not collapse into their regular raid category.
  (900011, 484, 'Shadow Palkia', 'Normal', 'Water / Dragon', 'Rainy / Windy', 2850, 2280, 2648, 2118, 1, 'shadow_5'),
  (900012, 123, 'Shadow Scyther', 'Normal', 'Bug / Flying', 'Rainy / Windy', 1933, 1546, 1768, 1414, 0, 'shadow_3'),
  (900013, 107, 'Shadow Hitmonchan', 'Normal', 'Fighting', 'Cloudy', 1665, 1332, 1512, 1210, 0, 'shadow_3'),
  (900014, 75, 'Shadow Graveler', 'Normal', 'Rock / Ground', 'Partly Cloudy / Sunny', 1355, 1084, 1219, 975, 0, 'shadow_3'),
  (900015, 231, 'Shadow Phanpy', 'Normal', 'Ground', 'Sunny', 862, 689, 750, 600, 0, 'shadow_1'),
  (900016, 280, 'Shadow Ralts', 'Normal', 'Psychic / Fairy', 'Windy / Cloudy', 385, 308, 313, 250, 0, 'shadow_1'),
  (900017, 554, 'Shadow Darumaka', 'Normal', 'Fire', 'Sunny', 1030, 823, 907, 726, 0, 'shadow_1'),
  (900018, 56, 'Shadow Mankey', 'Normal', 'Fighting', 'Cloudy', 832, 665, 723, 578, 0, 'shadow_1');

COMMIT;
