const { buildCatalogRarityVariants, matchSourceEntries } = require('./catalogRarityVariants');
const { readRaritySource } = require('./raritySource');

const POPULATION = 1000;
const MIN_OWNERS = 2;
const MIN_SHINY_OWNER_GAP = 100;
const BOOSTED_SHINY_OWNER_FLOORS = new Map([
  [302, 250],
]);
const NON_SHINY_OWNER_FLOORS = {
  default: 750,
  shadow: 650,
  costume: 700,
  shadow_costume: 650,
  dynamax: 500,
  gigantamax: 350,
};

function ageYears(date, now = Date.now()) {
  const timestamp = Date.parse(date || '');
  if (Number.isNaN(timestamp)) return 5;
  return Math.max(0, (now - timestamp) / (365.25 * 24 * 60 * 60 * 1000));
}

function genericOwners(variant, now = Date.now()) {
  const age = ageYears(variant.dateAvailable, now);
  const ageFactor = Math.min(1, 0.2 + age / 5);
  const ranges = {
    default: [750, 950],
    shadow: [650, 900],
    costume: [450, 850],
    dynamax: [500, 850],
    gigantamax: [350, 700],
    shiny: [35, 160],
    shiny_shadow: [15, 100],
    shadow_costume: [450, 750],
    shiny_shadow_costume: [90, 170],
    shiny_costume: [25, 120],
    shiny_dynamax: [30, 120],
    shiny_gigantamax: [20, 90],
  };
  const [minimum, maximum] = ranges[variant.kind] || (variant.shiny ? [12, 120] : [100, 600]);
  return Math.round(minimum + (maximum - minimum) * ageFactor);
}

function empiricalOwners(percent) {
  return Math.min(
    POPULATION - MIN_SHINY_OWNER_GAP,
    Math.max(MIN_OWNERS, Math.round((percent / 100) * POPULATION)),
  );
}

function unknownZeroOwners(variant) {
  if (variant.kind === 'shiny_costume') return 50;
  if (variant.kind === 'shiny_shadow_costume') return 110;
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
      target.targetOwners = Math.min(
        POPULATION,
        Math.max(
          target.targetOwners,
          NON_SHINY_OWNER_FLOORS[target.kind] || 0,
          shinyCeiling + MIN_SHINY_OWNER_GAP,
          shinyCeiling * 2,
        ),
      );
    }
  }
}

function enforceNonShinyFloors(targets) {
  for (const target of targets) {
    if (target.shiny) continue;
    target.targetOwners = Math.max(
      target.targetOwners,
      NON_SHINY_OWNER_FLOORS[target.kind] || 0,
    );
  }
}

function enforceBoostedShinyFloors(targets) {
  for (const target of targets) {
    if (target.kind !== 'shiny') continue;
    const floor = BOOSTED_SHINY_OWNER_FLOORS.get(target.pokemonId);
    if (floor !== undefined) {
      target.targetOwners = Math.max(target.targetOwners, floor);
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
  enforceNonShinyFloors(targets);
  enforceBoostedShinyFloors(targets);
  enforceShinyRarity(targets);
  targets.sort((left, right) => (
    left.targetOwners - right.targetOwners ||
    Number(right.shiny) - Number(left.shiny) ||
    left.variantId.localeCompare(right.variantId)
  ));
  return { targets, unmatched, ignoredZeroes, sourceRows: source.length };
}

module.exports = {
  BOOSTED_SHINY_OWNER_FLOORS,
  MIN_OWNERS,
  MIN_SHINY_OWNER_GAP,
  NON_SHINY_OWNER_FLOORS,
  POPULATION,
  buildCaughtRarityModel,
  empiricalOwners,
  genericOwners,
  unknownZeroOwners,
};
