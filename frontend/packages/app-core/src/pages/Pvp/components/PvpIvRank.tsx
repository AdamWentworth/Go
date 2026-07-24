import { useMemo, useState } from 'react';
import {
  FaCheck,
  FaMinus,
  FaPlus,
  FaSearch,
  FaStar,
  FaTimes,
} from 'react-icons/fa';
import type { PokemonPvPLeagueKey } from '@shared-contracts/pokemon';

import type { PokemonVariant } from '@/types/pokemonVariants';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { getTypeIconPath } from '@/utils/imageHelpers';

import {
  buildPvPIvRankings,
  rankPvPIvSpread,
  type PvPIvValues,
} from '../utils/pvpIvRank';
import {
  buildPvPIvPokemonOptions,
  type PvPIvPokemonOption,
} from '../utils/pvpIvPokemon';
import './PvpIvRank.css';

type IvField = keyof PvPIvValues;

const LEAGUE_LABELS: Record<PokemonPvPLeagueKey, string> = {
  great: 'Great League',
  ultra: 'Ultra League',
  master: 'Master League',
};

const clampIv = (value: number): number =>
  Math.max(0, Math.min(15, Math.round(Number(value) || 0)));

const formatLevel = (level: number): string =>
  Number.isInteger(level) ? String(level) : level.toFixed(1);

const formatTopPercent = (rank: number, total: number): string => {
  const percent = (rank / Math.max(1, total)) * 100;
  if (percent < 0.1) return 'Top 0.1%';
  if (percent < 1) return `Top ${percent.toFixed(1)}%`;
  return `Top ${Math.ceil(percent)}%`;
};

function TypeIcons({ types }: { types: string[] }) {
  return (
    <span className="pvp-iv-types" aria-label={types.join(' and ')}>
      {types.map((type) => (
        <img
          key={type}
          src={getTypeIconPath(type)}
          alt=""
          title={type}
          draggable={false}
        />
      ))}
    </span>
  );
}

function IvStepper({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="pvp-iv-stepper">
      <span>{label}</span>
      <div>
        <button
          type="button"
          aria-label={`Decrease ${label} IV`}
          disabled={disabled || value <= 0}
          onClick={() => onChange(value - 1)}
        >
          <FaMinus aria-hidden="true" />
        </button>
        <input
          type="number"
          min="0"
          max="15"
          inputMode="numeric"
          aria-label={`${label} IV`}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(clampIv(Number(event.target.value)))}
        />
        <button
          type="button"
          aria-label={`Increase ${label} IV`}
          disabled={disabled || value >= 15}
          onClick={() => onChange(value + 1)}
        >
          <FaPlus aria-hidden="true" />
        </button>
      </div>
    </label>
  );
}

function SpreadRow({
  spread,
  selected,
}: {
  spread: NonNullable<ReturnType<typeof rankPvPIvSpread>>['selected'];
  selected: boolean;
}) {
  return (
    <tr className={selected ? 'selected' : undefined}>
      <td>
        {selected && <FaCheck aria-hidden="true" />}
        #{spread.rank}
      </td>
      <td>{spread.attack}/{spread.defense}/{spread.stamina}</td>
      <td>{formatLevel(spread.level)}</td>
      <td>{spread.cp.toLocaleString()}</td>
      <td>{spread.statProductPercent.toFixed(2)}%</td>
    </tr>
  );
}

const PvpIvRank = ({
  variants,
  variantsLoading,
  league,
}: {
  variants: PokemonVariant[];
  variantsLoading: boolean;
  league: PokemonPvPLeagueKey;
}) => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ivs, setIvs] = useState<PvPIvValues>({
    attack: 0,
    defense: 15,
    stamina: 15,
  });
  const [bestBuddy, setBestBuddy] = useState(false);

  const options = useMemo(
    () => buildPvPIvPokemonOptions(variants),
    [variants],
  );
  const selectedPokemon = useMemo(
    () => options.find((option) => option.id === selectedId) ?? null,
    [options, selectedId],
  );
  const matchingOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return selectedPokemon ? [] : options.slice(0, 18);
    return options
      .filter((option) => (
        option.name.toLowerCase().includes(normalized) ||
        String(option.pokedexNumber).includes(normalized)
      ))
      .slice(0, 24);
  }, [options, query, selectedPokemon]);
  const rankings = useMemo(
    () => selectedPokemon
      ? buildPvPIvRankings(
        {
          attack: selectedPokemon.attack,
          defense: selectedPokemon.defense,
          stamina: selectedPokemon.stamina,
        },
        league,
        bestBuddy ? 51 : 50,
      )
      : [],
    [bestBuddy, league, selectedPokemon],
  );
  const result = useMemo(
    () => rankPvPIvSpread(rankings, ivs),
    [ivs, rankings],
  );

  const updateIv = (field: IvField, value: number) => {
    setIvs((current) => ({ ...current, [field]: clampIv(value) }));
  };

  const choosePokemon = (option: PvPIvPokemonOption) => {
    setSelectedId(option.id);
    setQuery(option.name);
  };

  return (
    <section className="pvp-iv-rank" aria-label="PvP IV Rank">
      <header>
        <div>
          <span>IV Rank</span>
          <h2>Find the strongest IV spread for this league</h2>
        </div>
        <strong>{LEAGUE_LABELS[league]}</strong>
      </header>

      <div className="pvp-iv-workbench">
        <section className="pvp-iv-controls">
          <label className="pvp-iv-search">
            <span>Pokémon or Pokédex number</span>
            <div>
              <FaSearch aria-hidden="true" />
              <input
                type="search"
                value={query}
                placeholder="Search Pokémon"
                aria-label="Search IV Rank Pokémon"
                autoComplete="off"
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (selectedPokemon && event.target.value !== selectedPokemon.name) {
                    setSelectedId(null);
                  }
                }}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear IV Rank Pokémon"
                  onClick={() => {
                    setQuery('');
                    setSelectedId(null);
                  }}
                >
                  <FaTimes aria-hidden="true" />
                </button>
              )}
            </div>
          </label>

          {!selectedPokemon && (
            <div className="pvp-iv-search-results" aria-live="polite">
              {variantsLoading && variants.length === 0 ? (
                <span role="status">Loading the Pokémon catalog...</span>
              ) : matchingOptions.length > 0 ? (
                matchingOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    aria-label={`Select #${String(option.pokedexNumber).padStart(4, '0')} ${option.name}`}
                    onClick={() => choosePokemon(option)}
                  >
                    <img
                      src={resolveAssetUrl(option.imageUrl)}
                      alt=""
                      loading="lazy"
                      draggable={false}
                    />
                    <span>
                      <small>#{String(option.pokedexNumber).padStart(4, '0')}</small>
                      <strong>{option.name}</strong>
                    </span>
                    <TypeIcons types={option.types} />
                  </button>
                ))
              ) : (
                <span>No Pokémon match that search.</span>
              )}
            </div>
          )}

          {selectedPokemon && (
            <article className="pvp-iv-selected-pokemon">
              <img
                src={resolveAssetUrl(selectedPokemon.imageUrl)}
                alt=""
                draggable={false}
              />
              <div>
                <small>
                  #{String(selectedPokemon.pokedexNumber).padStart(4, '0')}
                </small>
                <strong>{selectedPokemon.name}</strong>
                <TypeIcons types={selectedPokemon.types} />
              </div>
              <span>
                {selectedPokemon.attack} ATK · {selectedPokemon.defense} DEF ·{' '}
                {selectedPokemon.stamina} STA
              </span>
            </article>
          )}

          <div
            className="pvp-iv-inputs"
            role="group"
            aria-labelledby="pvp-iv-inputs-label"
          >
            <span id="pvp-iv-inputs-label">Appraisal IVs</span>
            <IvStepper
              label="Attack"
              value={ivs.attack}
              disabled={!selectedPokemon}
              onChange={(value) => updateIv('attack', value)}
            />
            <IvStepper
              label="Defense"
              value={ivs.defense}
              disabled={!selectedPokemon}
              onChange={(value) => updateIv('defense', value)}
            />
            <IvStepper
              label="HP"
              value={ivs.stamina}
              disabled={!selectedPokemon}
              onChange={(value) => updateIv('stamina', value)}
            />
          </div>

          <div className="pvp-iv-level-cap" role="group" aria-label="Level ceiling">
            <button
              type="button"
              className={!bestBuddy ? 'active' : ''}
              aria-pressed={!bestBuddy}
              disabled={!selectedPokemon}
              onClick={() => setBestBuddy(false)}
            >
              Level 50
            </button>
            <button
              type="button"
              className={bestBuddy ? 'active' : ''}
              aria-pressed={bestBuddy}
              disabled={!selectedPokemon}
              onClick={() => setBestBuddy(true)}
            >
              <FaStar aria-hidden="true" />
              Best Buddy 51
            </button>
          </div>
        </section>

        <section className="pvp-iv-result" aria-live="polite">
          {!result || !selectedPokemon ? (
            <div className="pvp-iv-empty">
              <strong>Select a Pokémon</strong>
              <span>
                Enter its appraisal IVs to compare all 4,096 possible spreads.
              </span>
            </div>
          ) : (
            <>
              <header>
                <div>
                  <small>{formatTopPercent(result.selected.rank, result.total)}</small>
                  <strong>#{result.selected.rank}</strong>
                  <span>of {result.total.toLocaleString()}</span>
                </div>
                <span>
                  <small>Stat product</small>
                  <strong>{result.selected.statProductPercent.toFixed(2)}%</strong>
                </span>
              </header>

              <div className="pvp-iv-result-stats">
                <span>
                  <small>Level</small>
                  <strong>{formatLevel(result.selected.level)}</strong>
                </span>
                <span>
                  <small>CP</small>
                  <strong>{result.selected.cp.toLocaleString()}</strong>
                </span>
                <span>
                  <small>Attack</small>
                  <strong>{result.selected.battleAttack.toFixed(1)}</strong>
                </span>
                <span>
                  <small>Defense</small>
                  <strong>{result.selected.battleDefense.toFixed(1)}</strong>
                </span>
                <span>
                  <small>HP</small>
                  <strong>{result.selected.battleHp}</strong>
                </span>
              </div>

              <div className="pvp-iv-best">
                <span>
                  <small>Rank 1 spread</small>
                  <strong>
                    {result.best.attack}/{result.best.defense}/{result.best.stamina}
                  </strong>
                </span>
                <span>
                  Level {formatLevel(result.best.level)} · CP{' '}
                  {result.best.cp.toLocaleString()}
                </span>
              </div>

              <div className="pvp-iv-nearby">
                <strong>Nearby ranks</strong>
                <div>
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>IVs</th>
                        <th>Level</th>
                        <th>CP</th>
                        <th>Product</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.nearby.map((spread) => (
                        <SpreadRow
                          key={`${spread.attack}-${spread.defense}-${spread.stamina}`}
                          spread={spread}
                          selected={spread.rank === result.selected.rank}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
};

export default PvpIvRank;
