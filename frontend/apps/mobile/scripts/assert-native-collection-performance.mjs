#!/usr/bin/env node

import fs from 'node:fs';
import process from 'node:process';

const logPaths = process.argv.slice(2);
if (logPaths.length === 0) {
  console.error('Usage: node scripts/assert-native-collection-performance.mjs <device-logcat.txt> [...]');
  process.exit(2);
}

const readInteractionLatencies = (text, event) => {
  const eventPattern = new RegExp(`\\[mobile:ui-perf\\] ${event}(?![a-zA-Z0-9_])`, 'g');
  return [...text.matchAll(eventPattern)].flatMap((match) => {
    const block = text.slice(match.index, match.index + 1_200).split('\n').slice(0, 6).join('\n');
    const latency = block.match(/interactionLatencyMs:\s*(\d+)/);
    return latency ? [Number(latency[1])] : [];
  });
};

const budgets = {
  collection_search_menu_painted: 150,
  collection_filter_result_revealed: 100,
  collection_tag_slide_started: 32,
  collection_tag_result_painted: 150,
  collection_query_result_painted: 150,
  collection_typed_query_result_painted: 150,
  collection_projection_viewport_images_revealed: 1200,
  collection_projection_images_revealed: 3000,
  collection_sort_result_painted: 150,
  collection_evolution_result_painted: 150,
};
const measurements = Object.fromEntries(Object.keys(budgets).map((event) => [event, []]));
const latestOnlyEvents = new Set(['collection_typed_query_result_painted']);

for (const logPath of logPaths) {
  const text = fs.readFileSync(logPath, 'utf8');
  for (const event of Object.keys(budgets)) {
    const values = readInteractionLatencies(text, event);
    measurements[event].push(...(
      latestOnlyEvents.has(event) && values.length > 0 ? [values.at(-1)] : values
    ));
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
  const qualifier = latestOnlyEvents.has(event) ? ' (latest sequential input)' : '';
  console.log(`${event}: ${values.join(', ')} ms${qualifier} (budget ${budget} ms)`);
  if (maximum > budget) {
    failures.push(`${event}: ${maximum} ms exceeded the ${budget} ms budget`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}
