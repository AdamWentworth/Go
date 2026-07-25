import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(scriptDirectory, '../../..');
const outputPath = path.resolve(process.cwd(), process.argv[2] ?? '.artifacts/frontend-runtime-audit/package.json');

const [workspacePackage, webPackage] = await Promise.all([
  readFile(path.join(workspaceRoot, 'package.json'), 'utf8').then(JSON.parse),
  readFile(path.join(workspaceRoot, 'apps/web/package.json'), 'utf8').then(JSON.parse),
]);

const manifest = {
  name: 'pokego-nexus-web-runtime-audit',
  version: webPackage.version,
  private: true,
  dependencies: webPackage.dependencies ?? {},
  optionalDependencies: webPackage.optionalDependencies ?? {},
  overrides: workspacePackage.overrides ?? {},
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
