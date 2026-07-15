-- The editor needs an explicit stable link key in PostgreSQL so background
-- relationships can be updated and deleted safely.
CREATE SEQUENCE IF NOT EXISTS pokemon_catalog.pokemon_backgrounds_id_seq;

ALTER TABLE pokemon_catalog.pokemon_backgrounds
  ADD COLUMN IF NOT EXISTS id BIGINT;

ALTER TABLE pokemon_catalog.pokemon_backgrounds
  ALTER COLUMN id SET DEFAULT nextval('pokemon_catalog.pokemon_backgrounds_id_seq');

UPDATE pokemon_catalog.pokemon_backgrounds
SET id = nextval('pokemon_catalog.pokemon_backgrounds_id_seq')
WHERE id IS NULL;

ALTER TABLE pokemon_catalog.pokemon_backgrounds
  ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'pokemon_catalog.pokemon_backgrounds'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE pokemon_catalog.pokemon_backgrounds
      ADD CONSTRAINT pokemon_backgrounds_pkey PRIMARY KEY (id);
  END IF;
END $$;

ALTER SEQUENCE pokemon_catalog.pokemon_backgrounds_id_seq
  OWNED BY pokemon_catalog.pokemon_backgrounds.id;

SELECT setval(
  'pokemon_catalog.pokemon_backgrounds_id_seq',
  COALESCE((SELECT MAX(id) FROM pokemon_catalog.pokemon_backgrounds), 1),
  EXISTS (SELECT 1 FROM pokemon_catalog.pokemon_backgrounds)
);
