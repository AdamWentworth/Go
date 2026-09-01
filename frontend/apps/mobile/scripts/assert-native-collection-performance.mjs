#!/usr/bin/env node

import fs from 'node:fs';
import process from 'node:process';

const logPaths = process.argv.slice(2);
if (logPaths.length === 0) {
  console.error('Usage: node scripts/assert-native-collection-performance.mjs <device-logcat.txt> [...]');
  process.exit(2);
}

const readInteractionLatencies = (text, event) => {
  const pattern = new RegExp(
    `\\[mobile:ui-perf\\] ${event}[^\\n]*\\n(?:[^\\n]*\\n){0,5}?[^\\n]*interactionLatencyMs:\\s*(\\d+)`,
    'g',
  );
  return [...text.matchAll(pattern)].map((match) => Number(match[1]));
};

const budgets = {
  collection_tag_slide_started: 32,
  collection_tag_result_painted: 150,
};
const measurements = Object.fromEntries(Object.keys(budgets).map((event) => [event, []]));

for (const logPath of logPaths) {
  const text = fs.readFileSync(logPath, 'utf8');
  for (const event of Object.keys(budgets)) {
    measurements[event].push(...readInteractionLatencies(text, event));
  }
}

const failures = [];
for (const [event, budget] of Object.entries(budgets)) {
  const values = measurements[event];
  if (values.length === 0) {
    failures.push(`${event}: no production-mode Android measurement was recorded`);
    continue;
  }
  const maximum = Math.max(...values);
  console.log(`${event}: ${values.join(', ')} ms (budget ${budget} ms)`);
  if (maximum > budget) {
    failures.push(`${event}: ${maximum} ms exceeded the ${budget} ms budget`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
