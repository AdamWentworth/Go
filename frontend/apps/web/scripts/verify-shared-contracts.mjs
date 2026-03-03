import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRoot = path.resolve(__dirname, '..', '..', '..');
const webRoot = path.resolve(__dirname, '..');
const sharedContractsRoot = path.join(frontendRoot, 'packages', 'shared-contracts', 'src');
const appCoreRoot = path.join(frontendRoot, 'packages', 'app-core');
const appCoreSrcRoot = path.join(appCoreRoot, 'src');
const appCoreTestsRoot = path.join(appCoreRoot, 'tests');

const requiredSharedFiles = [
  'index.ts',
  'users.ts',
  'instances.ts',
  'search.ts',
  'common.ts',
  'domain.ts',
  'auth.ts',
  'trades.ts',
  'location.ts',
  'events.ts',
  'pokemon.ts',
  'receiver.ts',
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
    '[verify-shared-contracts] ensure CI/build context includes frontend/packages/shared-contracts.',
  );
  throw new Error(lines.join('\n'));
}

if (!fs.existsSync(appCoreSrcRoot) || !fs.existsSync(appCoreTestsRoot)) {
  throw new Error(
    [
      '[verify-shared-contracts] app-core package is missing required source/test roots.',
      `[verify-shared-contracts] expected source root: ${appCoreSrcRoot}`,
      `[verify-shared-contracts] expected test root: ${appCoreTestsRoot}`,
    ].join('\n'),
  );
}

const tsconfigPath = path.join(webRoot, 'tsconfig.json');
const viteConfigPath = path.join(webRoot, 'vite.config.mjs');

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
