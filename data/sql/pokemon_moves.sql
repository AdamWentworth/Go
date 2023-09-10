SELECT 
    p.pokemon_id, 
    p.name AS Pokemon_Name,
    p.form AS Pokemon_Form,
    m.move_id,
    m.name AS Move_Name,
    pm.legacy AS Is_Legacy
FROM 
    pokemon_moves pm
JOIN 
    pokemon p ON pm.pokemon_id = p.pokemon_id
JOIN 
    moves m ON pm.move_id = m.move_id;
