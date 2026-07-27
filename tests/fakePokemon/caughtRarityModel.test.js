const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCaughtRarityModel, empiricalOwners } = require('./caughtRarityModel');
const { readRaritySource } = require('./raritySource');

const catalog = JSON.parse(fs.readFileSync(
  process.env.POKEMON_CATALOG_PATH || path.join('/tmp', 'pgn-pokemon-catalog.json'),
  'utf8'
));

test('treats source zeroes as unknown instead of zero ownership', () => {
  const rows = readRaritySource();
  const zero = rows.find((row) => row.players === 0);
  assert.equal(zero.zeroIsUnknown, true);
});

test('converts survey percentages to the 1000-user fake population', () => {
  assert.equal(empiricalOwners(0.257815), 3);
  assert.equal(empiricalOwners(2.449), 24);
  assert.equal(empiricalOwners(0), 2);
});

test('maps rare costumes and forms to canonical catalog variants', () => {
  const model = buildCaughtRarityModel(catalog);
  const expected = new Map([
    ['0172-ash_shiny', 'Original Ash Pichu'],
    ['0025-libre_shiny', 'Pikachu Libre'],
    ['0143-nightcap_shiny', 'Nightcap Snorlax'],
    ['0025-flying_okinawa_shiny', 'Okinawa Balloon Pikachu'],
    ['2306-shiny', 'Unown (C)'],
  ]);
  for (const [variantId, sourceName] of expected) {
    const target = model.targets.find((candidate) => (
      candidate.variantId === variantId && candidate.sourceName === sourceName
    ));
    assert.ok(target, `${sourceName} should map to ${variantId}`);
  }
});

test('keeps independently surveyed Unown forms distinct', () => {
  const { targets } = buildCaughtRarityModel(catalog);
  const byId = new Map(targets.map((target) => [target.variantId, target]));
  assert.equal(byId.get('2330-shiny').sourceName, 'Unown (!)');
  assert.equal(byId.get('2330-shiny').targetOwners, 25);
  assert.equal(byId.get('2307-shiny').sourceName, 'Unown (D)');
  assert.equal(byId.get('2307-shiny').targetOwners, 62);
});

test('keeps independently surveyed forms and costumes from spilling onto siblings', () => {
  const { targets } = buildCaughtRarityModel(catalog);
  const expected = new Map([
    ['0172-beanie_shiny', 'Beanie Pichu'],
    ['2238-shiny', 'Sensu Oricorio'],
    ['2056-shiny', 'Snowy Castform'],
    ['2131-shiny', 'Genesect (Shock Drive)'],
  ]);
  for (const [variantId, sourceName] of expected) {
    const target = targets.find((candidate) => candidate.variantId === variantId);
    assert.equal(target?.sourceName, sourceName, `${sourceName} should map only to ${variantId}`);
  }

  const incorrectSiblingIds = [
    '0025-shiny',
    '0026-shiny',
    '0741-shiny',
    '2236-shiny',
    '2237-shiny',
    '0351-shiny',
    '2055-shiny',
    '2057-shiny',
    '0649-shiny',
    '2128-shiny',
    '2129-shiny',
    '2130-shiny',
  ];
  for (const variantId of incorrectSiblingIds) {
    const target = targets.find((candidate) => candidate.variantId === variantId);
    assert.notEqual(target?.sourceName, 'Beanie Pichu');
    assert.notEqual(target?.sourceName, 'Sensu Oricorio');
    assert.notEqual(target?.sourceName, 'Snowy Castform');
    assert.notEqual(target?.sourceName, 'Genesect (Shock Drive)');
  }
});

test('does not spread named costume surveys onto ordinary evolution-family members', () => {
  const { targets } = buildCaughtRarityModel(catalog);
  const forbiddenSourcesByVariant = new Map([
    ['0025-shiny', 'Cherry Blossom Hat Pikachu'],
    ['0026-shiny', 'Cherry Blossom Hat Pikachu'],
    ['2013-shiny', 'Cherry Blossom Hat Pikachu'],
    ['0113-shiny', 'Flower Crown Happiny'],
    ['0242-shiny', 'Flower Crown Happiny'],
    ['0440-shiny', 'Flower Crown Happiny'],
    ['0125-shiny', "Spark's Elekid"],
    ['0239-shiny', "Spark's Elekid"],
    ['0466-shiny', "Spark's Elekid"],
  ]);
  for (const [variantId, sourceName] of forbiddenSourcesByVariant) {
    const target = targets.find((candidate) => candidate.variantId === variantId);
    assert.notEqual(target?.sourceName, sourceName, `${sourceName} must not map to ${variantId}`);
  }
});

test('never makes a shiny counterpart more common than its non-shiny equivalent', () => {
  const { targets } = buildCaughtRarityModel(catalog);
  const byId = new Map(targets.map((target) => [target.variantId, target]));
  for (const target of targets.filter((candidate) => candidate.shiny)) {
    const nonShinyId = target.variantId
      .replace('-shiny_', '-')
      .replace('_shiny', '_default')
      .replace('-shiny', '-default');
    const nonShiny = byId.get(nonShinyId);
    if (nonShiny) {
      assert.ok(
        target.targetOwners < nonShiny.targetOwners,
        `${target.variantId} (${target.targetOwners}) should be rarer than ${nonShinyId} (${nonShiny.targetOwners})`
      );
    }
  }
});

test('preserves empirical shiny ownership and raises underestimated non-shiny baselines', () => {
  const { targets } = buildCaughtRarityModel(catalog);
  const shiny = targets.find((target) => target.variantId === '0861-shiny_gigantamax');
  const regular = targets.find((target) => target.variantId === '0861-gigantamax');
  assert.equal(shiny?.sourceName, 'Gigantamax Grimmsnarl');
  assert.equal(shiny?.targetOwners, 294);
  assert.ok(regular.targetOwners > shiny.targetOwners);
});

test('keeps every released modeled variant above zero owners', () => {
  const { targets } = buildCaughtRarityModel(catalog);
  assert.ok(targets.length > 1000);
  assert.equal(targets.some((target) => target.targetOwners < 2), false);
});
