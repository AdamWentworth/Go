UPDATE places SET name_search = unaccent(lower(name));

UPDATE places SET state_or_province_search = unaccent(lower(state_or_province));

UPDATE places p
SET country_search = unaccent(lower(c.name))
FROM countries c
WHERE p.country_id = c.id;

UPDATE places p
SET full_search = unaccent(lower(coalesce(p.name, '') || ' ' || coalesce(p.state_or_province, '') || ' ' || coalesce(c.name, '')))
FROM countries c
WHERE p.country_id = c.id;

UPDATE places p SET search_tsv = to_tsvector('simple', full_search);

VACUUM ANALYZE