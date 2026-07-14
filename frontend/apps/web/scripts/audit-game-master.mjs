#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const GAME_MASTER_URL =
  process.env.GAME_MASTER_URL ||
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/latest.json';
const GAME_MASTER_TIMESTAMP_URL =
  process.env.GAME_MASTER_TIMESTAMP_URL ||
  'https://raw.githubusercontent.com/PokeMiners/game_masters/master/latest/timestamp.txt';
const DEFAULT_API_ORIGINS = ['http://localhost:3000', 'https://pokegonexus.com'];
const API_ORIGINS = process.env.POKEGONEXUS_API_ORIGIN
  ? [process.env.POKEGONEXUS_API_ORIGIN]
  : DEFAULT_API_ORIGINS;
const REQUEST_TIMEOUT_MS = Number(process.env.GAME_MASTER_AUDIT_TIMEOUT_MS || 30_000);
const SAMPLE_LIMIT = Number(process.env.GAME_MASTER_AUDIT_SAMPLE_LIMIT || 30);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, '../../..');
const reportPath = path.join(frontendRoot, '.artifacts/audits/game-master-audit.json');

function normalizeKey(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/♀/g, ' female ')
    .replace(/♂/g, ' male ')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function normalizeDisplay(value) {
  return String(value ?? '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

function normalizeType(value) {
  return String(value ?? '')
    .replace(/^POKEMON_TYPE_/i, '')
    .trim()
    .toLowerCase();
}

function enumNameFromTemplateId(templateId) {
  const match = String(templateId ?? '').match(/^V\d+_POKEMON_(.+)$/);
  return match?.[1] ?? '';
}

function dexNumberFromTemplateId(templateId) {
  const match = String(templateId ?? '').match(/^V(\d+)_POKEMON_/);
  return match ? Number(match[1]) : undefined;
}

function normalizeForm(value, speciesEnum) {
  const normalizedSpecies = String(speciesEnum ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  let normalized = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (normalizedSpecies && normalized.startsWith(`${normalizedSpecies}_`)) {
    normalized = normalized.slice(normalizedSpecies.length + 1);
  }

  if (normalized === normalizedSpecies || normalized === 'normal' || normalized === 'default') {
    return '';
  }

  const formAliases = {
    alolan: 'alola',
    galarian: 'galar',
    hisuian: 'hisui',
    paldean: 'paldea',
  };

  return formAliases[normalized] ?? normalized;
}

function titleFromMoveToken(token) {
  const specialNames = {
    FUTURESIGHT: 'Future Sight',
    V_CREATE: 'V-create',
    LOCK_ON: 'Lock-On',
    X_SCISSOR: 'X-Scissor',
    TECHNO_BLAST_NORMAL: 'Techno Blast',
    TECHNO_BLAST_BURN: 'Techno Blast',
    TECHNO_BLAST_CHILL: 'Techno Blast',
    TECHNO_BLAST_SHOCK: 'Techno Blast',
    TECHNO_BLAST_WATER: 'Techno Blast',
    AURA_WHEEL_ELECTRIC: 'Aura Wheel',
    AURA_WHEEL_DARK: 'Aura Wheel',
  };

  return specialNames[token] ?? normalizeDisplay(token);
}

function moveTokenFromTemplateId(templateId) {
  const match = String(templateId ?? '').match(/^V\d+_MOVE_(.+)$/);
  if (!match) {
    return undefined;
  }

  const token = match[1];
  return token.endsWith('_FAST') ? token.slice(0, -5) : token;
}

function moveKeyFromToken(token) {
  let normalizedToken = String(token ?? '');
  if (normalizedToken.endsWith('_FAST')) {
    normalizedToken = normalizedToken.slice(0, -5);
  }
  if (normalizedToken.startsWith('TECHNO_BLAST_')) {
    normalizedToken = 'TECHNO_BLAST';
  }
  if (normalizedToken.startsWith('AURA_WHEEL_')) {
    normalizedToken = 'AURA_WHEEL';
  }

  return normalizeKey(normalizedToken);
}

function typedMoveKey(baseKey, type) {
  return `${baseKey}:${normalizeType(type)}`;
}

function gameMasterMoveLookup(gameMasterMoves) {
  const byToken = new Map();
  const byMovementId = new Map();
  const groupedByKey = new Map();

  for (const move of gameMasterMoves.values()) {
    byToken.set(move.token, move);
    if (move.movementId) {
      byMovementId.set(String(move.movementId), move);
    }
    if (!groupedByKey.has(move.nameKey)) {
      groupedByKey.set(move.nameKey, []);
    }
    groupedByKey.get(move.nameKey).push(move);
  }

  const uniqueByKey = new Map(
    [...groupedByKey.entries()]
      .filter(([, moves]) => moves.length === 1)
      .map(([key, moves]) => [key, moves[0]]),
  );

  return { byToken, byMovementId, uniqueByKey };
}

function poolMoveKeys(moveTokens, gameMasterMoves) {
  const { byToken, byMovementId, uniqueByKey } = gameMasterMoveLookup(gameMasterMoves);
  const keys = new Set();

  for (const rawToken of moveTokens ?? []) {
    const tokenText = String(rawToken ?? '');
    let move;

    if (/^\d+$/.test(tokenText)) {
      move = byMovementId.get(tokenText);
    } else {
      const token = tokenText.endsWith('_FAST') ? tokenText.slice(0, -5) : tokenText;
      move = byToken.get(token) ?? uniqueByKey.get(moveKeyFromToken(token));
    }

    if (move) {
      keys.add(move.key);
    }
  }

  return keys;
}

async function fetchText(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} while fetching ${url}`);
  }
  return response.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  return JSON.parse(text);
}

async function fetchPokemonData() {
  const errors = [];

  for (const origin of API_ORIGINS) {
    const normalizedOrigin = origin.replace(/\/+$/, '');
    const url = `${normalizedOrigin}/api/pokemon/pokemons`;

    try {
      const pokemon = await fetchJson(url);
      return { source: url, pokemon };
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Unable to fetch PokeGoNexus Pokemon data:\n${errors.join('\n')}`);
}

function extractGameMasterMoves(gameMaster) {
  const moves = new Map();

  for (const entry of gameMaster) {
    const token = moveTokenFromTemplateId(entry?.templateId);
    const settings = entry?.data?.moveSettings;
    if (!token || !settings) {
      continue;
    }

    const type = normalizeType(settings.pokemonType);
    const nameKey = moveKeyFromToken(token);
    const key = typedMoveKey(nameKey, type);
    moves.set(key, {
      key,
      nameKey,
      token,
      name: titleFromMoveToken(token),
      movementId: settings.movementId,
      templateId: entry.templateId,
      type,
      raid_power: Number(settings.power ?? 0),
      raid_energy: Number(settings.energyDelta ?? 0),
      raid_cooldown: Number(settings.durationMs ?? 0),
    });
  }

  return moves;
}

function extractGameMasterPokemonPools(gameMaster, gameMasterMoves) {
  const pools = new Map();

  for (const entry of gameMaster) {
    if (!/^V\d+_POKEMON_/.test(entry?.templateId ?? '')) {
      continue;
    }

    const settings = entry?.data?.pokemonSettings;
    if (!settings?.pokemonId) {
      continue;
    }

    const dexNumber = dexNumberFromTemplateId(entry.templateId);
    const speciesEnum = settings.pokemonId || enumNameFromTemplateId(entry.templateId);
    const form = normalizeForm(settings.form, speciesEnum);
    const key = `${dexNumber ?? settings.pokemonId}:${form}`;
    const quickMoves = poolMoveKeys(settings.quickMoves, gameMasterMoves);
    const cinematicMoves = poolMoveKeys(settings.cinematicMoves, gameMasterMoves);
    const eliteQuickMoves = poolMoveKeys(settings.eliteQuickMove, gameMasterMoves);
    const eliteCinematicMoves = poolMoveKeys(settings.eliteCinematicMove, gameMasterMoves);

    pools.set(key, {
      key,
      dexNumber,
      species: normalizeDisplay(settings.pokemonId),
      form,
      templateId: entry.templateId,
      currentMoves: new Set([...quickMoves, ...cinematicMoves]),
      eliteMoves: new Set([...eliteQuickMoves, ...eliteCinematicMoves]),
      quickMoves,
      cinematicMoves,
      eliteQuickMoves,
      eliteCinematicMoves,
    });
  }

  return pools;
}

function getLocalVariantPoolKey(pokemon) {
  const dexNumber = pokemon.pokedex_number ?? pokemon.pokemon_id;
  const form = normalizeForm(pokemon.form, pokemon.name);
  return `${dexNumber}:${form}`;
}

function getLocalMoveType(move) {
  return normalizeType(move.type_name || move.type);
}

function getLocalMoveKey(move) {
  return typedMoveKey(normalizeKey(move.name), getLocalMoveType(move));
}

function addLocalMove(localMoves, move, pokemonName) {
  const key = getLocalMoveKey(move);
  if (!key) {
    return;
  }

  if (!localMoves.has(key)) {
    localMoves.set(key, {
      key,
      nameKey: normalizeKey(move.name),
      name: move.name,
      type: getLocalMoveType(move),
      raid_power: Number(move.raid_power ?? 0),
      raid_energy: Number(move.raid_energy ?? 0),
      raid_cooldown: Number(move.raid_cooldown ?? 0),
      appearances: new Set(),
      statVariants: new Set(),
    });
  }

  const localMove = localMoves.get(key);
  localMove.appearances.add(pokemonName);
  localMove.statVariants.add(
    JSON.stringify({
      type: getLocalMoveType(move),
      raid_power: Number(move.raid_power ?? 0),
      raid_energy: Number(move.raid_energy ?? 0),
      raid_cooldown: Number(move.raid_cooldown ?? 0),
    }),
  );
}

function extractLocalData(pokemonRows) {
  const localMoves = new Map();
  const localPools = new Map();

  for (const pokemon of pokemonRows) {
    const moves = Array.isArray(pokemon.moves) ? pokemon.moves : [];
    const poolKey = getLocalVariantPoolKey(pokemon);

    if (!localPools.has(poolKey)) {
      localPools.set(poolKey, {
        key: poolKey,
        dexNumber: pokemon.pokedex_number ?? pokemon.pokemon_id,
        name: pokemon.name,
        form: pokemon.form ?? '',
        currentMoves: new Set(),
        legacyMoves: new Set(),
        allMoves: new Set(),
      });
    }

    const pool = localPools.get(poolKey);
    for (const move of moves) {
      const key = getLocalMoveKey(move);
      if (!key) {
        continue;
      }

      addLocalMove(localMoves, move, pokemon.name);

      if (move.fusion_id || move.fusionId || move.fusion) {
        continue;
      }

      pool.allMoves.add(key);
      if (move.legacy) {
        pool.legacyMoves.add(key);
      } else {
        pool.currentMoves.add(key);
      }
    }
  }

  return { localMoves, localPools };
}

function compareMoveStats(localMoves, gameMasterMoves) {
  const statMismatches = [];
  const missingInGameMaster = [];
  const duplicateLocalStats = [];

  for (const localMove of localMoves.values()) {
    const gameMasterMove = gameMasterMoves.get(localMove.key);
    if (!gameMasterMove) {
      missingInGameMaster.push({
        name: localMove.name,
        appearances: [...localMove.appearances].slice(0, 5),
      });
      continue;
    }

    if (localMove.statVariants.size > 1) {
      duplicateLocalStats.push({
        name: localMove.name,
        variants: [...localMove.statVariants].map((variant) => JSON.parse(variant)),
      });
    }

    const fields = ['type', 'raid_power', 'raid_energy', 'raid_cooldown'];
    const differences = {};
    for (const field of fields) {
      if (localMove[field] !== gameMasterMove[field]) {
        differences[field] = {
          local: localMove[field],
          gameMaster: gameMasterMove[field],
        };
      }
    }

    if (Object.keys(differences).length > 0) {
      statMismatches.push({
        name: localMove.name,
        movementId: gameMasterMove.movementId,
        differences,
        appearances: [...localMove.appearances].slice(0, 8),
      });
    }
  }

  statMismatches.sort((a, b) => a.name.localeCompare(b.name));
  missingInGameMaster.sort((a, b) => a.name.localeCompare(b.name));
  duplicateLocalStats.sort((a, b) => a.name.localeCompare(b.name));

  return { statMismatches, missingInGameMaster, duplicateLocalStats };
}

function compareMovePools(localPools, gameMasterPools, gameMasterMoves) {
  const poolMismatches = [];
  const unmappedLocalPools = [];

  for (const localPool of localPools.values()) {
    const gameMasterPool = gameMasterPools.get(localPool.key);
    if (!gameMasterPool) {
      unmappedLocalPools.push({
        name: localPool.name,
        dexNumber: localPool.dexNumber,
        form: localPool.form,
        key: localPool.key,
      });
      continue;
    }

    const missingCurrent = [...gameMasterPool.currentMoves].filter(
      (move) => !localPool.currentMoves.has(move) && !localPool.legacyMoves.has(move),
    );
    const extraCurrent = [...localPool.currentMoves].filter(
      (move) => !gameMasterPool.currentMoves.has(move) && !gameMasterPool.eliteMoves.has(move),
    );

    if (missingCurrent.length || extraCurrent.length) {
      poolMismatches.push({
        name: localPool.name,
        dexNumber: localPool.dexNumber,
        form: localPool.form,
        key: localPool.key,
        missingCurrent: missingCurrent.map((key) => gameMasterMoves.get(key)?.name ?? key),
        extraCurrent: extraCurrent.map((key) => gameMasterMoves.get(key)?.name ?? key),
      });
    }
  }

  poolMismatches.sort((a, b) => a.dexNumber - b.dexNumber || String(a.form).localeCompare(String(b.form)));
  unmappedLocalPools.sort((a, b) => a.dexNumber - b.dexNumber || String(a.form).localeCompare(String(b.form)));

  return { poolMismatches, unmappedLocalPools };
}

function formatTimestamp(timestampText) {
  const timestamp = Number(timestampText.trim());
  if (!Number.isFinite(timestamp)) {
    return timestampText.trim();
  }

  return `${new Date(timestamp).toISOString()} (${timestamp})`;
}

function printTable(title, rows, columns) {
  console.log(`\n${title}`);
  if (!rows.length) {
    console.log('  none');
    return;
  }

  console.table(rows.slice(0, SAMPLE_LIMIT), columns);
  if (rows.length > SAMPLE_LIMIT) {
    console.log(`  ... ${rows.length - SAMPLE_LIMIT} more in ${path.relative(process.cwd(), reportPath)}`);
  }
}

function summarizeMoveStatMismatch(mismatch) {
  return {
    move: mismatch.name,
    differences: Object.entries(mismatch.differences)
      .map(([field, values]) => `${field}: ${values.local} -> ${values.gameMaster}`)
      .join(', '),
    seenOn: mismatch.appearances.join(', '),
  };
}

function summarizePoolMismatch(mismatch) {
  return {
    pokemon: `${mismatch.dexNumber} ${mismatch.name}${mismatch.form ? ` (${mismatch.form})` : ''}`,
    missingCurrent: mismatch.missingCurrent.join(', '),
    extraCurrent: mismatch.extraCurrent.join(', '),
  };
}

async function main() {
  console.log('Auditing PokeGoNexus move data against current PokeMiners Game Master...');

  const [gameMaster, timestampText, localData] = await Promise.all([
    fetchJson(GAME_MASTER_URL),
    fetchText(GAME_MASTER_TIMESTAMP_URL),
    fetchPokemonData(),
  ]);

  const gameMasterMoves = extractGameMasterMoves(gameMaster);
  const gameMasterPools = extractGameMasterPokemonPools(gameMaster, gameMasterMoves);
  const { localMoves, localPools } = extractLocalData(localData.pokemon);
  const moveStats = compareMoveStats(localMoves, gameMasterMoves);
  const movePools = compareMovePools(localPools, gameMasterPools, gameMasterMoves);

  const report = {
    auditedAt: new Date().toISOString(),
    gameMaster: {
      source: GAME_MASTER_URL,
      timestamp: formatTimestamp(timestampText),
      moveCount: gameMasterMoves.size,
      pokemonPoolCount: gameMasterPools.size,
    },
    local: {
      source: localData.source,
      pokemonRows: localData.pokemon.length,
      moveCount: localMoves.size,
      pokemonPoolCount: localPools.size,
    },
    moveStats,
    movePools,
  };

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`\nGame Master: ${GAME_MASTER_URL}`);
  console.log(`Game Master timestamp: ${report.gameMaster.timestamp}`);
  console.log(`PokeGoNexus data: ${localData.source}`);
  console.log(`Report: ${reportPath}`);
  console.log('\nSummary');
  console.log(`  Local unique moves: ${localMoves.size}`);
  console.log(`  Game Master raid moves: ${gameMasterMoves.size}`);
  console.log(`  Move stat mismatches: ${moveStats.statMismatches.length}`);
  console.log(`  Local moves missing from Game Master: ${moveStats.missingInGameMaster.length}`);
  console.log(`  Local moves with inconsistent duplicated stats: ${moveStats.duplicateLocalStats.length}`);
  console.log(`  Current move pool mismatches: ${movePools.poolMismatches.length}`);
  console.log(`  Unmapped local Pokemon/form pools: ${movePools.unmappedLocalPools.length}`);

  printTable(
    'Move stat drift',
    moveStats.statMismatches.map(summarizeMoveStatMismatch),
    ['move', 'differences', 'seenOn'],
  );
  printTable(
    'Current move pool drift',
    movePools.poolMismatches.map(summarizePoolMismatch),
    ['pokemon', 'missingCurrent', 'extraCurrent'],
  );
  printTable(
    'Unmapped local Pokemon/form pools',
    movePools.unmappedLocalPools.map((pool) => ({
      pokemon: `${pool.dexNumber} ${pool.name}${pool.form ? ` (${pool.form})` : ''}`,
      key: pool.key,
    })),
    ['pokemon', 'key'],
  );

  if (process.argv.includes('--fail-on-drift')) {
    const driftCount =
      moveStats.statMismatches.length +
      moveStats.duplicateLocalStats.length +
      movePools.poolMismatches.length;
    if (driftCount > 0) {
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
