#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);
const valueArgs = new Map();
const listArgs = new Map();
for (let index = 0; index < args.length; index += 1) {
  const name = args[index];
  if (!name.startsWith('--')) throw new Error(`Unexpected argument: ${name}`);
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  index += 1;
  if (['--logcat', '--gfxinfo', '--meminfo'].includes(name)) {
    listArgs.set(name, [...(listArgs.get(name) ?? []), value]);
  } else {
    valueArgs.set(name, value);
  }
}

const output = valueArgs.get('--output');
const profile = valueArgs.get('--profile') ?? 'android-diagnostic';
const runtime = valueArgs.get('--runtime') ?? null;
const refreshHz = Number(valueArgs.get('--refresh-hz') ?? 60);
const frameBudgetMs = Number.isFinite(refreshHz) && refreshHz > 0 ? 1_000 / refreshHz : 16.67;
if (!output) {
  console.error('Usage: build-android-performance-report.mjs --output report.json [--profile physical-android] [--logcat file] [--gfxinfo file] [--meminfo file]');
  process.exit(2);
}
if (profile === 'physical-android' && (
  valueArgs.get('--device-kind') !== 'physical' || runtime !== 'standalone'
)) {
  console.error('physical-android evidence requires a physical device and a standalone release APK.');
  process.exit(2);
}

const eventScenarios = {
  action_menu_surface_painted: 'interaction.action-menu.open',
  theme_visible_palette_committed: 'interaction.theme.toggle',
  collection_search_menu_painted: 'interaction.collection.search-open',
  collection_sort_menu_painted: 'interaction.collection.sort-open',
  collection_filter_result_revealed: 'interaction.collection.filter',
  collection_tag_touch_to_slide_started: 'interaction.collection.tag-slide',
  collection_tag_result_painted: 'interaction.collection.tag-result',
  collection_query_result_painted: 'interaction.collection.query-result',
  collection_typed_query_result_painted: 'interaction.collection.typed-query',
  collection_sort_result_painted: 'interaction.collection.sort-result',
  collection_evolution_result_painted: 'interaction.collection.evolution-result',
  collection_clear_tag_dialog_painted: 'interaction.collection.clear-tag-dialog',
  collection_selection_painted: 'interaction.collection.selection',
  collection_organizer_painted: 'interaction.collection.organizer',
  instance_overlay_target_committed: 'interaction.instance.navigate',
};
const eventSampleSelection = {
  collection_search_menu_painted: 'first',
  collection_typed_query_result_painted: 'last',
};

const samples = [];
const indexes = new Map();
const addSample = (scenarioId, metric, value, unit = 'ms') => {
  if (!Number.isFinite(value) || value < 0) return;
  const key = `${scenarioId}\u0000${metric}`;
  const sampleIndex = indexes.get(key) ?? 0;
  indexes.set(key, sampleIndex + 1);
  samples.push({ scenarioId, metric, unit, direction: 'lower', value, sampleIndex });
};

const readInteractionLatencies = (text, event) => {
  const eventPattern = new RegExp(`\\[mobile:ui-perf\\] ${event}(?![a-zA-Z0-9_])`, 'g');
  return [...text.matchAll(eventPattern)].flatMap((match) => {
    const block = text.slice(match.index, match.index + 1_500).split('\n').slice(0, 8).join('\n');
    const latency = block.match(/interactionLatencyMs:\s*(\d+(?:\.\d+)?)/);
    return latency ? [Number(latency[1])] : [];
  });
};

for (const logPath of listArgs.get('--logcat') ?? []) {
  const text = readFileSync(resolve(logPath), 'utf8');
  for (const [event, scenarioId] of Object.entries(eventScenarios)) {
    const latencies = readInteractionLatencies(text, event);
    const selection = eventSampleSelection[event];
    const selectedLatencies = selection === 'first'
      ? latencies.slice(0, 1)
      : selection === 'last'
        ? latencies.slice(-1)
        : latencies;
    for (const latency of selectedLatencies) {
      addSample(scenarioId, 'interaction_ready_ms', latency);
    }
  }
  for (const latency of readInteractionLatencies(text, 'global_touch_next_frame')) {
    addSample('global.runtime', 'touch_to_next_frame_ms', latency);
  }
}

const parseFrameStats = (text) => {
  const lines = text.split(/\r?\n/);
  const frames = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].startsWith('Flags,')) continue;
    const headers = lines[index].split(',');
    const intendedIndex = headers.indexOf('IntendedVsync');
    const completedIndex = headers.indexOf('FrameCompleted');
    const workloadTargetIndex = headers.indexOf('WorkloadTarget');
    if (intendedIndex < 0 || completedIndex < 0) continue;
    for (const row of lines.slice(index + 1)) {
      if (row === '---PROFILEDATA---') break;
      if (!/^\d+,/.test(row)) continue;
      const values = row.split(',').map(Number);
      if (values[0] !== 0) continue;
      const durationMs = (values[completedIndex] - values[intendedIndex]) / 1_000_000;
      const workloadTarget = workloadTargetIndex >= 0 ? values[workloadTargetIndex] : NaN;
      if (Number.isFinite(durationMs) && durationMs >= 0 && durationMs < 10_000) {
        frames.push({
          budgetMs: Number.isFinite(workloadTarget) && workloadTarget > 0
            ? workloadTarget / 1_000_000
            : null,
          durationMs,
        });
      }
    }
  }
  return frames;
};

const percentile = (values, fraction) => {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
};

const frames = (listArgs.get('--gfxinfo') ?? []).flatMap(
  (gfxPath) => parseFrameStats(readFileSync(resolve(gfxPath), 'utf8')),
);
if (frames.length) {
  const p95 = percentile(frames.map((frame) => frame.durationMs), 0.95);
  const jankyPercent = frames.filter(
    (frame) => frame.durationMs > (frame.budgetMs ?? frameBudgetMs),
  ).length / frames.length * 100;
  addSample('global.runtime', 'frame_time_p95_ms', p95);
  addSample('global.runtime', 'janky_frames_percent', jankyPercent, 'percent');
}

const parseTotalPssBytes = (text) => {
  const explicit = text.match(/TOTAL PSS:\s*([\d,]+)\s*(?:KB|kB)?/i);
  if (explicit) return Number(explicit[1].replaceAll(',', '')) * 1024;
  const totalRow = text.match(/^\s*TOTAL\s+([\d,]+)/m);
  return totalRow ? Number(totalRow[1].replaceAll(',', '')) * 1024 : null;
};

for (const memoryPath of listArgs.get('--meminfo') ?? []) {
  const bytes = parseTotalPssBytes(readFileSync(resolve(memoryPath), 'utf8'));
  if (bytes != null) addSample('global.runtime', 'memory_pss_bytes', bytes, 'bytes');
}

let commit = null;
try {
  commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: resolve(dirname(new URL(import.meta.url).pathname), '../../../..'),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  // Reports remain valid outside a Git checkout.
}

const report = {
  schemaVersion: 1,
  implementation: 'native-android',
  profile,
  createdAt: new Date().toISOString(),
  commit,
  environment: {
    deviceId: valueArgs.get('--device-id') ?? null,
    deviceIdentity: valueArgs.get('--device-id') ?? null,
    deviceKind: valueArgs.get('--device-kind') ?? null,
    runtime,
    repetitions: Number(valueArgs.get('--repetitions')) || null,
    source: 'adb-logcat-gfxinfo-meminfo',
    refreshHz,
    workloadId: valueArgs.get('--workload-id') ?? null,
    catalogEntries: Number(valueArgs.get('--catalog-entries')) || null,
    instanceEntries: Number(valueArgs.get('--instance-entries')) || null,
    pvpEntries: Number(valueArgs.get('--pvp-entries')) || null,
  },
  samples,
};
mkdirSync(dirname(resolve(output)), { recursive: true });
writeFileSync(resolve(output), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`Android performance report: ${resolve(output)} (${samples.length} samples)\n`);
