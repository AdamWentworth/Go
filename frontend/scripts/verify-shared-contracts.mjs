import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..', '..');
const sharedContractsRoot = path.join(repoRoot, 'packages', 'shared-contracts', 'src');
const frontendRoot = path.join(repoRoot, 'frontend');

const requiredSharedFiles = [
  'index.ts',
  'users.ts',
  'search.ts',
  'common.ts',
  'domain.ts',
  'auth.ts',
  'trades.ts',
  'location.ts',
  'events.ts',
  'pokemon.ts',
];

const missingSharedFiles = requiredSharedFiles.filter(
  (file) => !fs.existsSync(path.join(sharedContractsRoot, file)),
);

if (!fs.existsSync(sharedContractsRoot) || missingSharedFiles.length > 0) {
  const lines = [
    '[verify-shared-contracts] shared-contracts package is missing required files.',
    `[verify-shared-contracts] expected root: ${sharedContractsRoot}`,
  ];
  if (missingSharedFiles.length > 0) {
    lines.push(
      `[verify-shared-contracts] missing files: ${missingSharedFiles.join(', ')}`,
    );
  }
  lines.push(
    '[verify-shared-contracts] ensure CI/build context includes repo-level packages/shared-contracts.',
  );
  throw new Error(lines.join('\n'));
}

const tsconfigPath = path.join(frontendRoot, 'tsconfig.json');
const viteConfigPath = path.join(frontendRoot, 'vite.config.mjs');

const tsconfigRaw = fs.readFileSync(tsconfigPath, 'utf8');
const stripJsonCommentsAndTrailingCommas = (input) =>
  input
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,\s*([}\]])/g, '$1');

const tsconfig = JSON.parse(stripJsonCommentsAndTrailingCommas(tsconfigRaw));
const tsPaths = tsconfig?.compilerOptions?.paths ?? {};
if (!('@shared-contracts/*' in tsPaths)) {
  throw new Error(
    '[verify-shared-contracts] tsconfig missing "@shared-contracts/*" path alias.',
  );
}

const viteConfigRaw = fs.readFileSync(viteConfigPath, 'utf8');
if (!viteConfigRaw.includes("'@shared-contracts'") && !viteConfigRaw.includes('"@shared-contracts"')) {
  throw new Error(
    '[verify-shared-contracts] vite config missing "@shared-contracts" alias.',
  );
}

console.log('[verify-shared-contracts] OK');
