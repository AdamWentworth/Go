require('dotenv').config();

const fs = require('node:fs');
const mysql = require('mysql2/promise');
const { buildWantedDemandModel } = require('./fakePokemon/wantedDemandModel');
const { buildDemandRows, buildInsertSql } = require('./fakePokemon/wantedDemandSql');

const FAKE_USERNAME_PATTERN = /^fakeUser\d{4}$/;
const EXPECTED_FAKE_USERS = Number(process.env.EXPECTED_FAKE_USERS || 1000);
const CATALOG_PATH = process.env.POKEMON_CATALOG_PATH || '/tmp/pgn-pokemon-catalog.json';

function connectionConfig() {
  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOSTNAME,
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER,
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
    multipleStatements: true,
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

async function refreshRankings(connection) {
  await connection.query(`
DELETE FROM pokemon_variant_rankings;
INSERT INTO pokemon_variant_rankings (
  variant_id, wanted_user_count, most_wanted_user_count, caught_user_count, updated_at
)
SELECT
  variant_id,
  COUNT(DISTINCT CASE WHEN is_wanted = 1 AND LOWER(variant_id) NOT LIKE '%shadow%' THEN user_id END),
  COUNT(DISTINCT CASE WHEN is_wanted = 1 AND most_wanted = 1 AND LOWER(variant_id) NOT LIKE '%shadow%' THEN user_id END),
  COUNT(DISTINCT CASE WHEN is_caught = 1 OR registered = 1 THEN user_id END),
  UTC_TIMESTAMP(6)
FROM instances
WHERE variant_id IS NOT NULL AND variant_id <> '' AND disabled = 0
GROUP BY variant_id;

INSERT INTO pokemon_rankings_snapshot (
  snapshot_key, collector_user_count, wishlist_user_count, updated_at
)
SELECT
  1,
  COUNT(DISTINCT CASE WHEN (is_caught = 1 OR registered = 1) AND disabled = 0 THEN user_id END),
  COUNT(DISTINCT CASE WHEN is_wanted = 1 AND disabled = 0 AND LOWER(variant_id) NOT LIKE '%shadow%' THEN user_id END),
  UTC_TIMESTAMP(6)
FROM instances
ON DUPLICATE KEY UPDATE
  collector_user_count = VALUES(collector_user_count),
  wishlist_user_count = VALUES(wishlist_user_count),
  updated_at = VALUES(updated_at)`);
}

async function main() {
  const apply = process.argv.includes('--apply');
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
  const wantedDemandModel = buildWantedDemandModel(catalog);
  const connection = await mysql.createConnection(connectionConfig());
  try {
    const [fakeUsers] = await connection.query(
      `SELECT user_id, username FROM users WHERE username REGEXP '^fakeUser[0-9]{4}$' ORDER BY username`
    );
    if (fakeUsers.length !== EXPECTED_FAKE_USERS || fakeUsers.some((user) => !FAKE_USERNAME_PATTERN.test(user.username))) {
      throw new Error(`Safety check failed: expected exactly ${EXPECTED_FAKE_USERS} canonical fake users; found ${fakeUsers.length}`);
    }

    const rows = buildDemandRows(wantedDemandModel, fakeUsers);
    console.log(`${apply ? 'Applying' : 'Dry run:'} ${rows.length} deterministic wishlist rows for ${fakeUsers.length} fake users.`);
    console.table(wantedDemandModel.slice(0, 20).map(({ rank, label, wantedUsers, mostWantedUsers }) => ({
      rank, pokemon: label, wanted: wantedUsers, most_wanted: mostWantedUsers,
    })));
    if (!apply) {
      console.log('No database changes made. Re-run with --apply after reviewing the model.');
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
  AND i.is_wanted = 1
  AND i.is_caught = 0
  AND i.is_for_trade = 0;

UPDATE instances i
JOIN users u ON u.user_id = i.user_id
SET i.is_wanted = 0, i.most_wanted = 0
WHERE u.username REGEXP '^fakeUser[0-9]{4}$'
  AND (i.is_wanted = 1 OR i.most_wanted = 1);

DELETE i
FROM instances i
JOIN users u ON u.user_id = i.user_id
WHERE u.username REGEXP '^fakeUser[0-9]{4}$'
  AND i.instance_id LIKE 'fake-demand-v2-%'`);
      for (const sql of buildInsertSql(rows)) {
        await connection.query(sql);
      }
      await refreshRankings(connection);

      const after = await realDataFingerprint(connection);
      if (before.rowCount !== after.rowCount || before.checksum !== after.checksum) {
        throw new Error(`Real-user fingerprint changed (${JSON.stringify(before)} -> ${JSON.stringify(after)})`);
      }
      await connection.commit();
      console.log(`Committed fake-only demand reconciliation. Real-user fingerprint unchanged: ${JSON.stringify(after)}`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    const [top] = await connection.query(`
SELECT variant_id, wanted_user_count, most_wanted_user_count, caught_user_count
FROM pokemon_variant_rankings
ORDER BY wanted_user_count DESC, most_wanted_user_count DESC, caught_user_count ASC, variant_id
LIMIT 100`);
    const labels = new Map(wantedDemandModel.map((target) => [target.variantId, target.label]));
    top.forEach((row, index) => {
      console.log([
        String(index + 1).padStart(3),
        row.variant_id.padEnd(31),
        String(labels.get(row.variant_id) || '(existing real demand)').padEnd(38),
        `wanted=${row.wanted_user_count}`,
        `most=${row.most_wanted_user_count}`,
        `caught=${row.caught_user_count}`,
      ].join('  '));
    });
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`Fake demand reconciliation failed: ${error.message}`);
  process.exitCode = 1;
});
