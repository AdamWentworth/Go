-- Curated historical costume/event raid boss rows generated from Pokémon GO Wiki raid-boss change pages.
-- Window audited: 2023-07-13 through 2026-07-13. Generated 2026-07-13.
-- Requires 20260713_raid_boss_costume_support.sql.
-- Source pages:
-- - https://pokemongo.fandom.com/wiki/List_of_Raid_Bosses_changes/2023
-- - https://pokemongo.fandom.com/wiki/List_of_Raid_Bosses_changes/2024
-- - https://pokemongo.fandom.com/wiki/List_of_Raid_Bosses_changes/2025
-- - https://pokemongo.fandom.com/wiki/List_of_Raid_Bosses_changes/2026
--
-- Notes:
-- - This table is a raid-boss catalog, not rotation history. Rows are unique by boss costume and tier.
-- - Costume IDs are resolved against local costume_pokemon rows using the Wiki ci/ct costume metadata.
-- - Regional forms, Mega/Primal forms, and other non-costume ci hints are intentionally not represented here.
-- - CP ranges are computed from local base stats at level 20/25 with 10/10/10 to 15/15/15 IVs.

BEGIN;

DELETE FROM raid_bosses WHERE id BETWEEN 920001 AND 920999;

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
  tier,
  costume_id
) VALUES
  (920001, 25, 'World Championships 2023 Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 195),
  (920002, 25, 'Aquamarine Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 10),
  (920003, 25, 'Malachite Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 58),
  (920004, 25, 'Pyrite Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 65),
  (920005, 25, 'Quartz Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 66),
  (920006, 143, 'Cowboy Snorlax', 'Normal', 'Normal', 'Partly Cloudy', 2304, 1843, 2201, 1760, 1, '3', 153),
  (920007, 94, 'Halloween 2023 Gengar', 'Normal', 'Ghost / Poison', 'Fog / Cloudy', 2055, 1644, 1958, 1566, 1, '3', 242),
  (920008, 104, 'Cempasúchil Cubone', 'Normal', 'Ground', 'Sunny', 728, 582, 671, 536, 1, '1', 245),
  (920009, 12, 'Bow Butterfree', 'Normal', 'Bug / Flying', 'Rainy / Windy', 1305, 1044, 1229, 983, 1, '3', 130),
  (920010, 149, 'Bow Dragonite', 'Normal', 'Dragon / Flying', 'Windy', 2709, 2167, 2599, 2079, 1, '3', 247),
  (920011, 281, 'Hat Kirlia', 'Normal', 'Psychic / Fairy', 'Windy / Cloudy', 690, 552, 635, 508, 1, '3', 126),
  (920012, 359, 'Sunglasses Absol', 'Normal', 'Dark', 'Fog', 1805, 1443, 1712, 1370, 1, '3', 135),
  (920013, 25, 'Holiday 2023 Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 216),
  (920014, 363, 'Holiday Spheal', 'Normal', 'Ice / Water', 'Snow / Rainy', 687, 550, 631, 505, 1, '1', 119),
  (920015, 234, 'Holiday Stantler', 'Normal', 'Normal', 'Partly Cloudy', 1546, 1236, 1463, 1170, 1, '3', 118),
  (920016, 471, 'Holiday Glaceon', 'Normal', 'Ice', 'Snow', 2233, 1786, 2133, 1706, 1, '3', 181),
  (920017, 613, 'Holiday Cubchoo', 'Normal', 'Ice', 'Snow', 763, 610, 704, 563, 1, '1', 27),
  (920018, 225, 'Holiday Delibird', 'Normal', 'Ice / Flying', 'Snow / Windy', 781, 625, 723, 578, 1, '3', 137),
  (920019, 1, 'Party Hat Bulbasaur', 'Normal', 'Grass / Poison', 'Sunny / Cloudy', 796, 637, 737, 590, 1, '1', 29),
  (920020, 4, 'Party Hat Charmander', 'Normal', 'Fire', 'Sunny', 700, 560, 645, 516, 1, '1', 31),
  (920021, 7, 'Party Hat Squirtle', 'Normal', 'Water', 'Rainy', 675, 540, 621, 497, 1, '1', 33),
  (920022, 163, 'New Year Hoothoot', 'Normal', 'Normal / Flying', 'Partly Cloudy / Windy', 484, 387, 436, 349, 1, '1', 138),
  (920023, 265, 'Party Wurmple', 'Normal', 'Bug', 'Rainy', 413, 330, 370, 296, 1, '1', 121),
  (920024, 33, 'Party Hat Nidorino', 'Normal', 'Poison', 'Cloudy', 995, 796, 929, 743, 1, '3', 123),
  (920025, 94, 'Party Hat Gengar', 'Normal', 'Ghost / Poison', 'Fog / Cloudy', 2055, 1644, 1958, 1566, 1, '3', 136),
  (920026, 202, 'Party Wobbuffet', 'Normal', 'Psychic', 'Windy', 733, 586, 665, 532, 1, '3', 120),
  (920027, 25, 'Cake Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 13),
  (920028, 25, 'Sun Crown Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 257),
  (920029, 25, 'Moon Crown Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 258),
  (920030, 196, 'Day Scarf Espeon', 'Normal', 'Psychic', 'Windy', 2264, 1811, 2162, 1730, 1, '3', 261),
  (920031, 197, 'Night Scarf Umbreon', 'Normal', 'Dark', 'Fog', 1526, 1221, 1442, 1153, 1, '3', 262),
  (920032, 25, 'Witch Hat Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 79),
  (920033, 656, 'Halloween Froakie', 'Normal', 'Water', 'Rainy', 709, 567, 653, 522, 1, '1', 269),
  (920034, 722, 'Halloween Rowlet', 'Normal', 'Grass / Flying', 'Sunny / Windy', 755, 604, 697, 558, 1, '1', 272),
  (920035, 94, 'Halloween 2022 Gengar', 'Normal', 'Ghost / Poison', 'Fog / Cloudy', 2055, 1644, 1958, 1566, 1, '3', 23),
  (920036, 426, 'Halloween Drifblim', 'Normal', 'Ghost / Flying', 'Fog / Windy', 1701, 1361, 1609, 1287, 1, '3', 145),
  (920037, 143, 'Studded Jacket Snorlax', 'Normal', 'Normal', 'Partly Cloudy', 2304, 1843, 2201, 1760, 1, '3', 278),
  (920038, 25, 'Holiday Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 55),
  (920039, 702, 'Holiday Dedenne', 'Normal', 'Electric / Fairy', 'Rainy / Cloudy', 1315, 1051, 1239, 991, 1, '1', 279),
  (920040, 403, 'Hat Shinx', 'Normal', 'Electric', 'Rainy', 625, 500, 572, 458, 1, '1', 127),
  (920041, 572, 'Fashionable Minccino', 'Normal', 'Normal', 'Partly Cloudy', 623, 498, 570, 456, 1, '1', 283),
  (920042, 25, 'Hilbert''s hat Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 285),
  (920043, 25, 'Hilda''s hat Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 286),
  (920044, 25, 'Nate''s visor Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 287),
  (920045, 25, 'Rosa''s visor Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 288),
  (920046, 31, 'Crown Nidoqueen', 'Normal', 'Poison / Ground', 'Cloudy / Sunny', 1777, 1421, 1689, 1351, 1, '3', 291),
  (920047, 34, 'Crown Nidoking', 'Normal', 'Poison / Ground', 'Cloudy / Sunny', 1833, 1466, 1743, 1395, 1, '3', 292),
  (920048, 25, 'Dapper Pikachu with red accents', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 296),
  (920049, 25, 'Dapper Pikachu with blue accents', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 297),
  (920050, 25, 'Dapper Pikachu with yellow accents', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 298),
  (920051, 870, 'Train conductor Falinks', 'Normal', 'Fighting', 'Cloudy', 1683, 1347, 1598, 1278, 1, '3', 299),
  (920052, 133, 'Party Hat Eevee', 'Normal', 'Normal', 'Partly Cloudy', 765, 612, 707, 565, 1, '1', 175),
  (920053, 25, 'Varsity jacket Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 304),
  (920054, 287, 'Visor Slakoth', 'Normal', 'Normal', 'Partly Cloudy', 716, 572, 659, 527, 1, '1', 263),
  (920055, 25, 'Halloween Mischief Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 219),
  (920056, 393, 'Halloween Mischief Piplup', 'Normal', 'Water', 'Rainy', 767, 614, 710, 568, 1, '1', 144),
  (920057, 760, 'Bewear wearing a wilderness cape', 'Normal', 'Normal / Fighting', 'Partly Cloudy / Cloudy', 2226, 1781, 2125, 1700, 1, '3', 311),
  (920058, 185, 'Holiday Sudowoodo', 'Normal', 'Rock', 'Partly Cloudy', 1534, 1227, 1452, 1162, 1, '3', 312),
  (920059, 737, 'Holiday Charjabug', 'Normal', 'Bug / Electric', 'Rainy', 1212, 970, 1140, 912, 1, '3', 313),
  (920060, 25, 'Party Top Hat Pikachu', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 7),
  (920061, 25, 'Pikachu wearing Brendan''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 12),
  (920062, 25, 'Pikachu wearing May''s bow', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 59),
  (920063, 25, 'Pikachu wearing Lucas''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 221),
  (920064, 25, 'Pikachu wearing Dawn''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 223),
  (920065, 25, 'Pikachu wearing Rei''s cap', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 225),
  (920066, 25, 'Pikachu wearing Akari''s kerchief', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 227),
  (920067, 25, 'Pikachu wearing Red''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 317),
  (920068, 25, 'Pikachu wearing Leaf''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 318),
  (920069, 25, 'Pikachu wearing Ethan''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 319),
  (920070, 25, 'Pikachu wearing Lyra''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 320),
  (920071, 25, 'Pikachu wearing Calem''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 315),
  (920072, 25, 'Pikachu wearing Serena''s hat', 'Normal', 'Electric', 'Rainy', 670, 536, 616, 493, 1, '1', 316),
  (920073, 453, 'Fashionable Croagunk', 'Normal', 'Poison / Fighting', 'Cloudy', 680, 544, 625, 500, 1, '1', 128),
  (920074, 522, 'Fashionable Blitzle', 'Normal', 'Electric', 'Rainy', 630, 504, 577, 461, 1, '1', 132);

COMMIT;
