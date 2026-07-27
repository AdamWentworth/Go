const { normalizeName, sourceHint } = require('./raritySource');

const pad = (pokemonId) => String(pokemonId).padStart(4, '0');

const SHINY_GIGANTAMAX_RELEASE_OVERRIDES = new Map([
  [812, '2026-08-01'],
  [815, null],
  [818, null],
]);

function released(date, now = Date.now()) {
  if (!date) return true;
  const timestamp = Date.parse(date);
  return Number.isNaN(timestamp) || timestamp <= now;
}

function shinyGigantamaxReleased(pokemon, now) {
  if (!SHINY_GIGANTAMAX_RELEASE_OVERRIDES.has(pokemon.pokemon_id)) return true;
  const releaseDate = SHINY_GIGANTAMAX_RELEASE_OVERRIDES.get(pokemon.pokemon_id);
  return releaseDate != null && released(releaseDate, now);
}

function variantRecord(pokemon, variantId, label, kind, dateAvailable, extra = {}) {
  return {
    pokemonId: pokemon.pokemon_id,
    pokedexNumber: pokemon.pokedex_number,
    speciesName: pokemon.name,
    form: pokemon.form || null,
    variantId,
    label,
    kind,
    dateAvailable: dateAvailable || pokemon.date_available || null,
    ...extra,
  };
}

function buildCatalogRarityVariants(catalog, now = Date.now()) {
  const variants = [];
  for (const pokemon of catalog) {
    if (!pokemon.available || !released(pokemon.date_available, now)) continue;
    const base = pad(pokemon.pokemon_id);
    const formLabel = pokemon.form ? `${pokemon.form} ${pokemon.name}` : pokemon.name;
    variants.push(variantRecord(pokemon, `${base}-default`, formLabel, 'default', pokemon.date_available));

    if (pokemon.shiny_available && released(pokemon.date_shiny_available, now)) {
      variants.push(variantRecord(
        pokemon, `${base}-shiny`, `Shiny ${formLabel}`, 'shiny', pokemon.date_shiny_available, { shiny: true }
      ));
    }
    if (pokemon.date_shadow_available && released(pokemon.date_shadow_available, now)) {
      variants.push(variantRecord(
        pokemon, `${base}-shadow`, `Shadow ${formLabel}`, 'shadow', pokemon.date_shadow_available, { shadow: true }
      ));
    }
    if (pokemon.date_shiny_shadow_available && released(pokemon.date_shiny_shadow_available, now)) {
      variants.push(variantRecord(
        pokemon, `${base}-shiny_shadow`, `Shiny Shadow ${formLabel}`, 'shiny_shadow',
        pokemon.date_shiny_shadow_available, { shiny: true, shadow: true }
      ));
    }

    for (const costume of pokemon.costumes || []) {
      if (!released(costume.date_available, now)) continue;
      variants.push(variantRecord(
        pokemon,
        `${base}-${costume.name}_default`,
        `${costume.name} ${formLabel}`,
        'costume',
        costume.date_available,
        { costumeId: costume.costume_id, costumeName: costume.name }
      ));
      if (costume.shiny_available && costume.image_url_shiny && released(costume.date_shiny_available, now)) {
        variants.push(variantRecord(
          pokemon,
          `${base}-${costume.name}_shiny`,
          `Shiny ${costume.name} ${formLabel}`,
          'shiny_costume',
          costume.date_shiny_available,
          { shiny: true, costumeId: costume.costume_id, costumeName: costume.name }
        ));
      }
      const shadowCostume = costume.shadow_costume;
      if (
        shadowCostume?.image_url_shadow_costume &&
        released(shadowCostume.date_available, now)
      ) {
        variants.push(variantRecord(
          pokemon,
          `${base}-shadow_${costume.name}_default`,
          `Shadow ${costume.name} ${formLabel}`,
          'shadow_costume',
          shadowCostume.date_available,
          { shadow: true, costumeId: costume.costume_id, costumeName: costume.name }
        ));
      }
      if (
        shadowCostume?.image_url_shiny_shadow_costume &&
        released(shadowCostume.date_shiny_available, now)
      ) {
        variants.push(variantRecord(
          pokemon,
          `${base}-shadow_${costume.name}_shiny`,
          `Shiny Shadow ${costume.name} ${formLabel}`,
          'shiny_shadow_costume',
          shadowCostume.date_shiny_available,
          {
            shiny: true,
            shadow: true,
            costumeId: costume.costume_id,
            costumeName: costume.name,
          }
        ));
      }
    }

    for (const max of pokemon.max || []) {
      if (max.dynamax && released(max.dynamax_release_date, now)) {
        variants.push(variantRecord(pokemon, `${base}-dynamax`, `Dynamax ${formLabel}`, 'dynamax', max.dynamax_release_date, {
          dynamax: true,
        }));
        if (pokemon.shiny_available) {
          variants.push(variantRecord(
            pokemon, `${base}-shiny_dynamax`, `Shiny Dynamax ${formLabel}`, 'shiny_dynamax',
            pokemon.date_shiny_available || max.dynamax_release_date, { shiny: true, dynamax: true }
          ));
        }
      }
      if (max.gigantamax && released(max.gigantamax_release_date, now)) {
        variants.push(variantRecord(
          pokemon, `${base}-gigantamax`, `Gigantamax ${formLabel}`, 'gigantamax', max.gigantamax_release_date,
          { dynamax: true, gigantamax: true }
        ));
        if (
          pokemon.shiny_available &&
          max.shiny_gigantamax_image_url &&
          shinyGigantamaxReleased(pokemon, now)
        ) {
          variants.push(variantRecord(
            pokemon, `${base}-shiny_gigantamax`, `Shiny Gigantamax ${formLabel}`, 'shiny_gigantamax',
            SHINY_GIGANTAMAX_RELEASE_OVERRIDES.get(pokemon.pokemon_id) ||
              pokemon.date_shiny_available ||
              max.gigantamax_release_date,
            { shiny: true, dynamax: true, gigantamax: true }
          ));
        }
      }
    }
  }
  return [...new Map(variants.map((variant) => [variant.variantId, variant])).values()];
}

function matchSourceEntry(entry, variants) {
  const hint = sourceHint(entry);
  const pokedexNumbers = hint.pokedexNumbers || [hint.pokedexNumber];
  let candidates = variants.filter((variant) => (
    variant.shiny &&
    (hint.pokemonId ? variant.pokemonId === hint.pokemonId : pokedexNumbers.includes(variant.pokedexNumber))
  ));
  if (hint.form) {
    candidates = candidates.filter((variant) => normalizeName(variant.form) === normalizeName(hint.form));
  }
  if (hint.shadow) {
    candidates = candidates.filter((variant) => variant.kind === 'shiny_shadow');
  } else {
    candidates = candidates.filter((variant) => !variant.shadow);
  }
  if (hint.costume) {
    candidates = candidates.filter(
      (variant) => normalizeName(variant.costumeName) === normalizeName(hint.costume)
    );
  }
  if (candidates.length === 1) return candidates[0];

  const specialWords = /\b(shadow|gigantamax|dynamax|costume|hat|shirt|balloon|party|holiday|crown|glasses|scarf|attire)\b/;
  if (!specialWords.test(entry.normalizedName)) {
    const plain = candidates.filter((candidate) => candidate.kind === 'shiny');
    if (plain.length === 1) return plain[0];
  }

  const sourceTokens = new Set(entry.normalizedName.split(' '));
  const scored = candidates.map((candidate) => {
    const candidateTokens = normalizeName(
      `${candidate.label} ${candidate.kind} ${candidate.form || ''} ${candidate.costumeName || ''} ${candidate.speciesName}`
    ).split(' ');
    return {
      candidate,
      score: candidateTokens.filter((token) => sourceTokens.has(token)).length,
    };
  }).sort((left, right) => right.score - left.score);
  if (scored[0] && (scored.length === 1 || scored[0].score > scored[1].score)) return scored[0].candidate;
  return null;
}

function matchSourceEntries(entry, variants) {
  const hint = sourceHint(entry);
  if (hint.pokemonId || hint.form || hint.costume) {
    const match = matchSourceEntry(entry, variants);
    return match ? [match] : [];
  }
  const pokedexNumbers = hint.pokedexNumbers || [hint.pokedexNumber];
  let candidates = variants.filter((variant) => (
    variant.shiny && pokedexNumbers.includes(variant.pokedexNumber)
  ));
  if (hint.shadow) {
    candidates = candidates.filter((variant) => variant.kind === 'shiny_shadow');
    if (entry.normalizedName.includes(' alolan ')) {
      candidates = candidates.filter((variant) => normalizeName(variant.form) === 'alolan');
    } else if (entry.normalizedName.includes(' galarian ')) {
      candidates = candidates.filter((variant) => normalizeName(variant.form) === 'galarian');
    } else if (entry.normalizedName.includes(' kanto ')) {
      candidates = candidates.filter((variant) => !variant.form);
    }
  } else {
    candidates = candidates.filter((variant) => variant.kind === 'shiny');
  }

  const exactSpecies = candidates.filter(
    (variant) => normalizeName(variant.speciesName) === normalizeName(hint.speciesName)
  );
  if (exactSpecies.length > 0) {
    candidates = exactSpecies;
  } else if (!hint.shadow) {
    const namesAnExactCollectible = !candidates.some(
      (variant) => normalizeName(variant.speciesName) === entry.normalizedName
    );
    if (namesAnExactCollectible) {
      const match = matchSourceEntry(entry, variants);
      if (match) return [match];
    }
  }
  return candidates.length > 0 ? candidates : [matchSourceEntry(entry, variants)].filter(Boolean);
}

module.exports = {
  SHINY_GIGANTAMAX_RELEASE_OVERRIDES,
  buildCatalogRarityVariants,
  matchSourceEntries,
  matchSourceEntry,
  released,
};
