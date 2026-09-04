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
const nativePokedexSources = [
  'apps/mobile/src/screens/NativePokedexScreen.tsx',
  'apps/mobile/src/screens/NativePokedexDetailScreen.tsx',
].map((file) => readFileSync(path.resolve(frontendDirectory, file), 'utf8')).join('\n');

const requiredPokedexInteractions = [
  ['interaction.pokedex.advanced-result', 'pokedex_advanced_result_painted'],
  ['interaction.pokedex.category-result', 'pokedex_category_result_painted'],
  ['interaction.pokedex.facet-result', 'pokedex_facet_result_painted'],
  ['interaction.pokedex.region-index', 'pokedex_region_index_painted'],
  ['interaction.pokedex.search-result', 'pokedex_search_result_painted'],
  ['interaction.pokedex.region-section', 'pokedex_region_section_painted'],
  ['interaction.pokedex.bulk-dialog', 'pokedex_bulk_dialog_painted'],
  ['interaction.pokedex.registration-result', 'pokedex_registration_result_painted'],
  ['interaction.pokedex.detail-open', 'pokedex_detail_painted'],
  ['interaction.pokedex.detail.slot-result', 'pokedex_detail_slot_result_painted'],
  ['interaction.pokedex.detail.gender-result', 'pokedex_detail_gender_result_painted'],
  ['interaction.pokedex.detail.tab-result', 'pokedex_detail_tab_result_painted'],
  ['interaction.pokedex.detail.combo-section', 'pokedex_detail_combo_section_painted'],
  ['interaction.pokedex.detail.combo-filter', 'pokedex_detail_combo_filter_result_painted'],
  ['interaction.pokedex.detail.combo-query', 'pokedex_detail_combo_query_result_painted'],
  ['interaction.pokedex.detail.bulk-dialog', 'pokedex_detail_bulk_dialog_painted'],
  ['interaction.pokedex.detail.registration-result', 'pokedex_detail_registration_result_painted'],
];

test('every bounded Pokédex interaction has Vite and physical-native performance evidence', () => {
  const interactions = new Map(contract.interactions.map((entry) => [entry.id, entry]));
  for (const [scenarioId, nativeEvent] of requiredPokedexInteractions) {
    assert.equal(interactions.get(scenarioId)?.nativeEvent, nativeEvent, `${scenarioId} contract mapping`);
    assert.match(browserCollector, new RegExp(`['"]${scenarioId.replaceAll('.', '\\.')}['"]`), `${scenarioId} Vite measurement`);
    assert.match(androidReporter, new RegExp(`${nativeEvent}: ['"]${scenarioId.replaceAll('.', '\\.')}['"]`), `${scenarioId} Android report mapping`);
    assert.ok(nativePokedexSources.includes(nativeEvent), `${nativeEvent} native paint trace`);
  }
});
