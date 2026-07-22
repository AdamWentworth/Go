ALTER TABLE pokemon_catalog.max_pokemon
  ADD COLUMN IF NOT EXISTS gigantamax_move_name TEXT,
  ADD COLUMN IF NOT EXISTS gigantamax_move_type_id INTEGER
    REFERENCES pokemon_catalog.types(type_id);

WITH gigantamax_moves (pokemon_id, move_name, type_name) AS (
  VALUES
    (3, 'G-Max Vine Lash', 'Grass'),
    (6, 'G-Max Wildfire', 'Fire'),
    (9, 'G-Max Cannonade', 'Water'),
    (68, 'G-Max Chi Strike', 'Fighting'),
    (94, 'G-Max Terror', 'Ghost'),
    (99, 'G-Max Foam Burst', 'Water'),
    (131, 'G-Max Resonance', 'Ice'),
    (143, 'G-Max Replenish', 'Normal'),
    (812, 'G-Max Drum Solo', 'Grass'),
    (815, 'G-Max Fireball', 'Fire'),
    (818, 'G-Max Hydrosnipe', 'Water'),
    (849, 'G-Max Stun Shock', 'Electric'),
    (2275, 'G-Max Stun Shock', 'Electric')
)
UPDATE pokemon_catalog.max_pokemon AS max_form
SET gigantamax_move_name = gigantamax_moves.move_name,
    gigantamax_move_type_id = types.type_id
FROM gigantamax_moves
JOIN pokemon_catalog.types AS types
  ON LOWER(types.name) = LOWER(gigantamax_moves.type_name)
WHERE max_form.pokemon_id = gigantamax_moves.pokemon_id
  AND max_form.gigantamax IS TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'max_pokemon_gigantamax_move_complete'
      AND conrelid = 'pokemon_catalog.max_pokemon'::regclass
  ) THEN
    ALTER TABLE pokemon_catalog.max_pokemon
      ADD CONSTRAINT max_pokemon_gigantamax_move_complete
      CHECK (
        (
          gigantamax IS TRUE
          AND gigantamax_move_name IS NOT NULL
          AND gigantamax_move_type_id IS NOT NULL
        )
        OR (
          gigantamax IS DISTINCT FROM TRUE
          AND gigantamax_move_name IS NULL
          AND gigantamax_move_type_id IS NULL
        )
      );
  END IF;
END $$;
