-- Curated Max Battle encounter profiles. Tier mechanics live in migration
-- 0005; this file only records species/form availability and event overrides.
-- It is intentionally safe to apply repeatedly.
SET search_path = pokemon_catalog, public;

INSERT INTO max_battle_profiles (
  profile_id,
  pokemon_id,
  variant_kind,
  form,
  tier_key,
  is_default,
  priority,
  source_name,
  source_url,
  notes
) VALUES
  (
    100001,
    1,
    'dynamax',
    NULL,
    'one-star',
    TRUE,
    100,
    'Pokemon GO Hub Bulbasaur database',
    'https://db.pokemongohub.net/pokemon/001',
    'Dynamax Bulbasaur is documented as a one-star Max Battle.'
  ),
  (
    100002,
    1,
    'dynamax',
    NULL,
    'three-star',
    FALSE,
    10,
    'PokeGoNexus event override support',
    NULL,
    'Available for promoted events; select only when the Power Spot shows three stars.'
  )
ON CONFLICT (profile_id) DO UPDATE SET
  pokemon_id = EXCLUDED.pokemon_id,
  variant_kind = EXCLUDED.variant_kind,
  form = EXCLUDED.form,
  tier_key = EXCLUDED.tier_key,
  is_default = EXCLUDED.is_default,
  priority = EXCLUDED.priority,
  source_name = EXCLUDED.source_name,
  source_url = EXCLUDED.source_url,
  notes = EXCLUDED.notes;

SELECT setval(
  pg_get_serial_sequence('pokemon_catalog.max_battle_profiles', 'profile_id'),
  GREATEST((SELECT COALESCE(MAX(profile_id), 1) FROM max_battle_profiles), 1),
  TRUE
);
