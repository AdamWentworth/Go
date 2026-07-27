const { buildCatalogRarityVariants, matchSourceEntries } = require('./catalogRarityVariants');
const { readRaritySource } = require('./raritySource');

const POPULATION = 1000;
const MIN_OWNERS = 2;

function ageYears(date, now = Date.now()) {
  const timestamp = Date.parse(date || '');
  if (Number.isNaN(timestamp)) return 5;
  return Math.max(0, (now - timestamp) / (365.25 * 24 * 60 * 60 * 1000));
}

function genericOwners(variant, now = Date.now()) {
  const age = ageYears(variant.dateAvailable, now);
  const ageFactor = Math.min(1, 0.2 + age / 5);
  const ranges = {
    default: [50, 320],
    shadow: [30, 180],
    costume: [20, 140],
    dynamax: [30, 150],
    gigantamax: [15, 80],
    shiny: [40, 150],
    shiny_shadow: [55, 110],
    shiny_costume: [45, 100],
    shiny_dynamax: [35, 100],
    shiny_gigantamax: [30, 80],
  };
  const [minimum, maximum] = ranges[variant.kind] || (variant.shiny ? [12, 120] : [100, 600]);
  return Math.round(minimum + (maximum - minimum) * ageFactor);
}

function empiricalOwners(percent) {
  return Math.max(MIN_OWNERS, Math.round((percent / 100) * POPULATION));
}

function unknownZeroOwners(variant) {
  if (variant.kind === 'shiny_costume') return 50;
  if (variant.kind === 'shiny_shadow') return 60;
  if (variant.kind === 'shiny_gigantamax') return 50;
  if (variant.shiny) return 65;
  return genericOwners(variant);
}

function enforceShinyRarity(targets) {
  const byPokemon = new Map();
  for (const target of targets) {
    const key = `${target.pokemonId}:${target.costumeId || ''}:${target.shadow ? 'shadow' : ''}:${target.dynamax ? 'max' : ''}`;
    const group = byPokemon.get(key) || [];
    group.push(target);
    byPokemon.set(key, group);
  }
  for (const group of byPokemon.values()) {
    const nonShiny = group.filter((target) => !target.shiny);
    const shiny = group.filter((target) => target.shiny);
    if (nonShiny.length === 0 || shiny.length === 0) continue;
    const shinyCeiling = Math.max(...shiny.map((target) => target.targetOwners));
    for (const target of nonShiny) {
      target.targetOwners = Math.max(target.targetOwners, shinyCeiling + 1);
    }
  }
}

function buildCaughtRarityModel(catalog, options = {}) {
  const now = options.now || Date.now();
  const variants = buildCatalogRarityVariants(catalog, now);
  const source = readRaritySource(options.sourcePath);
  const empirical = new Map();
  const zeroUnknown = new Map();
  const unmatched = [];
  const ignoredZeroes = [];

  for (const entry of source) {
    const matchedVariants = matchSourceEntries(entry, variants);
    if (entry.zeroIsUnknown) {
      ignoredZeroes.push({ entry, variants: matchedVariants });
      for (const variant of matchedVariants) zeroUnknown.set(variant.variantId, entry);
      continue;
    }
    if (matchedVariants.length === 0) {
      unmatched.push(entry);
      continue;
    }
    for (const variant of matchedVariants) {
      const current = empirical.get(variant.variantId);
      if (!current || entry.percent < current.percent) empirical.set(variant.variantId, entry);
    }
  }

  const targets = variants.map((variant) => {
    const sourceEntry = empirical.get(variant.variantId);
    const zeroEntry = zeroUnknown.get(variant.variantId);
    return {
      ...variant,
      targetOwners: sourceEntry
        ? empiricalOwners(sourceEntry.percent)
        : zeroEntry
          ? unknownZeroOwners(variant)
          : genericOwners(variant, now),
      source: sourceEntry ? 'survey' : zeroEntry ? 'survey-zero-unknown' : 'modeled',
      sourcePercent: sourceEntry?.percent ?? null,
      sourceName: sourceEntry?.name ?? zeroEntry?.name ?? null,
    };
  });
  enforceShinyRarity(targets);
  targets.sort((left, right) => (
    left.targetOwners - right.targetOwners ||
    Number(right.shiny) - Number(left.shiny) ||
    left.variantId.localeCompare(right.variantId)
  ));
  return { targets, unmatched, ignoredZeroes, sourceRows: source.length };
}

module.exports = {
  MIN_OWNERS,
  POPULATION,
  buildCaughtRarityModel,
  empiricalOwners,
  genericOwners,
  unknownZeroOwners,
};
