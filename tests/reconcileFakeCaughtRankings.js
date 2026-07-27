require('dotenv').config();

const fs = require('node:fs');
const mysql = require('mysql2/promise');

const { buildCaughtRarityModel } = require('./fakePokemon/caughtRarityModel');
const {
  buildCaughtRows,
  rankingRefreshStatements,
} = require('./fakePokemon/caughtRaritySql');

const FAKE_USERNAME_PATTERN = /^fakeUser\d{4}$/;
const EXPECTED_FAKE_USERS = Number(process.env.EXPECTED_FAKE_USERS || 1000);
const CATALOG_PATH = process.env.POKEMON_CATALOG_PATH || '/tmp/pgn-pokemon-catalog.json';

const columns = [
  'instance_id', 'user_id', 'variant_id', 'pokemon_id', 'shiny', 'costume_id',
  'lucky', 'shadow', 'purified', 'is_caught', 'is_for_trade', 'is_wanted',
  'most_wanted', 'registered', 'favorite', 'mirror', 'pref_lucky', 'mega',
  'is_mega', 'is_fused', 'fusion', 'dynamax', 'gigantamax', 'crown',
  'caught_tags', 'trade_tags', 'wanted_tags', 'not_trade_list',
  'not_wanted_list', 'wanted_filters', 'date_added', 'last_update',
];

function connectionConfig() {
  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOSTNAME,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
  };
}

async function realDataFingerprint(connection) {
  const [rows] = await connection.query(`
SELECT
  COUNT(*) AS row_count,
  COALESCE(SUM(CRC32(CONCAT_WS('|',
    i.instance_id, i.user_id, COALESCE(i.variant_id, ''), i.is_wanted,
    i.most_wanted, i.is_caught, i.is_for_trade, i.last_update
  ))), 0) AS checksum
FROM instances i
JOIN users u ON u.user_id = i.user_id
WHERE u.username NOT REGEXP '^fakeUser[0-9]{4}$'`);
  return { rowCount: String(rows[0].row_count), checksum: String(rows[0].checksum) };
}

async function currentCounts(connection) {
  const [tradeRows] = await connection.query(`
SELECT i.variant_id, COUNT(DISTINCT i.user_id) AS owners
FROM instances i
JOIN users u ON u.user_id = i.user_id
WHERE u.username REGEXP '^fakeUser[0-9]{4}$'
  AND i.is_for_trade = 1
  AND i.disabled = 0
GROUP BY i.variant_id`);
  const [realRows] = await connection.query(`
SELECT i.variant_id, COUNT(DISTINCT i.user_id) AS owners
FROM instances i
JOIN users u ON u.user_id = i.user_id
WHERE u.username NOT REGEXP '^fakeUser[0-9]{4}$'
  AND i.is_caught = 1
  AND i.disabled = 0
GROUP BY i.variant_id`);
  return {
    fakeTrade: new Map(tradeRows.map((row) => [row.variant_id, Number(row.owners)])),
    realCaught: new Map(realRows.map((row) => [row.variant_id, Number(row.owners)])),
  };
}

function valuesFor(row) {
  return [
    row.instanceId, row.userId, row.variantId, row.pokemonId, row.shiny ? 1 : 0,
    row.costumeId || null, 0, row.shadow ? 1 : 0, 0, 1, row.forTrade ? 1 : 0,
    0, 0, 1, 0, 0, 0, 0, 0, 0, '{}', row.dynamax ? 1 : 0,
    row.gigantamax ? 1 : 0, 0, '[]', '[]', '[]', '{}', '{}', '{}',
    new Date(), Date.now(),
  ];
}

async function insertRows(connection, rows) {
  for (let offset = 0; offset < rows.length; offset += 500) {
    const batch = rows.slice(offset, offset + 500);
    const placeholders = batch.map(() => `(${columns.map(() => '?').join(',')})`).join(',');
    await connection.query(
      `INSERT INTO instances (${columns.join(',')}) VALUES ${placeholders}`,
      batch.flatMap(valuesFor)
    );
    if (offset > 0 && offset % 50000 === 0) {
      console.log(`Inserted ${offset.toLocaleString()} / ${rows.length.toLocaleString()} fake caught rows...`);
    }
  }
}

async function refreshRankings(connection) {
  for (const statement of rankingRefreshStatements()) {
    await connection.query(statement);
  }
}

function printProjectedTop(targets, realCaught) {
  console.log('PROJECTED RAREST TOP 100 (fake ownership + current real ownership)');
  [...targets]
    .map((target) => ({
      ...target,
      realOwners: realCaught.get(target.variantId) || 0,
      totalOwners: target.targetOwners + (realCaught.get(target.variantId) || 0),
    }))
    .sort((left, right) => (
      left.totalOwners - right.totalOwners ||
      Number(right.shiny) - Number(left.shiny) ||
      left.variantId.localeCompare(right.variantId)
    ))
    .slice(0, 100)
    .forEach((target, index) => {
      const evidence = target.source === 'survey'
        ? `survey ${target.sourcePercent.toFixed(3)}%`
        : target.source === 'survey-zero-unknown'
          ? 'survey zero -> conservative estimate'
          : `modeled ${target.kind}`;
      console.log(
        `${String(index + 1).padStart(3)}  ${target.variantId.padEnd(34)}  ` +
        `${target.label.padEnd(45).slice(0, 45)} total=${String(target.totalOwners).padStart(3)} ` +
        `(fake=${target.targetOwners}, real=${target.realOwners})  ${evidence}`
      );
    });
}

async function main() {
  const apply = process.argv.includes('--apply');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const { targets, unmatched, ignoredZeroes } = buildCaughtRarityModel(catalog);
  const connection = await mysql.createConnection(connectionConfig());
  try {
    const [fakeUsers] = await connection.query(
      `SELECT user_id, username FROM users WHERE username REGEXP '^fakeUser[0-9]{4}$' ORDER BY username`
    );
    if (fakeUsers.length !== EXPECTED_FAKE_USERS || fakeUsers.some((user) => !FAKE_USERNAME_PATTERN.test(user.username))) {
      throw new Error(`Safety check failed: expected ${EXPECTED_FAKE_USERS} canonical fake users; found ${fakeUsers.length}`);
    }
    const counts = await currentCounts(connection);
    const rowCount = targets.reduce((sum, target) => sum + target.targetOwners, 0);
    console.log(`${apply ? 'Applying' : 'Dry run:'} ${rowCount.toLocaleString()} deterministic fake ownership rows.`);
    console.log(`${ignoredZeroes.length} source zeroes treated as unknown; ${unmatched.length} nonzero rows unmatched.`);
    printProjectedTop(targets, counts.realCaught);
    if (!apply) {
      console.log('No database changes made. --apply is intentionally gated on review.');
      return;
    }

    const before = await realDataFingerprint(connection);
    await connection.beginTransaction();
    try {
      await connection.query(`
DELETE i
FROM instances i
JOIN users u ON u.user_id = i.user_id
WHERE u.username REGEXP '^fakeUser[0-9]{4}$'
  AND (i.is_caught = 1 OR i.is_for_trade = 1 OR i.instance_id LIKE 'fake-caught-v2-%')`);
      let inserted = 0;
      for (const target of targets) {
        const rows = buildCaughtRows([target], fakeUsers, counts.fakeTrade);
        await insertRows(connection, rows);
        inserted += rows.length;
        if (inserted > 0 && inserted % 50000 < rows.length) {
          console.log(`Inserted ${inserted.toLocaleString()} / ${rowCount.toLocaleString()} fake caught rows...`);
        }
      }
      await refreshRankings(connection);
      const after = await realDataFingerprint(connection);
      if (before.rowCount !== after.rowCount || before.checksum !== after.checksum) {
        throw new Error(`Real-user fingerprint changed (${JSON.stringify(before)} -> ${JSON.stringify(after)})`);
      }
      await connection.commit();
      console.log(`Committed fake-only caught reconciliation. Real-user fingerprint unchanged: ${JSON.stringify(after)}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Fake caught reconciliation failed: ${error.message}`);
  process.exitCode = 1;
});
