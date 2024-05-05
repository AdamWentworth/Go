SELECT
    p.pokemon_id AS PokemonID,
    p.name AS PokemonName,
    e.evolves_to AS EvolvesToID,
    (SELECT name FROM pokemon WHERE pokemon_id = e.evolves_to) AS EvolvesToName,
    e.candies_needed AS CandiesNeeded,
    e.trade_discount AS TradeDiscount,
    ei.name AS EvolutionItem,
    e.other AS OtherDetails
FROM
    pokemon p
JOIN
    pokemon_evolutions e ON p.pokemon_id = e.pokemon_id
LEFT JOIN
    evolution_items ei ON e.item_id = ei.item_id
ORDER BY
    p.pokemon_id;
