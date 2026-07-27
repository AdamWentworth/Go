const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCaughtRows,
  caughtInstanceId,
  rankingRefreshStatements,
} = require('./caughtRaritySql');

const users = Array.from({ length: 20 }, (_, index) => ({
  user_id: `fake-${index}`,
  username: `fakeUser${String(index).padStart(4, '0')}`,
}));

test('assigns deterministic unique ownership rows', () => {
  const target = { variantId: '0001-shiny', targetOwners: 7 };
  const rowsA = buildCaughtRows([target], users);
  const rowsB = buildCaughtRows([target], [...users].reverse());
  assert.deepEqual(rowsA, rowsB);
  assert.equal(rowsA.length, 7);
  assert.equal(new Set(rowsA.map((row) => row.instanceId)).size, 7);
  assert.equal(rowsA[0].instanceId, caughtInstanceId(target.variantId, rowsA[0].userId));
});

test('preserves existing fake trade volume only as a subset of caught owners', () => {
  const target = { variantId: '0001-shiny', targetOwners: 7 };
  const rows = buildCaughtRows([target], users, new Map([[target.variantId, 20]]));
  assert.equal(rows.filter((row) => row.forTrade).length, 7);
  assert.equal(rows.every((row) => row.forTrade && row.targetOwners === 7), true);
});

test('refreshes rankings with individual statements compatible with production MySQL', () => {
  const statements = rankingRefreshStatements();
  assert.equal(statements.length, 2);
  assert.match(statements[0], /^DELETE FROM pokemon_variant_rankings$/);
  assert.match(statements[1], /^INSERT INTO pokemon_variant_rankings/);
  assert.equal(statements.some((statement) => statement.includes(';')), false);
});
