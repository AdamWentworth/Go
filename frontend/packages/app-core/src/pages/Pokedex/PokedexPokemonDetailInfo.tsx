import { Fragment } from 'react';

import { getTypeIconPath } from '@/utils/imageHelpers';

import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

import {
  PokedexDetailPokemonImage,
  type PokedexDetailGender,
} from './PokedexDetailPokemonImage';
import {
  formatNumber,
  getDexNumber,
  getFusionId,
  getSpeciesName,
  getTypeChips,
  getVariantCategory,
} from './pokedexPokemonDetailModel';

const TYPE_NAMES = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
] as const;

const ATTACK_TYPE_CHART: Record<
  string,
  {
    strong: string[];
    resisted: string[];
  }
> = {
  bug: {
    strong: ['grass', 'psychic', 'dark'],
    resisted: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
  },
  dark: {
    strong: ['psychic', 'ghost'],
    resisted: ['fighting', 'dark', 'fairy'],
  },
  dragon: {
    strong: ['dragon'],
    resisted: ['steel', 'fairy'],
  },
  electric: {
    strong: ['water', 'flying'],
    resisted: ['electric', 'grass', 'dragon', 'ground'],
  },
  fairy: {
    strong: ['fighting', 'dragon', 'dark'],
    resisted: ['fire', 'poison', 'steel'],
  },
  fighting: {
    strong: ['normal', 'ice', 'rock', 'dark', 'steel'],
    resisted: ['poison', 'flying', 'psychic', 'bug', 'ghost', 'fairy'],
  },
  fire: {
    strong: ['grass', 'ice', 'bug', 'steel'],
    resisted: ['fire', 'water', 'rock', 'dragon'],
  },
  flying: {
    strong: ['grass', 'fighting', 'bug'],
    resisted: ['electric', 'rock', 'steel'],
  },
  ghost: {
    strong: ['psychic', 'ghost'],
    resisted: ['dark', 'normal'],
  },
  grass: {
    strong: ['water', 'ground', 'rock'],
    resisted: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'],
  },
  ground: {
    strong: ['fire', 'electric', 'poison', 'rock', 'steel'],
    resisted: ['grass', 'bug', 'flying'],
  },
  ice: {
    strong: ['grass', 'ground', 'flying', 'dragon'],
    resisted: ['fire', 'water', 'ice', 'steel'],
  },
  normal: {
    strong: [],
    resisted: ['rock', 'ghost', 'steel'],
  },
  poison: {
    strong: ['grass', 'fairy'],
    resisted: ['poison', 'ground', 'rock', 'ghost', 'steel'],
  },
  psychic: {
    strong: ['fighting', 'poison'],
    resisted: ['psychic', 'steel', 'dark'],
  },
  rock: {
    strong: ['fire', 'ice', 'flying', 'bug'],
    resisted: ['fighting', 'ground', 'steel'],
  },
  steel: {
    strong: ['ice', 'rock', 'fairy'],
    resisted: ['fire', 'water', 'electric', 'steel'],
  },
  water: {
    strong: ['fire', 'ground', 'rock'],
    resisted: ['water', 'grass', 'dragon'],
  },
};

function toEvolutionIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
}

function getEvolutionIds(
  pokemon: PokemonVariant,
  key: 'evolves_from' | 'evolves_to',
): number[] {
  const pokemonWithEvolutionData = pokemon as PokemonVariant & {
    evolutionData?: { evolves_from?: unknown; evolves_to?: unknown };
    evolves_from?: unknown;
    evolves_to?: unknown;
  };

  return toEvolutionIds(pokemonWithEvolutionData[key] ?? pokemonWithEvolutionData.evolutionData?.[key]);
}

function getEvolutionLine(pokemon: PokemonVariant, variants: PokemonVariant[]): PokemonVariant[] {
  const byPokemonId = new Map<number, PokemonVariant>();
  variants.forEach((variant) => {
    if (getVariantCategory(variant) !== 'pokemon') return;
    const pokemonId = Number(variant.pokemon_id);
    if (!Number.isFinite(pokemonId)) return;
    if (!byPokemonId.has(pokemonId)) byPokemonId.set(pokemonId, variant);
  });

  const seedId = Number(pokemon.pokemon_id);
  const seed = byPokemonId.get(seedId) ?? pokemon;
  if (!Number.isFinite(seedId)) return [seed];

  const adjacency = new Map<number, Set<number>>();
  const connect = (from: number, to: number) => {
    if (!byPokemonId.has(from) || !byPokemonId.has(to)) return;
    if (!adjacency.has(from)) adjacency.set(from, new Set());
    if (!adjacency.has(to)) adjacency.set(to, new Set());
    adjacency.get(from)?.add(to);
    adjacency.get(to)?.add(from);
  };

  for (const variant of byPokemonId.values()) {
    const pokemonId = Number(variant.pokemon_id);
    for (const linkedId of [
      ...getEvolutionIds(variant, 'evolves_from'),
      ...getEvolutionIds(variant, 'evolves_to'),
    ]) {
      connect(pokemonId, linkedId);
    }
  }

  const familyIds = new Set<number>();
  const stack = [seedId];
  while (stack.length > 0) {
    const currentId = stack.pop() as number;
    if (familyIds.has(currentId)) continue;
    familyIds.add(currentId);

    adjacency.get(currentId)?.forEach((nextId) => {
      if (!familyIds.has(nextId)) stack.push(nextId);
    });
  }

  const depthCache = new Map<number, number>();
  const getDepth = (variant: PokemonVariant, trail = new Set<number>()): number => {
    const pokemonId = Number(variant.pokemon_id);
    const cached = depthCache.get(pokemonId);
    if (cached !== undefined) return cached;

    const parents = getEvolutionIds(variant, 'evolves_from').filter(
      (parentId) => byPokemonId.has(parentId) && !trail.has(parentId),
    );
    if (parents.length === 0) {
      depthCache.set(pokemonId, 0);
      return 0;
    }

    const nextTrail = new Set(trail);
    nextTrail.add(pokemonId);
    const depth =
      1 +
      Math.min(
        ...parents.map((parentId) => getDepth(byPokemonId.get(parentId) as PokemonVariant, nextTrail)),
      );
    depthCache.set(pokemonId, depth);
    return depth;
  };

  return [...familyIds]
    .map((pokemonId) => byPokemonId.get(pokemonId))
    .filter((variant): variant is PokemonVariant => Boolean(variant))
    .sort(
      (first, second) =>
        getDepth(first) - getDepth(second) ||
        (getDexNumber(first) ?? first.pokemon_id) - (getDexNumber(second) ?? second.pokemon_id),
    );
}

function getMovePool(pokemon: PokemonVariant): Move[] {
  const fusionId = getFusionId(pokemon);

  return (pokemon.moves ?? []).filter((move) =>
    typeof move.fusion_id === 'number' && Number.isFinite(fusionId)
      ? move.fusion_id === fusionId
      : true,
  );
}

function getBattleMoves(pokemon: PokemonVariant): { fast: Move[]; charged: Move[] } {
  const moves = getMovePool(pokemon);
  return {
    fast: moves.filter((move) => move.is_fast === 1),
    charged: moves.filter((move) => move.is_fast === 0),
  };
}

function getMoveTypeIcon(move: Move): string {
  return getTypeIconPath(move.type_name || move.type);
}

function getMoveEnergyBarCount(move: Move): number {
  const energy = Math.abs(Number(move.pvp_energy || move.raid_energy || 0));
  if (energy >= 100) return 1;
  if (energy >= 50) return 2;
  if (energy > 0) return 3;
  return 0;
}

function getDefensiveTypeEffectiveness(pokemon: PokemonVariant): {
  weakTo: string[];
  resistantTo: string[];
} {
  const defendingTypes = getTypeChips(pokemon).map((type) => type.label.toLowerCase());
  const weakTo: string[] = [];
  const resistantTo: string[] = [];

  TYPE_NAMES.forEach((typeName) => {
    const attackType = typeName.toLowerCase();
    const chart = ATTACK_TYPE_CHART[attackType];
    if (!chart) return;

    const multiplier = defendingTypes.reduce((current, defendingType) => {
      if (chart.strong.includes(defendingType)) return current * 1.6;
      if (chart.resisted.includes(defendingType)) return current * 0.625;
      return current;
    }, 1);

    if (multiplier > 1.01) {
      weakTo.push(typeName);
    } else if (multiplier < 0.99) {
      resistantTo.push(typeName);
    }
  });

  return { weakTo, resistantTo };
}

function TypeIconPill({ type }: { type: string }) {
  return (
    <span className="pokedex-pokemon-detail__type-icon-pill" title={type}>
      <img src={getTypeIconPath(type)} alt="" draggable={false} />
      <span>{type}</span>
    </span>
  );
}

function getSizeIcon(size: string, metricIcon: string): string {
  if (size === 'XXS' || size === 'XS') return '/images/xxs.png';
  if (size === 'XL' || size === 'XXL') return '/images/xxl.png';
  return metricIcon;
}

function PokedexSizeRangeCard({
  title,
  icon,
  unit,
  average,
  xxs,
  xs,
  xl,
  xxl,
}: {
  title: string;
  icon: string;
  unit: string;
  average: number | string | null | undefined;
  xxs: number | string | null | undefined;
  xs: number | string | null | undefined;
  xl: number | string | null | undefined;
  xxl: number | string | null | undefined;
}) {
  const formatWithUnit = (value: number | string | null | undefined) => `${formatNumber(value)} ${unit}`;
  const bands = [
    { label: 'XXS', range: `< ${formatWithUnit(xxs)}` },
    { label: 'XS', range: `>= ${formatWithUnit(xxs)} and < ${formatWithUnit(xs)}` },
    { label: 'Normal', range: `${formatWithUnit(xs)} - ${formatWithUnit(xl)}` },
    { label: 'XL', range: `> ${formatWithUnit(xl)} and <= ${formatWithUnit(xxl)}` },
    { label: 'XXL', range: `> ${formatWithUnit(xxl)}` },
  ];

  return (
    <article className="pokedex-pokemon-detail__size-range-card">
      <header className="pokedex-pokemon-detail__size-range-header">
        <span className="pokedex-pokemon-detail__size-range-icon">
          <img src={icon} alt="" draggable={false} />
        </span>
        <div>
          <h4>{title}</h4>
          <p>Normal average {formatWithUnit(average)}</p>
        </div>
      </header>
      <div className="pokedex-pokemon-detail__size-average">
        <span>Average</span>
        <strong>{formatWithUnit(average)}</strong>
      </div>
      <div className="pokedex-pokemon-detail__size-band-list">
        {bands.map((band) => (
          <div className="pokedex-pokemon-detail__size-band" key={`${title}-${band.label}`}>
            <span className="pokedex-pokemon-detail__size-band-icon">
              <img src={getSizeIcon(band.label, icon)} alt="" draggable={false} />
            </span>
            <strong>{band.label}</strong>
            <span>{band.range}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function PokedexBaseStatsCard({ pokemon }: { pokemon: PokemonVariant }) {
  const stats = [
    { label: 'Attack', value: pokemon.attack, max: 450 },
    { label: 'Defense', value: pokemon.defense, max: 400 },
    { label: 'Stamina', value: pokemon.stamina, max: 500 },
  ];

  return (
    <article className="pokedex-pokemon-detail__base-stat-card">
      <div className="pokedex-pokemon-detail__base-stat-list">
        {stats.map((stat) => (
          <div className="pokedex-pokemon-detail__base-stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <span className="pokedex-pokemon-detail__base-stat-track">
              <span style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }} />
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function PokedexMaxCpCard({ pokemon }: { pokemon: PokemonVariant }) {
  return (
    <article className="pokedex-pokemon-detail__cp-card">
      <h4>Max CP</h4>
      <div className="pokedex-pokemon-detail__cp-values">
        <div>
          <span>Level 40</span>
          <strong>{pokemon.cp40 || 'Unknown'}</strong>
        </div>
        <div>
          <span>Level 50</span>
          <strong>{pokemon.cp50 || 'Unknown'}</strong>
        </div>
      </div>
    </article>
  );
}

export function PokedexInfoTab({
  pokemon,
  variants,
  gender,
  onShowMore,
}: {
  pokemon: PokemonVariant;
  variants: PokemonVariant[];
  gender?: PokedexDetailGender;
  onShowMore: () => void;
}) {
  const evolutionLine = getEvolutionLine(pokemon, variants);
  const sizes = pokemon.sizes;

  return (
    <section className="pokedex-pokemon-detail__info-tab">
      <section className="pokedex-pokemon-detail__stat-panel">
        <h3>Base stats</h3>
        <PokedexBaseStatsCard pokemon={pokemon} />
        <PokedexMaxCpCard pokemon={pokemon} />
      </section>

      {sizes ? (
        <section className="pokedex-pokemon-detail__stat-panel">
          <h3>Size ranges</h3>
          <div className="pokedex-pokemon-detail__size-range-grid">
            <PokedexSizeRangeCard
              title="Weight"
              icon="/images/weight.png"
              unit="kg"
              average={sizes.pokedex_weight}
              xxs={sizes.weight_xxs_threshold}
              xs={sizes.weight_xs_threshold}
              xl={sizes.weight_xl_threshold}
              xxl={sizes.weight_xxl_threshold}
            />
            <PokedexSizeRangeCard
              title="Height"
              icon="/images/height.png"
              unit="m"
              average={sizes.pokedex_height}
              xxs={sizes.height_xxs_threshold}
              xs={sizes.height_xs_threshold}
              xl={sizes.height_xl_threshold}
              xxl={sizes.height_xxl_threshold}
            />
          </div>
        </section>
      ) : null}

      <section className="pokedex-pokemon-detail__evolution-panel">
        <h3>Evolution</h3>
        <div className="pokedex-pokemon-detail__evolution-line">
          {evolutionLine.map((evolution, index) => (
            <Fragment key={evolution.variant_id}>
              {index > 0 ? <span className="pokedex-pokemon-detail__evolution-arrow">→</span> : null}
              <div className="pokedex-pokemon-detail__evolution-item">
                <PokedexDetailPokemonImage
                  className="pokedex-pokemon-detail__evolution-image"
                  pokemon={evolution}
                  gender={gender}
                />
                <span>{getSpeciesName(evolution)}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      <button className="pokedex-pokemon-detail__see-all" type="button" onClick={onShowMore}>
        See all {getSpeciesName(pokemon)}
      </button>
    </section>
  );
}

function PokedexMoveTable({ title, moves }: { title: string; moves: Move[] }) {
  return (
    <section className="pokedex-pokemon-detail__move-panel">
      <header>
        <h3>{title}</h3>
        <span>Damage</span>
      </header>
      {moves.length > 0 ? (
        <div className="pokedex-pokemon-detail__move-list">
          {moves.map((move) => {
            const barCount = getMoveEnergyBarCount(move);

            return (
              <div className="pokedex-pokemon-detail__move-row" key={`${title}-${move.move_id}`}>
                <img src={getMoveTypeIcon(move)} alt="" draggable={false} />
                <span className="pokedex-pokemon-detail__move-name">
                  {move.name}
                  {move.legacy ? <strong>*</strong> : null}
                </span>
                {barCount > 0 ? (
                  <span className="pokedex-pokemon-detail__move-bars" aria-label={`${barCount} energy bars`}>
                    {Array.from({ length: barCount }).map((_, index) => (
                      <span key={index} />
                    ))}
                  </span>
                ) : null}
                <span className="pokedex-pokemon-detail__move-damage">
                  <span>{move.pvp_power}</span>
                  <small>PvP</small>
                  <span>{move.raid_power}</span>
                  <small>Raid</small>
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="pokedex-pokemon-detail__battle-empty">No {title.toLowerCase()} listed.</p>
      )}
    </section>
  );
}

export function PokedexBattleTab({ pokemon }: { pokemon: PokemonVariant }) {
  const { weakTo, resistantTo } = getDefensiveTypeEffectiveness(pokemon);
  const moves = getBattleMoves(pokemon);

  return (
    <section className="pokedex-pokemon-detail__battle-tab">
      <section className="pokedex-pokemon-detail__effectiveness-panel">
        <h3>Type effectiveness</h3>
        <div className="pokedex-pokemon-detail__own-types">
          {getTypeChips(pokemon).map((type) => (
            <TypeIconPill key={type.label} type={type.label} />
          ))}
        </div>
        <div className="pokedex-pokemon-detail__effectiveness-grid">
          <div>
            <h4>Resistant to</h4>
            <div className="pokedex-pokemon-detail__type-icon-row">
              {resistantTo.map((type) => (
                <TypeIconPill key={type} type={type} />
              ))}
            </div>
          </div>
          <div>
            <h4>Weak to</h4>
            <div className="pokedex-pokemon-detail__type-icon-row">
              {weakTo.map((type) => (
                <TypeIconPill key={type} type={type} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <PokedexMoveTable title="Fast attack" moves={moves.fast} />
      <PokedexMoveTable title="Charged attack" moves={moves.charged} />
    </section>
  );
}
