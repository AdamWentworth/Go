const crypto = require('node:crypto');

function caughtInstanceId(variantId, userId) {
  return `fake-caught-v2-${crypto.createHash('sha256').update(`${variantId}:${userId}`).digest('hex').slice(0, 32)}`;
}

function deterministicUsers(target, fakeUsers) {
  return [...fakeUsers].sort((left, right) => {
    const leftHash = crypto.createHash('sha256').update(`${target.variantId}:${left.user_id}`).digest('hex');
    const rightHash = crypto.createHash('sha256').update(`${target.variantId}:${right.user_id}`).digest('hex');
    return leftHash.localeCompare(rightHash);
  });
}

function buildCaughtRows(targets, fakeUsers, existingTradeCounts = new Map()) {
  return targets.flatMap((target) => {
    const tradeCount = Math.min(
      Number(existingTradeCounts.get(target.variantId) || 0),
      target.targetOwners
    );
    return deterministicUsers(target, fakeUsers)
      .slice(0, target.targetOwners)
      .map((user, index) => ({
        ...target,
        userId: user.user_id,
        instanceId: caughtInstanceId(target.variantId, user.user_id),
        forTrade: index < tradeCount,
      }));
  });
}

function rankingRefreshStatements() {
  return [
    'DELETE FROM pokemon_variant_rankings',
    `INSERT INTO pokemon_variant_rankings (
  variant_id, wanted_user_count, most_wanted_user_count, caught_user_count, updated_at
)
SELECT
  variant_id,
  COUNT(DISTINCT CASE WHEN is_wanted = 1 THEN user_id END),
  COUNT(DISTINCT CASE WHEN is_wanted = 1 AND most_wanted = 1 THEN user_id END),
  COUNT(DISTINCT CASE WHEN is_caught = 1 OR registered = 1 THEN user_id END),
  UTC_TIMESTAMP(6)
FROM instances
WHERE variant_id IS NOT NULL AND variant_id <> '' AND disabled = 0
GROUP BY variant_id`,
  ];
}

module.exports = {
  buildCaughtRows,
  caughtInstanceId,
  deterministicUsers,
  rankingRefreshStatements,
};
