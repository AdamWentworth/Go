import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const frontendDirectory = path.resolve(import.meta.dirname, '../..');
const contract = JSON.parse(readFileSync(
  path.resolve(frontendDirectory, 'performance-parity/contract.json'),
  'utf8',
));
const browserCollector = readFileSync(
  path.resolve(frontendDirectory, 'apps/web/tests/browser/performance-parity-report.spec.ts'),
  'utf8',
);
const androidReporter = readFileSync(
  path.resolve(frontendDirectory, 'apps/mobile/scripts/build-android-performance-report.mjs'),
  'utf8',
);
const nativeCollectionSources = [
  'apps/mobile/src/features/collection/parity/NativeCollectionParityFixture.tsx',
  'apps/mobile/src/features/collection/parity/useNativeOverlaySwipeNavigation.ts',
  'apps/mobile/src/screens/NativeCollectionHubScreen.tsx',
  'apps/mobile/src/screens/NativeCollectionParityScreen.tsx',
].map((file) => readFileSync(path.resolve(frontendDirectory, file), 'utf8')).join('\n');

const requiredCollectionInteractions = [
  ['interaction.collection.search-open', 'collection_search_menu_painted'],
  ['interaction.collection.sort-open', 'collection_sort_menu_painted'],
  ['interaction.collection.filter', 'collection_filter_result_revealed'],
  ['interaction.collection.tag-slide', 'collection_tag_touch_to_slide_started'],
  ['interaction.collection.tag-result', 'collection_tag_result_painted'],
  ['interaction.collection.query-result', 'collection_query_result_painted'],
  ['interaction.collection.typed-query', 'collection_typed_query_result_painted'],
  ['interaction.collection.sort-result', 'collection_sort_result_painted'],
  ['interaction.collection.evolution-result', 'collection_evolution_result_painted'],
  ['interaction.collection.clear-tag-dialog', 'collection_clear_tag_dialog_painted'],
  ['interaction.collection.selection', 'collection_selection_painted'],
  ['interaction.collection.organizer', 'collection_organizer_painted'],
  ['interaction.instance.navigate', 'instance_overlay_target_committed'],
];

test('every bounded Pokémon interaction has Vite and physical-native performance evidence', () => {
  const interactions = new Map(contract.interactions.map((entry) => [entry.id, entry]));
  for (const [scenarioId, nativeEvent] of requiredCollectionInteractions) {
    assert.equal(interactions.get(scenarioId)?.nativeEvent, nativeEvent, `${scenarioId} contract mapping`);
    assert.match(browserCollector, new RegExp(`['"]${scenarioId.replaceAll('.', '\\.')}['"]`), `${scenarioId} Vite measurement`);
    assert.match(androidReporter, new RegExp(`${nativeEvent}: ['"]${scenarioId.replaceAll('.', '\\.')}['"]`), `${scenarioId} Android report mapping`);
    assert.ok(nativeCollectionSources.includes(nativeEvent), `${nativeEvent} native paint trace`);
  }
});
