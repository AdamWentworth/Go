const fs = require('node:fs');
const path = require('node:path');

const { buildCaughtRarityModel } = require('./fakePokemon/caughtRarityModel');

function main() {
  const catalogPath = process.env.POKEMON_CATALOG_PATH || '/tmp/pgn-pokemon-catalog.json';
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const { targets, unmatched, ignoredZeroes, sourceRows } = buildCaughtRarityModel(catalog);

  console.log(`Rarity source: ${sourceRows} rows (${ignoredZeroes.length} zeroes treated as unknown).`);
  console.log(`${targets.filter((target) => target.source === 'survey').length} nonzero survey rows mapped to catalog variants.`);
  console.log(`${unmatched.length} nonzero survey rows remain unmatched and use no empirical override.`);
  console.log('');
  console.log('PROPOSED RAREST TOP 100 (dry run; no database changes)');
  targets.slice(0, 100).forEach((target, index) => {
    const evidence = target.source === 'survey'
      ? `survey=${target.sourcePercent.toFixed(3)}% (${target.sourceName})`
      : target.source === 'survey-zero-unknown'
        ? `survey zero treated unknown (${target.sourceName})`
        : `modeled=${target.kind}`;
    console.log(
      `${String(index + 1).padStart(3)}  ${target.variantId.padEnd(34)}  ` +
      `${target.label.padEnd(48).slice(0, 48)}  owners=${String(target.targetOwners).padStart(3)}  ${evidence}`
    );
  });

  if (unmatched.length > 0) {
    console.log('');
    console.log('UNMATCHED NONZERO SOURCE ROWS (first 50)');
    unmatched.slice(0, 50).forEach((entry) => {
      console.log(`${String(entry.sourceRow).padStart(4)}  ${entry.dexRange.padEnd(8)}  ${entry.name} (${entry.percent}%)`);
    });
  }
}

main();
