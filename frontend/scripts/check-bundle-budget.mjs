import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const distDir = path.resolve(process.cwd(), 'dist');
const manifestPath = path.join(distDir, '.vite', 'manifest.json');

const parseKbBudget = (raw, fallbackKb) => {
  const value = Number.parseFloat(raw ?? '');
  return Number.isFinite(value) && value > 0 ? value : fallbackKb;
};

const initialJsBudgetKb = parseKbBudget(process.env.FRONTEND_INITIAL_JS_GZIP_BUDGET_KB, 180);
const maxChunkBudgetKb = parseKbBudget(process.env.FRONTEND_MAX_JS_CHUNK_GZIP_KB, 130);
const reportPath = process.env.FRONTEND_BUNDLE_BUDGET_REPORT_PATH;

if (!fs.existsSync(manifestPath)) {
  console.error(`Bundle manifest not found: ${manifestPath}`);
  console.error('Run "vite build --manifest" (or standard "vite build") before budget checks.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const gzipBytes = (filePath) => gzipSync(fs.readFileSync(filePath)).length;
const toKb = (bytes) => (bytes / 1024).toFixed(2);

const collectImportGraph = (key, visited) => {
  if (!manifest[key] || visited.has(key)) {
    return;
  }
  visited.add(key);
  for (const importedKey of manifest[key].imports ?? []) {
    collectImportGraph(importedKey, visited);
  }
};

const indexKey = 'index.html';
if (!manifest[indexKey]) {
  console.error('Manifest does not contain "index.html" entry.');
  process.exit(1);
}

const startupGraph = new Set();
collectImportGraph(indexKey, startupGraph);

const startupJs = [...startupGraph]
  .map((key) => manifest[key]?.file)
  .filter((file) => typeof file === 'string' && file.endsWith('.js'))
  .map((file) => {
    const filePath = path.join(distDir, file);
    return {
      file,
      gzip: gzipBytes(filePath)
    };
  });

const startupTotalGzip = startupJs.reduce((sum, item) => sum + item.gzip, 0);
const startupBudgetBytes = Math.round(initialJsBudgetKb * 1024);

const allJsFiles = [...new Set(
  Object.values(manifest)
    .map((entry) => entry?.file)
    .filter((file) => typeof file === 'string' && file.endsWith('.js'))
)];

const allJsChunks = allJsFiles.map((file) => {
  const filePath = path.join(distDir, file);
  return {
    file,
    gzip: gzipBytes(filePath)
  };
});

allJsChunks.sort((a, b) => b.gzip - a.gzip);

const maxChunkBudgetBytes = Math.round(maxChunkBudgetKb * 1024);
const oversizedChunks = allJsChunks.filter((item) => item.gzip > maxChunkBudgetBytes);

console.log(`Startup JS gzip total: ${toKb(startupTotalGzip)} kB (budget ${initialJsBudgetKb.toFixed(2)} kB)`);
for (const item of startupJs.sort((a, b) => b.gzip - a.gzip)) {
  console.log(`  - ${item.file}: ${toKb(item.gzip)} kB`);
}

console.log(`Largest JS chunks (gzip), max allowed per chunk: ${maxChunkBudgetKb.toFixed(2)} kB`);
for (const item of allJsChunks.slice(0, 10)) {
  console.log(`  - ${item.file}: ${toKb(item.gzip)} kB`);
}

let failed = false;
if (startupTotalGzip > startupBudgetBytes) {
  console.error(
    `Startup JS budget exceeded: ${toKb(startupTotalGzip)} kB > ${initialJsBudgetKb.toFixed(2)} kB`
  );
  failed = true;
}

if (oversizedChunks.length > 0) {
  console.error('Per-chunk gzip budget exceeded for:');
  for (const chunk of oversizedChunks) {
    console.error(`  - ${chunk.file}: ${toKb(chunk.gzip)} kB > ${maxChunkBudgetKb.toFixed(2)} kB`);
  }
  failed = true;
}

if (failed) {
  if (reportPath) {
    const reportDir = path.dirname(path.resolve(process.cwd(), reportPath));
    fs.mkdirSync(reportDir, { recursive: true });
    fs.writeFileSync(
      path.resolve(process.cwd(), reportPath),
      JSON.stringify({
        generatedAt: new Date().toISOString(),
        budgets: {
          startupKb: initialJsBudgetKb,
          maxChunkKb: maxChunkBudgetKb,
        },
        startupTotalGzipKb: Number(toKb(startupTotalGzip)),
        startupChunks: startupJs
          .map((item) => ({ file: item.file, gzipKb: Number(toKb(item.gzip)) }))
          .sort((a, b) => b.gzipKb - a.gzipKb),
        topChunks: allJsChunks
          .slice(0, 20)
          .map((item) => ({ file: item.file, gzipKb: Number(toKb(item.gzip)) })),
        oversizedChunks: oversizedChunks
          .map((item) => ({ file: item.file, gzipKb: Number(toKb(item.gzip)) })),
        passed: false,
      }, null, 2),
      'utf8'
    );
  }
  process.exit(1);
}

if (reportPath) {
  const reportDir = path.dirname(path.resolve(process.cwd(), reportPath));
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.resolve(process.cwd(), reportPath),
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      budgets: {
        startupKb: initialJsBudgetKb,
        maxChunkKb: maxChunkBudgetKb,
      },
      startupTotalGzipKb: Number(toKb(startupTotalGzip)),
      startupChunks: startupJs
        .map((item) => ({ file: item.file, gzipKb: Number(toKb(item.gzip)) }))
        .sort((a, b) => b.gzipKb - a.gzipKb),
      topChunks: allJsChunks
        .slice(0, 20)
        .map((item) => ({ file: item.file, gzipKb: Number(toKb(item.gzip)) })),
      oversizedChunks: [],
      passed: true,
    }, null, 2),
    'utf8'
  );
}

console.log('Bundle budgets passed.');
