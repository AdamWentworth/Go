import { buildNativePokedexEntries, filterNativePokedexEntries } from '../../../src/features/tools/nativePokedexModel';

const base = {
  pokemon_id: 25, name: 'Pikachu', pokedex_number: 25, generation: 1,
  image_url: '/pikachu.png', image_url_shiny: '/pikachu-shiny.png',
  image_url_shadow: '/pikachu-shadow.png', image_url_shiny_shadow: '/pikachu-shiny-shadow.png',
  shiny_available: 1, date_shadow_available: '2020-01-01', date_shiny_shadow_available: '2021-01-01',
  costumes: [{ costume_id: 1, name: 'detective', date_available: '2020-01-01', date_shiny_available: '2024-01-01', shiny_available: true, image_url: '/detective.png', image_url_shiny: '/detective-shiny.png' }],
  max: [{ pokemon_id: 25, dynamax: true, gigantamax: false, dynamax_release_date: '2024-01-01', gigantamax_release_date: null }],
  megaEvolutions: [], fusion: [], crownForms: [], type_1_icon: '/electric.png', type_2_icon: '',
} as never;

describe('native Pokédex model', () => {
  it('projects every canonical variant and registration state', () => {
    const entries = buildNativePokedexEntries([base], {
      caught: { instance_id: 'caught', pokemon_id: 25, variant_id: '0025-shiny', is_caught: true },
    } as never);
    expect(entries.find(({ id }) => id === '0025-shiny')?.registered).toBe(true);
    expect(entries.some(({ category }) => category === 'costume')).toBe(true);
    expect(entries.some(({ category }) => category === 'max')).toBe(true);
  });

  it('filters by region, variant category, name, and dex number', () => {
    const entries = buildNativePokedexEntries([base]);
    expect(filterNativePokedexEntries({ entries, category: 'shiny', generation: 1, query: '25' }).every(({ id }) => id.includes('shiny'))).toBe(true);
    expect(filterNativePokedexEntries({ entries, category: 'all', generation: 2, query: '' })).toEqual([]);
  });
});
