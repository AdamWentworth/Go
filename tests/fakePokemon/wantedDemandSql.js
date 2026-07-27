const crypto = require('node:crypto');

const sqlString = (value) => {
  if (value == null) return 'NULL';
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "''")}'`;
};

function demandInstanceId(variantId, userId) {
  return `fake-demand-v2-${crypto.createHash('sha256').update(`${variantId}:${userId}`).digest('hex').slice(0, 32)}`;
}

function buildDemandRows(targets, fakeUsers) {
  return targets.flatMap((target) => {
    const ordered = [...fakeUsers].sort((left, right) => {
      const leftHash = crypto.createHash('sha256').update(`${target.variantId}:${left.user_id}`).digest('hex');
      const rightHash = crypto.createHash('sha256').update(`${target.variantId}:${right.user_id}`).digest('hex');
      return leftHash.localeCompare(rightHash);
    });
    return ordered.slice(0, target.wantedUsers).map((user, index) => ({
      ...target,
      userId: user.user_id,
      instanceId: demandInstanceId(target.variantId, user.user_id),
      mostWanted: index < target.mostWantedUsers,
    }));
  });
}

function buildInsertSql(rows) {
  if (rows.length === 0) return [];
  const columns = [
    'instance_id', 'user_id', 'variant_id', 'pokemon_id', 'shiny', 'costume_id',
    'lucky', 'shadow', 'purified', 'location_card', 'charged_move1_id',
    'is_caught', 'is_for_trade', 'is_wanted', 'most_wanted', 'registered',
    'favorite', 'mirror', 'pref_lucky', 'mega', 'mega_form', 'is_mega',
    'is_fused', 'fusion', 'fusion_form', 'dynamax', 'gigantamax', 'crown',
    'caught_tags', 'trade_tags', 'wanted_tags', 'not_trade_list',
    'not_wanted_list', 'wanted_filters', 'date_added', 'last_update',
  ];
  const batches = [];
  for (let offset = 0; offset < rows.length; offset += 500) {
    const values = rows.slice(offset, offset + 500).map((row) => `(
${[
  row.instanceId, row.userId, row.variantId, row.pokemonId, row.shiny ? 1 : 0,
  row.costumeId, 0, 0, 0, row.locationCard, row.chargedMove1Id,
  0, 0, 1, row.mostWanted ? 1 : 0, 0, 0, 0, 0,
  row.mega ? 1 : 0, row.megaForm, row.isMega ? 1 : 0, row.isFused ? 1 : 0,
  JSON.stringify(row.fusion), row.fusionForm, row.dynamax ? 1 : 0,
  row.gigantamax ? 1 : 0, row.crown ? 1 : 0,
  '[]', '[]', '[]', '{}', '{}', JSON.stringify(row.wantedFilters),
].map(sqlString).join(', ')},
UTC_TIMESTAMP(6), UNIX_TIMESTAMP(UTC_TIMESTAMP(6)) * 1000
)`);
    batches.push(`INSERT INTO instances (${columns.join(', ')}) VALUES\n${values.join(',\n')};`);
  }
  return batches;
}

module.exports = { buildDemandRows, buildInsertSql, demandInstanceId };
