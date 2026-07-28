const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CATALOG_DEMAND_FLOORS,
  buildWantedDemandModel,
  wantedDemandModel,
} = require('./wantedDemandModel');
const { buildDemandRows, demandInstanceId } = require('./wantedDemandSql');

test('defines exactly 100 unique demand targets in descending order', () => {
  assert.equal(wantedDemandModel.length, 100);
  assert.equal(new Set(wantedDemandModel.map((target) => target.variantId)).size, 100);
  for (let index = 0; index < wantedDemandModel.length; index += 1) {
    assert.equal(wantedDemandModel[index].rank, index + 1);
    if (index > 0) {
      assert.ok(wantedDemandModel[index - 1].wantedUsers > wantedDemandModel[index].wantedUsers);
    }
  }
});

test('preserves the externally observed top demand order', () => {
  assert.deepEqual(
    wantedDemandModel.slice(0, 10).map((target) => target.label),
    [
      'Shiny Rayquaza',
      'Shiny Necrozma',
      'Shiny Kyurem',
      'Shiny Mewtwo',
      'Shiny Zacian (Crown Unlocked)',
      'Armored Mewtwo',
      'Shiny Groudon',
      'Shiny Zamazenta (Crown Unlocked)',
      'Shiny Kyogre',
      'Shiny Origin Forme Dialga',
    ]
  );
});

test('demotes Community Day shinies below scarce regional targets', () => {
  const jangmo = wantedDemandModel.find((target) => target.variantId === '0782-shiny');
  const frigibax = wantedDemandModel.find((target) => target.variantId === '0996-shiny');

  assert.equal(jangmo.communityDay, true);
  assert.equal(frigibax.communityDay, true);
  assert.ok(jangmo.wantedUsers <= 4);
  assert.ok(frigibax.wantedUsers <= 4);
  assert.ok(
    wantedDemandModel.every(
      (target) => target.mostWantedUsers <= target.wantedUsers
    )
  );
});

test('includes only released shiny Gigantamax targets', () => {
  const ids = new Set(wantedDemandModel.map((target) => target.variantId));

  assert.equal(ids.has('0812-shiny_gigantamax'), false);
  assert.equal(ids.has('0815-shiny_gigantamax'), false);
  assert.equal(ids.has('0818-shiny_gigantamax'), false);
  assert.equal(ids.has('0012-shiny_gigantamax'), true);
  assert.equal(ids.has('0099-shiny_gigantamax'), true);
  assert.equal(ids.has('0861-shiny_gigantamax'), true);
});

test('encodes high-value qualities without changing variant identity', () => {
  const dialga = wantedDemandModel.find((target) => target.variantId === '2336-shiny');
  assert.equal(dialga.locationCard, '28');
  assert.equal(dialga.chargedMove1Id, 288);
  assert.deepEqual(dialga.wantedFilters, { background: true, signature_move: true });

  const charizard = wantedDemandModel.find((target) => target.variantId === '0006-shiny_gigantamax');
  assert.equal(charizard.gigantamax, true);
  assert.equal(charizard.dynamax, true);
});

test('does not advertise untradeable active Crowned forms', () => {
  assert.equal(
    wantedDemandModel.some((target) => target.pokemonId === 888 || target.pokemonId === 889),
    false
  );
  assert.equal(wantedDemandModel.find((target) => target.pokemonId === 2290).crown, true);
  assert.equal(wantedDemandModel.find((target) => target.pokemonId === 2292).crown, true);
});

test('does not advertise temporary Mega, Primal, or fused forms', () => {
  assert.deepEqual(
    wantedDemandModel.filter(
      (target) => target.mega || target.isFused || target.variantId.includes('primal')
    ),
    []
  );
});

test('excludes Mythical Pokemon that cannot be traded', () => {
  const tradeIneligiblePokemonIds = new Set([
    151, 251, 385, 386, 489, 490, 491, 492, 494, 647, 648, 719, 720, 721, 801,
    802, 807, 808, 809, 893,
  ]);
  assert.deepEqual(
    wantedDemandModel.filter((target) => tradeIneligiblePokemonIds.has(target.pokemonId)),
    []
  );
});

test('assigns deterministic unique fake-user demand rows', () => {
  const users = Array.from({ length: 1000 }, (_, index) => ({
    user_id: `fake-${index}`,
    username: `fakeUser${String(index).padStart(4, '0')}`,
  }));
  const rowsA = buildDemandRows(wantedDemandModel.slice(0, 2), users);
  const rowsB = buildDemandRows(wantedDemandModel.slice(0, 2), [...users].reverse());
  assert.deepEqual(rowsA, rowsB);
  assert.equal(rowsA.length, wantedDemandModel[0].wantedUsers + wantedDemandModel[1].wantedUsers);
  assert.equal(new Set(rowsA.map((row) => row.instanceId)).size, rowsA.length);
  assert.equal(
    demandInstanceId(rowsA[0].variantId, rowsA[0].userId),
    rowsA[0].instanceId
  );
});

test('adds catalog-wide demand floors for released Max collectibles', () => {
  const catalog = [{
    pokemon_id: 6,
    pokedex_number: 6,
    name: 'Charizard',
    available: true,
    shiny_available: true,
    date_available: '2016-07-06',
    date_shiny_available: '2018-05-19',
    max: [{
      dynamax: true,
      gigantamax: true,
      dynamax_release_date: '2024-09-10',
      gigantamax_release_date: '2024-10-26',
      shiny_gigantamax_image_url: '/charizard-gmax-shiny.png',
    }],
  }, {
    pokemon_id: 25,
    pokedex_number: 25,
    name: 'Pikachu',
    available: true,
    shiny_available: true,
    date_available: '2016-07-06',
    date_shiny_available: '2017-08-09',
    max: [{
      dynamax: true,
      gigantamax: true,
      dynamax_release_date: '2024-09-10',
      gigantamax_release_date: '2024-10-26',
      shiny_gigantamax_image_url: '/pikachu-gmax-shiny.png',
    }],
  }];

  const model = buildWantedDemandModel(catalog, Date.parse('2026-07-27'));
  const byId = new Map(model.map((target) => [target.variantId, target]));

  // Curated leaders keep their stronger observed demand.
  assert.equal(byId.get('0006-shiny_gigantamax').wantedUsers, 365);
  assert.equal(byId.get('0025-shiny_gigantamax').wantedUsers, CATALOG_DEMAND_FLOORS.shiny_gigantamax);
  assert.equal(byId.get('0025-gigantamax').wantedUsers, CATALOG_DEMAND_FLOORS.gigantamax);
  assert.equal(byId.get('0025-shiny_dynamax').wantedUsers, CATALOG_DEMAND_FLOORS.shiny_dynamax);
  assert.equal(byId.get('0025-dynamax').wantedUsers, CATALOG_DEMAND_FLOORS.dynamax);
});

test('gives every released tradeable shiny a nonzero demand floor', () => {
  const catalog = [{
    pokemon_id: 19,
    pokedex_number: 19,
    name: 'Rattata',
    available: true,
    shiny_available: true,
    date_available: '2016-07-06',
    date_shiny_available: '2019-02-26',
    costumes: [{
      costume_id: 901,
      name: 'party_hat',
      date_available: '2020-01-01',
      shiny_available: true,
      date_shiny_available: '2020-01-01',
      image_url_shiny: '/rattata-party-shiny.png',
    }],
  }];

  const model = buildWantedDemandModel(catalog, Date.parse('2026-07-27'));
  const byId = new Map(model.map((target) => [target.variantId, target]));

  assert.equal(byId.get('0019-shiny').wantedUsers, CATALOG_DEMAND_FLOORS.shiny);
  assert.equal(
    byId.get('0019-party_hat_shiny').wantedUsers,
    CATALOG_DEMAND_FLOORS.shiny_costume,
  );
  assert.equal(byId.get('0019-party_hat_shiny').costumeId, 901);
});

test('does not create Max demand for unreleased or untradeable forms', () => {
  const catalog = [{
    pokemon_id: 151,
    pokedex_number: 151,
    name: 'Mew',
    available: true,
    shiny_available: true,
    max: [{
      dynamax: true,
      gigantamax: false,
      dynamax_release_date: '2025-01-01',
    }],
  }, {
    pokemon_id: 52,
    pokedex_number: 52,
    name: 'Meowth',
    available: true,
    shiny_available: true,
    max: [{
      dynamax: true,
      gigantamax: true,
      dynamax_release_date: '2027-01-01',
      gigantamax_release_date: '2027-01-01',
      shiny_gigantamax_image_url: '/meowth-gmax-shiny.png',
    }],
  }];

  const model = buildWantedDemandModel(catalog, Date.parse('2026-07-27'));
  assert.equal(model.some((target) => target.pokemonId === 151), false);
  assert.equal(
    model.some(
      (target) =>
        target.pokemonId === 52 &&
        (target.dynamax || target.gigantamax),
    ),
    false,
  );
  assert.equal(model.some((target) => target.variantId === '0052-shiny'), true);
});
