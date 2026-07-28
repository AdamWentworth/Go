const TOP_DEMAND = [
  ['0384-shiny', 384, 'Shiny Rayquaza', 760, { background: 240 }],
  ['0800-shiny', 800, 'Shiny Necrozma', 610, { background: 240 }],
  ['0646-shiny', 646, 'Shiny Kyurem', 575, { background: 240 }],
  ['0150-shiny', 150, 'Shiny Mewtwo', 550, { background: 237 }],
  ['2290-shiny', 2290, 'Shiny Zacian (Crown Unlocked)', 510, { background: 240, dynamax: true, crown: true }],
  ['2052-default', 2052, 'Armored Mewtwo', 465],
  ['0383-shiny', 383, 'Shiny Groudon', 445, { background: 240 }],
  ['2292-shiny', 2292, 'Shiny Zamazenta (Crown Unlocked)', 425, { background: 240, dynamax: true, crown: true }],
  ['0382-shiny', 382, 'Shiny Kyogre', 395, { background: 240 }],
  ['2336-shiny', 2336, 'Shiny Origin Forme Dialga', 385, { background: 28, chargedMove: 288 }],
  ['0006-shiny_gigantamax', 6, 'Shiny Gigantamax Charizard', 365, { background: 80, dynamax: true, gigantamax: true }],
  ['2337-shiny', 2337, 'Shiny Origin Forme Palkia', 355, { background: 28, chargedMove: 289 }],
  ['0025-rayquaza_shiny', 25, 'Shiny Rayquaza Hat Pikachu', 345, { costume: 67 }],
  ['0025-fall_shiny', 25, 'Shiny Fall Pikachu', 335, { costume: 18 }],
  ['2039-shiny', 2039, 'Shiny Galarian Moltres', 330],
  ['0806-shiny', 806, 'Shiny Blacephalon', 325, { background: 240 }],
  ['0094-shiny_gigantamax', 94, 'Shiny Gigantamax Gengar', 320, { background: 80, dynamax: true, gigantamax: true }],
  ['0025-charizard_shiny', 25, 'Shiny Charizard Hat Pikachu', 315, { costume: 14 }],
  ['0025-umbreon_shiny', 25, 'Shiny Umbreon Hat Pikachu', 310, { costume: 77 }],
  ['2037-shiny', 2037, 'Shiny Galarian Articuno', 300],
  ['2038-shiny', 2038, 'Shiny Galarian Zapdos', 295],
  ['0369-shiny', 369, 'Shiny Relicanth', 290],
  ['0479-shiny', 479, 'Shiny Rotom', 285],
  ['0025-excavator_shiny', 25, 'Shiny Excavator Pikachu', 280, { costume: 326 }],
  ['0791-shiny', 791, 'Shiny Solgaleo', 275],
  ['0025-libre_shiny', 25, 'Shiny Pikachu Libre', 270, { costume: 19 }],
  ['0068-shiny_gigantamax', 68, 'Shiny Gigantamax Machamp', 226, { dynamax: true, gigantamax: true }],
  ['0003-shiny_gigantamax', 3, 'Shiny Gigantamax Venusaur', 222, { dynamax: true, gigantamax: true }],
  ['0009-shiny_gigantamax', 9, 'Shiny Gigantamax Blastoise', 218, { dynamax: true, gigantamax: true }],
  ['0131-shiny_gigantamax', 131, 'Shiny Gigantamax Lapras', 214, { dynamax: true, gigantamax: true }],
  ['0143-shiny_gigantamax', 143, 'Shiny Gigantamax Snorlax', 210, { dynamax: true, gigantamax: true }],
  ['0849-shiny_gigantamax', 849, 'Shiny Gigantamax Toxtricity', 206, { dynamax: true, gigantamax: true }],
  ['0012-shiny_gigantamax', 12, 'Shiny Gigantamax Butterfree', 202, { dynamax: true, gigantamax: true }],
  ['0099-shiny_gigantamax', 99, 'Shiny Gigantamax Kingler', 198, { dynamax: true, gigantamax: true }],
  ['0861-shiny_gigantamax', 861, 'Shiny Gigantamax Grimmsnarl', 194, { dynamax: true, gigantamax: true }],
  ['0025-rock_shiny', 25, 'Shiny Rock Star Pikachu', 190, { costume: 44 }],
  ['0025-pop_shiny', 25, 'Shiny Pop Star Pikachu', 187, { costume: 43 }],
  ['0025-fragment_shiny', 25, 'Shiny Fragment Hat Pikachu', 184, { costume: 52 }],
  ['0025-ash_shiny', 25, 'Shiny Ash Hat Pikachu', 181, { costume: 11 }],
  ['0025-detective_shiny', 25, 'Shiny Detective Pikachu', 178, { costume: 16 }],
  ['0025-witch_hat_shiny', 25, 'Shiny Witch Hat Pikachu', 175, { costume: 79 }],
  ['0025-lucario_shiny', 25, 'Shiny Lucario Hat Pikachu', 172, { costume: 57 }],
  ['0025-straw_hat_shiny', 25, 'Shiny Straw Hat Pikachu', 169, { costume: 73 }],
  ['0025-marathon_visor_shiny', 25, 'Shiny Marathon Pikachu', 166, { costume: 325 }],
  ['0025-baseball_shirt_shiny', 25, 'Shiny Baseball Pikachu', 163, { costume: 323 }],
  ['0025-ph.d._default', 25, 'Pikachu Ph.D.', 160, { costume: 20 }],
  ['0487-shiny', 487, 'Shiny Giratina', 148],
  ['0483-shiny', 483, 'Shiny Dialga', 145],
  ['0484-shiny', 484, 'Shiny Palkia', 142],
  ['0249-shiny', 249, 'Shiny Lugia', 139],
  ['0250-shiny', 250, 'Shiny Ho-Oh', 136],
  ['0480-shiny', 480, 'Shiny Uxie', 133],
  ['0481-shiny', 481, 'Shiny Mesprit', 130],
  ['0482-shiny', 482, 'Shiny Azelf', 127],
  ['0115-shiny', 115, 'Shiny Kangaskhan', 124],
  ['0128-shiny', 128, 'Shiny Tauros', 121],
  ['0313-shiny', 313, 'Shiny Volbeat', 118],
  ['0785-shiny', 785, 'Shiny Tapu Koko', 115],
  ['0786-shiny', 786, 'Shiny Tapu Lele', 112],
  ['0787-shiny', 787, 'Shiny Tapu Bulu', 109],
  ['0788-shiny', 788, 'Shiny Tapu Fini', 106],
  ['0796-shiny', 796, 'Shiny Xurkitree', 103],
  ['0797-shiny', 797, 'Shiny Celesteela', 100],
  ['0798-shiny', 798, 'Shiny Kartana', 97],
  ['0799-shiny', 799, 'Shiny Guzzlord', 94],
  ['0805-shiny', 805, 'Shiny Stakataka', 91],
  ['0793-shiny', 793, 'Shiny Nihilego', 88],
  ['0794-shiny', 794, 'Shiny Buzzwole', 85],
  ['0795-shiny', 795, 'Shiny Pheromosa', 82],
  ['0214-shiny', 214, 'Shiny Heracross', 79],
  ['0222-shiny', 222, 'Shiny Corsola', 76],
  ['0324-shiny', 324, 'Shiny Torkoal', 73],
  ['0357-shiny', 357, 'Shiny Tropius', 70],
  ['0417-shiny', 417, 'Shiny Pachirisu', 67],
  ['0441-shiny', 441, 'Shiny Chatot', 64],
  ['0556-shiny', 556, 'Shiny Maractus', 61],
  ['0561-shiny', 561, 'Shiny Sigilyph', 58],
  ['0626-shiny', 626, 'Shiny Bouffalant', 55],
  ['0707-shiny', 707, 'Shiny Klefki', 52],
  ['0741-shiny', 741, 'Shiny Oricorio', 49],
  ['0314-shiny', 314, 'Shiny Illumise', 46],
  ['0335-shiny', 335, 'Shiny Zangoose', 43],
  ['0701-shiny', 701, 'Shiny Hawlucha', 40],
  ['0562-shiny', 562, 'Shiny Yamask', 37],
  ['0631-shiny', 631, 'Shiny Heatmor', 34],
  ['0632-shiny', 632, 'Shiny Durant', 31],
  ['0539-shiny', 539, 'Shiny Sawk', 28],
  ['0538-shiny', 538, 'Shiny Throh', 25],
  ['0439-shiny', 439, 'Shiny Mime Jr.', 24],
  ['0352-shiny', 352, 'Shiny Kecleon', 23],
  ['0327-shiny', 327, 'Shiny Spinda', 22],
  ['0083-shiny', 83, 'Shiny Farfetch’d', 21],
  ['0122-shiny', 122, 'Shiny Mr. Mime', 20],
  ['0336-shiny', 336, 'Shiny Seviper', 19],
  ['0337-shiny', 337, 'Shiny Lunatone', 18],
  ['0338-shiny', 338, 'Shiny Solrock', 17],
  ['0636-shiny', 636, 'Shiny Larvesta', 16],
  ['0637-shiny', 637, 'Shiny Volcarona', 15],
  ['0782-shiny', 782, 'Shiny Jangmo-o', 4, { communityDay: true }],
  ['0996-shiny', 996, 'Shiny Frigibax', 3, { communityDay: true }],
];

const TRADE_INELIGIBLE_POKEMON_IDS = new Set([
  151, 251, 385, 386, 489, 490, 491, 492, 494, 647, 648, 719, 720, 721, 801,
  802, 807, 808, 809, 893,
]);

const CATALOG_DEMAND_FLOORS = {
  shiny: 2,
  shiny_costume: 12,
  dynamax: 2,
  shiny_dynamax: 30,
  gigantamax: 45,
  shiny_gigantamax: 120,
};

function normalizeTarget([variantId, pokemonId, label, wantedUsers, options = {}], index) {
  const shiny = variantId.includes('shiny');
  return {
    rank: index + 1,
    variantId,
    pokemonId,
    label,
    wantedUsers,
    mostWantedUsers: Math.min(
      wantedUsers,
      Math.max(
        1,
        Math.round(wantedUsers * (0.42 - Math.min(index, 60) * 0.003)),
      ),
    ),
    shiny,
    costumeId: options.costume ?? null,
    locationCard: options.background == null ? null : String(options.background),
    chargedMove1Id: options.chargedMove ?? null,
    mega: Boolean(options.mega),
    megaForm: options.megaForm ?? null,
    isMega: Boolean(options.mega),
    isFused: options.fusion != null,
    fusion: options.fusion == null ? {} : { fusion_id: options.fusion },
    fusionForm: options.fusion == null ? null : String(options.fusion),
    dynamax: Boolean(options.dynamax),
    gigantamax: Boolean(options.gigantamax),
    crown: Boolean(options.crown),
    communityDay: Boolean(options.communityDay),
    wantedFilters: {
      background: options.background != null,
      signature_move: options.chargedMove != null,
    },
  };
}

const wantedDemandModel = TOP_DEMAND.map(normalizeTarget);

function catalogDemandTarget(variant) {
  const wantedUsers = CATALOG_DEMAND_FLOORS[variant.kind];
  if (
    wantedUsers == null ||
    variant.shadow ||
    TRADE_INELIGIBLE_POKEMON_IDS.has(variant.pokemonId)
  ) {
    return null;
  }
  return normalizeTarget([
    variant.variantId,
    variant.pokemonId,
    variant.label,
    wantedUsers,
    {
      costume: variant.costumeId,
      dynamax: variant.dynamax,
      gigantamax: variant.gigantamax,
    },
  ], 0);
}

function buildWantedDemandModel(catalog, now = Date.now()) {
  const { buildCatalogRarityVariants } = require('./catalogRarityVariants');
  const targets = new Map(wantedDemandModel.map((target) => [target.variantId, target]));

  for (const variant of buildCatalogRarityVariants(catalog, now)) {
    const baseline = catalogDemandTarget(variant);
    if (!baseline) continue;
    const existing = targets.get(baseline.variantId);
    if (!existing || baseline.wantedUsers > existing.wantedUsers) {
      targets.set(baseline.variantId, baseline);
    }
  }

  return [...targets.values()]
    .sort((left, right) => (
      right.wantedUsers - left.wantedUsers ||
      right.mostWantedUsers - left.mostWantedUsers ||
      left.variantId.localeCompare(right.variantId)
    ))
    .map((target, index) => ({ ...target, rank: index + 1 }));
}

module.exports = {
  CATALOG_DEMAND_FLOORS,
  TRADE_INELIGIBLE_POKEMON_IDS,
  buildWantedDemandModel,
  wantedDemandModel,
};
