import React, { useCallback, useMemo, useState } from 'react';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import {
  projectPokedexRegistrations,
  type PokedexRegistrationEntry,
} from '@/features/pokedex/registrationProjection';
import { useVariantsStore } from '@/features/variants/store/useVariantsStore';
import { emptyTagBuckets } from '@/features/tags/utils/initializePokemonTags';
import { AppLoadingFallback } from '@/contexts/AppLoadingContext';
import PokedexListsMenu from '@/pages/Pokemon/components/Menus/PokedexMenu/PokedexListsMenu';
import PokemonMenu from '@/pages/Pokemon/components/Menus/PokemonMenu/PokemonMenu';
import PokedexOverlay from '@/pages/Pokemon/features/pokedex/PokedexOverlay';
import usePokemonProcessing from '@/pages/Pokemon/hooks/usePokemonProcessing';
import useUIControls from '@/pages/Pokemon/hooks/useUIControls';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { Instances } from '@/types/instances';
import type { TagBuckets } from '@/types/tags';

import './Pokedex.css';

type PokedexViewMode = 'regions' | 'region' | 'categories' | 'list';
type SelectedPokemon =
  | PokemonVariant
  | { pokemon: PokemonVariant; overlayType: 'instance' }
  | null;

interface RegionDefinition {
  key: string;
  label: string;
  generation: number;
  starterDexNumbers: number[];
  accent: string;
  secondaryAccent: string;
}

interface RegionSummary extends RegionDefinition {
  species: PokemonVariant[];
  previewPokemon: PokemonVariant[];
  registeredDexNumbers: Set<number>;
  totalCount: number;
  registeredCount: number;
  shinyCount: number;
  luckyCount: number;
  xxlCount: number;
  xxsCount: number;
  perfectCount: number;
}

const emptyInstances: Instances = {};
const emptyLists: Record<string, Record<string, unknown>> = {};

const REGION_DEFINITIONS: RegionDefinition[] = [
  {
    key: 'kanto',
    label: 'Kanto',
    generation: 1,
    starterDexNumbers: [1, 4, 7],
    accent: '#0796bb',
    secondaryAccent: '#42d8bd',
  },
  {
    key: 'johto',
    label: 'Johto',
    generation: 2,
    starterDexNumbers: [152, 155, 158],
    accent: '#1a9dcc',
    secondaryAccent: '#ffd057',
  },
  {
    key: 'hoenn',
    label: 'Hoenn',
    generation: 3,
    starterDexNumbers: [252, 255, 258],
    accent: '#0f9fb0',
    secondaryAccent: '#ff934f',
  },
  {
    key: 'sinnoh',
    label: 'Sinnoh',
    generation: 4,
    starterDexNumbers: [387, 390, 393],
    accent: '#297fc8',
    secondaryAccent: '#87dc6d',
  },
  {
    key: 'unova',
    label: 'Unova',
    generation: 5,
    starterDexNumbers: [495, 498, 501],
    accent: '#168cb7',
    secondaryAccent: '#f37c67',
  },
  {
    key: 'kalos',
    label: 'Kalos',
    generation: 6,
    starterDexNumbers: [650, 653, 656],
    accent: '#239fcb',
    secondaryAccent: '#ffd76a',
  },
  {
    key: 'alola',
    label: 'Alola',
    generation: 7,
    starterDexNumbers: [722, 725, 728],
    accent: '#008f9d',
    secondaryAccent: '#ffb84d',
  },
  {
    key: 'galar',
    label: 'Galar',
    generation: 8,
    starterDexNumbers: [810, 813, 816],
    accent: '#246fba',
    secondaryAccent: '#df70ce',
  },
  {
    key: 'hisui',
    label: 'Hisui',
    generation: 9,
    starterDexNumbers: [722, 155, 501],
    accent: '#487c9e',
    secondaryAccent: '#d39b64',
  },
  {
    key: 'paldea',
    label: 'Paldea',
    generation: 10,
    starterDexNumbers: [906, 909, 912],
    accent: '#cc5a58',
    secondaryAccent: '#5ac3b6',
  },
];

function formatListLabel(key: string): string {
  if (key === 'all') return 'All Pokemon';
  return key
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function getDexNumber(pokemon: PokemonVariant): number | null {
  return asNumber(pokemon.pokedex_number);
}

function formatDexNumber(pokemon: PokemonVariant): string {
  const dexNumber = getDexNumber(pokemon);
  return dexNumber === null ? '----' : String(dexNumber).padStart(4, '0');
}

function getDisplayName(pokemon: PokemonVariant): string {
  return pokemon.species_name || pokemon.name;
}

function getPokemonImage(pokemon: PokemonVariant): string | undefined {
  return pokemon.currentImage || pokemon.image_url;
}

function getBaseSpeciesByDex(variants: PokemonVariant[]): PokemonVariant[] {
  const byDexNumber = new Map<number, PokemonVariant>();

  for (const variant of variants) {
    const dexNumber = getDexNumber(variant);
    if (dexNumber === null) continue;

    const existing = byDexNumber.get(dexNumber);
    if (!existing) {
      byDexNumber.set(dexNumber, variant);
      continue;
    }

    const variantIsDefault = variant.variantType === 'default';
    const existingIsDefault = existing.variantType === 'default';
    if (variantIsDefault && !existingIsDefault) {
      byDexNumber.set(dexNumber, variant);
      continue;
    }

    if (variantIsDefault === existingIsDefault && variant.pokemon_id < existing.pokemon_id) {
      byDexNumber.set(dexNumber, variant);
    }
  }

  return Array.from(byDexNumber.values()).sort((left, right) => {
    const leftDex = getDexNumber(left) ?? 0;
    const rightDex = getDexNumber(right) ?? 0;
    return leftDex - rightDex;
  });
}

function getRegionGeneration(pokemon: PokemonVariant): number | null {
  return asNumber(pokemon.generation);
}

function getRegisteredEntriesForRegion(
  registrations: PokedexRegistrationEntry[],
  regionDexNumbers: Set<number>,
): PokedexRegistrationEntry[] {
  return registrations.filter((entry) => {
    if (!entry.is_registered || entry.pokedex_number === null) return false;
    return regionDexNumbers.has(entry.pokedex_number);
  });
}

function countRegisteredDexNumbers(
  entries: PokedexRegistrationEntry[],
  predicate: (entry: PokedexRegistrationEntry) => boolean,
): number {
  const dexNumbers = new Set<number>();
  for (const entry of entries) {
    if (entry.pokedex_number === null || !predicate(entry)) continue;
    dexNumbers.add(entry.pokedex_number);
  }
  return dexNumbers.size;
}

function Pokedex() {
  const variants = useVariantsStore((s) => s.variants);
  const pokedexLists = useVariantsStore((s) => s.pokedexLists);
  const loading = useVariantsStore((s) => s.variantsLoading);
  const instances = useInstancesStore((s) => s.instances);

  const [viewMode, setViewMode] = useState<PokedexViewMode>('regions');
  const [selectedRegionKey, setSelectedRegionKey] = useState(REGION_DEFINITIONS[0].key);
  const [selectedList, setSelectedList] = useState<PokemonVariant[]>(variants);
  const [selectedListKey, setSelectedListKey] = useState('all');
  const [selectedPokemon, setSelectedPokemon] = useState<SelectedPokemon>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionSearchTerm, setRegionSearchTerm] = useState('');

  const {
    showEvolutionaryLine,
    toggleEvolutionaryLine,
    isFastSelectEnabled,
    setIsFastSelectEnabled,
    sortType,
    setSortType,
    sortMode,
    setSortMode,
    highlightedCards,
    setHighlightedCards,
    toggleCardHighlight,
  } = useUIControls({
    showEvolutionaryLine: false,
    isFastSelectEnabled: false,
    sortType: 'number',
    sortMode: 'ascending',
  });

  React.useEffect(() => {
    if (selectedListKey !== 'all') return;
    setSelectedList(variants);
  }, [selectedListKey, variants]);

  const activeTags = useMemo(() => emptyTagBuckets as TagBuckets, []);
  const baseVariants = selectedListKey === 'all' ? variants : selectedList;
  const baseSpecies = useMemo(() => getBaseSpeciesByDex(variants), [variants]);
  const registrations = useMemo(
    () => projectPokedexRegistrations(variants, instances),
    [instances, variants],
  );

  const { sortedPokemons } = usePokemonProcessing(
    baseVariants,
    emptyInstances,
    '',
    activeTags,
    searchTerm,
    showEvolutionaryLine,
    sortType,
    sortMode,
  );

  const regionSummaries = useMemo<RegionSummary[]>(() => {
    return REGION_DEFINITIONS.map((region) => {
      const species = baseSpecies.filter(
        (pokemon) => getRegionGeneration(pokemon) === region.generation,
      );
      const regionDexNumbers = new Set(
        species
          .map((pokemon) => getDexNumber(pokemon))
          .filter((dexNumber): dexNumber is number => dexNumber !== null),
      );
      const registeredEntries = getRegisteredEntriesForRegion(registrations, regionDexNumbers);
      const registeredDexNumbers = new Set(
        registeredEntries
          .map((entry) => entry.pokedex_number)
          .filter((dexNumber): dexNumber is number => dexNumber !== null),
      );
      const previewPokemon = region.starterDexNumbers
        .map((dexNumber) => species.find((pokemon) => getDexNumber(pokemon) === dexNumber))
        .filter((pokemon): pokemon is PokemonVariant => Boolean(pokemon));

      return {
        ...region,
        species,
        previewPokemon: previewPokemon.length ? previewPokemon : species.slice(0, 3),
        registeredDexNumbers,
        totalCount: species.length,
        registeredCount: registeredDexNumbers.size,
        shinyCount: countRegisteredDexNumbers(
          registeredEntries,
          (entry) => String(entry.facets.variant).includes('shiny'),
        ),
        luckyCount: countRegisteredDexNumbers(registeredEntries, (entry) => entry.facets.lucky === true),
        xxlCount: countRegisteredDexNumbers(registeredEntries, (entry) => entry.facets.size === 'xxl'),
        xxsCount: countRegisteredDexNumbers(registeredEntries, (entry) => entry.facets.size === 'xxs'),
        perfectCount: countRegisteredDexNumbers(
          registeredEntries,
          (entry) => entry.facets.appraisal === '4-star',
        ),
      };
    }).filter((region) => region.totalCount > 0);
  }, [baseSpecies, registrations]);

  const selectedRegion = useMemo(
    () =>
      regionSummaries.find((region) => region.key === selectedRegionKey) ??
      regionSummaries[0] ??
      null,
    [regionSummaries, selectedRegionKey],
  );

  const filteredRegionSpecies = useMemo(() => {
    if (!selectedRegion) return [];
    const normalizedSearchTerm = regionSearchTerm.trim().toLowerCase();
    if (!normalizedSearchTerm) return selectedRegion.species;

    return selectedRegion.species.filter((pokemon) => {
      const dexNumber = getDexNumber(pokemon);
      return (
        getDisplayName(pokemon).toLowerCase().includes(normalizedSearchTerm) ||
        (dexNumber !== null && String(dexNumber).includes(normalizedSearchTerm))
      );
    });
  }, [regionSearchTerm, selectedRegion]);

  const totalRegisteredCount = useMemo(
    () => regionSummaries.reduce((total, region) => total + region.registeredCount, 0),
    [regionSummaries],
  );
  const totalSpeciesCount = useMemo(
    () => regionSummaries.reduce((total, region) => total + region.totalCount, 0),
    [regionSummaries],
  );

  const handleListSelect = useCallback((list: PokemonVariant[], key: string) => {
    setHighlightedCards(new Set());
    setSelectedList(list);
    setSelectedListKey(key || 'all');
    setViewMode('list');
  }, [setHighlightedCards]);

  const handleHighlightedCardsChange = useCallback(
    (cards: Set<number | string>) => {
      setHighlightedCards(new Set(Array.from(cards).map(String)));
    },
    [setHighlightedCards],
  );

  const handlePokedexActiveViewChange = useCallback((view: string) => {
    if (view === 'pokemon') {
      setViewMode('list');
    }
  }, []);

  const handleShowRegions = useCallback(() => {
    setSelectedPokemon(null);
    setViewMode('regions');
  }, []);

  const handleShowCategories = useCallback(() => {
    setViewMode('categories');
    setSelectedPokemon(null);
  }, []);

  const handleShowSelectedList = useCallback(() => {
    setSelectedPokemon(null);
    setViewMode('list');
  }, []);

  const handleRegionSelect = useCallback((regionKey: string) => {
    setSelectedPokemon(null);
    setRegionSearchTerm('');
    setSelectedRegionKey(regionKey);
    setViewMode('region');
  }, []);

  const handleCloseRegionOverlay = useCallback(() => {
    setSelectedPokemon(null);
  }, []);

  const handleOverlayPokemonSelect = useCallback((pokemon: PokemonVariant) => {
    setSelectedPokemon(pokemon);
  }, []);

  if (loading && variants.length === 0) {
    return <AppLoadingFallback source="pokedex-page" />;
  }

  return (
    <div className="pokedex-page">
      <div className="pokedex-page__shell">
        <header className="pokedex-page__header">
          <p className="pokedex-page__eyebrow">Pokedex</p>
          <div className="pokedex-page__title-row">
            <h1 className="pokedex-page__title">Pokedex</h1>
            <p className="pokedex-page__caught-total">
              Caught: {totalRegisteredCount} / {totalSpeciesCount}
            </p>
          </div>
          <div className="pokedex-page__actions" aria-label="Pokedex views">
            <button
              className={`pokedex-page__button ${viewMode === 'regions' || viewMode === 'region' ? 'is-active' : ''}`}
              type="button"
              onClick={handleShowRegions}
            >
              Regions
            </button>
            <button
              className={`pokedex-page__button ${viewMode === 'categories' ? 'is-active' : ''}`}
              type="button"
              onClick={handleShowCategories}
            >
              Categories
            </button>
            <button
              className={`pokedex-page__button ${viewMode === 'list' ? 'is-active' : ''}`}
              type="button"
              onClick={handleShowSelectedList}
            >
              {formatListLabel(selectedListKey)}
            </button>
          </div>
        </header>

        <section className="pokedex-page__panel" aria-label="Pokedex catalog">
          {viewMode === 'regions' ? (
            <div className="pokedex-regions" aria-label="Regions">
              {regionSummaries.map((region) => {
                const isComplete = region.totalCount > 0 && region.registeredCount >= region.totalCount;

                return (
                  <button
                    className="pokedex-region-card"
                    key={region.key}
                    style={{
                      '--region-accent': region.accent,
                      '--region-secondary-accent': region.secondaryAccent,
                    } as React.CSSProperties}
                    type="button"
                    onClick={() => handleRegionSelect(region.key)}
                  >
                    <span className="pokedex-region-card__copy">
                      <span className="pokedex-region-card__name">{region.label}</span>
                      <span className="pokedex-region-card__status">
                        {isComplete ? 'Complete!' : 'In progress'}
                      </span>
                      <span className="pokedex-region-card__count">
                        {region.registeredCount} / {region.totalCount}
                      </span>
                      <span className={`pokedex-region-card__badge ${isComplete ? 'is-complete' : ''}`}>
                        {isComplete ? 'OK' : '!'}
                      </span>
                    </span>
                    <span className="pokedex-region-card__art" aria-hidden="true">
                      {region.previewPokemon.map((pokemon, index) => {
                        const image = getPokemonImage(pokemon);

                        return image ? (
                          <img
                            alt=""
                            className={`pokedex-region-card__pokemon pokedex-region-card__pokemon--${index + 1}`}
                            key={pokemon.variant_id}
                            src={image}
                          />
                        ) : null;
                      })}
                    </span>
                  </button>
                );
              })}
              {regionSummaries.length === 0 ? (
                <p className="pokedex-page__empty">
                  Pokedex data is not available yet. Try again after the Pokemon catalog finishes loading.
                </p>
              ) : null}
            </div>
          ) : null}

          {viewMode === 'region' && selectedRegion ? (
            <div
              className="pokedex-region-detail"
              style={{
                '--region-accent': selectedRegion.accent,
                '--region-secondary-accent': selectedRegion.secondaryAccent,
              } as React.CSSProperties}
            >
              <header className="pokedex-region-detail__summary">
                <div className="pokedex-region-detail__summary-top">
                  <div>
                    <p className="pokedex-region-detail__eyebrow">Region</p>
                    <h2 className="pokedex-region-detail__title">{selectedRegion.label}</h2>
                  </div>
                  <div className="pokedex-region-detail__count">
                    {selectedRegion.registeredCount} / {selectedRegion.totalCount}
                  </div>
                </div>
                <dl className="pokedex-region-detail__stats" aria-label={`${selectedRegion.label} registration totals`}>
                  <div>
                    <dt>Shiny</dt>
                    <dd>{selectedRegion.shinyCount}</dd>
                  </div>
                  <div>
                    <dt>Lucky</dt>
                    <dd>{selectedRegion.luckyCount}</dd>
                  </div>
                  <div>
                    <dt>XXL</dt>
                    <dd>{selectedRegion.xxlCount}</dd>
                  </div>
                  <div>
                    <dt>XXS</dt>
                    <dd>{selectedRegion.xxsCount}</dd>
                  </div>
                  <div>
                    <dt>100%</dt>
                    <dd>{selectedRegion.perfectCount}</dd>
                  </div>
                </dl>
              </header>

              <div className="pokedex-region-detail__toolbar">
                <button className="pokedex-region-detail__toolbar-button" type="button" onClick={handleShowRegions}>
                  Regions
                </button>
                <label className="pokedex-region-detail__search">
                  <span className="pokedex-region-detail__search-label">Search</span>
                  <input
                    type="search"
                    value={regionSearchTerm}
                    onChange={(event) => setRegionSearchTerm(event.target.value)}
                    placeholder="Pokemon or number"
                  />
                </label>
              </div>

              <div className="pokedex-region-grid" aria-label={`${selectedRegion.label} Pokemon`}>
                {filteredRegionSpecies.map((pokemon) => {
                  const dexNumber = getDexNumber(pokemon);
                  const image = getPokemonImage(pokemon);
                  const isRegistered = dexNumber !== null && selectedRegion.registeredDexNumbers.has(dexNumber);

                  return (
                    <button
                      className={`pokedex-region-grid__cell ${isRegistered ? 'is-registered' : ''}`}
                      key={pokemon.variant_id}
                      type="button"
                      onClick={() => setSelectedPokemon(pokemon)}
                    >
                      <span className="pokedex-region-grid__image-frame">
                        {image ? (
                          <img src={image} alt="" className="pokedex-region-grid__image" />
                        ) : (
                          <span className="pokedex-region-grid__placeholder" aria-hidden="true" />
                        )}
                      </span>
                      <span className="pokedex-region-grid__number">{formatDexNumber(pokemon)}</span>
                      <span className="pokedex-region-grid__name">{getDisplayName(pokemon)}</span>
                    </button>
                  );
                })}
              </div>

              {filteredRegionSpecies.length === 0 ? (
                <p className="pokedex-region-detail__empty">No Pokemon match this search.</p>
              ) : null}
            </div>
          ) : null}

          {viewMode === 'categories' ? (
            <PokedexListsMenu
              setHighlightedCards={handleHighlightedCardsChange}
              setActiveView={handlePokedexActiveViewChange}
              onListSelect={handleListSelect}
              pokedexLists={pokedexLists}
              variants={variants}
            />
          ) : null}

          {viewMode === 'list' ? (
            <div className="pokedex-page__grid-panel">
              <PokemonMenu
                isEditable={false}
                sortedPokemons={sortedPokemons}
                allPokemons={variants}
                loading={loading}
                selectedPokemon={selectedPokemon}
                setSelectedPokemon={setSelectedPokemon}
                isFastSelectEnabled={isFastSelectEnabled}
                toggleCardHighlight={toggleCardHighlight}
                highlightedCards={highlightedCards}
                tagFilter=""
                lists={emptyLists}
                instances={emptyInstances as Record<string, PokemonInstance>}
                sortType={sortType}
                setSortType={setSortType}
                sortMode={sortMode}
                setSortMode={setSortMode}
                variants={variants}
                username=""
                setIsFastSelectEnabled={setIsFastSelectEnabled}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showEvolutionaryLine={showEvolutionaryLine}
                toggleEvolutionaryLine={toggleEvolutionaryLine}
                activeView={`pokedex-${selectedListKey}`}
              />
            </div>
          ) : null}

          {viewMode === 'region' && selectedPokemon && !('overlayType' in selectedPokemon) ? (
            <PokedexOverlay
              pokemon={selectedPokemon}
              onClose={handleCloseRegionOverlay}
              allPokemons={variants}
              setSelectedPokemon={handleOverlayPokemonSelect}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default Pokedex;
