import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const PROJECT_ROOT = process.cwd();
const UNIT_ROOT = path.join(PROJECT_ROOT, 'tests', 'unit');
const BATCH_SIZE = Number.parseInt(process.env.VITEST_BATCH_SIZE ?? '20', 10);

function isTestFile(name) {
  return (
    name.includes('.test.') ||
    name.includes('.spec.')
  );
}

function walk(dir, out) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, out);
      continue;
    }
    if (!entry.isFile() || !isTestFile(entry.name)) {
      continue;
    }
    out.push(path.relative(PROJECT_ROOT, fullPath));
  }
}

if (!statSync(UNIT_ROOT).isDirectory()) {
  console.error(`Unit test directory not found: ${UNIT_ROOT}`);
  process.exit(1);
}

const files = [];
walk(UNIT_ROOT, files);
files.sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.log('No unit test files found under tests/unit.');
  process.exit(0);
}

const chunks = [];
for (let i = 0; i < files.length; i += BATCH_SIZE) {
  chunks.push(files.slice(i, i + BATCH_SIZE));
}

const nodeCmd = process.execPath;
const vitestEntry = path.join(
  PROJECT_ROOT,
  'node_modules',
  'vitest',
  'vitest.mjs',
);

for (let i = 0; i < chunks.length; i += 1) {
  const chunk = chunks[i];
  console.log(
    `\n[unit-batch] ${i + 1}/${chunks.length} (${chunk.length} files)`,
  );
  const result = spawnSync(
    nodeCmd,
    [vitestEntry, 'run', ...chunk],
    {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: process.env,
    },
  );
  if (result.error) {
    console.error(`[unit-batch] spawn error: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('\n[unit-batch] all batches passed');
