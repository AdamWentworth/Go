// EvolutionShortcut.tsx

import React from 'react';
import './EvolutionShortcut.css';

// Types
import type { PokemonVariant, AllVariants } from '@/types/pokemonVariants';
import type { Fusion, MegaEvolution } from '@/types/pokemonSubTypes';

export interface EvolutionShortcutProps {
  evolvesFrom?: number[];
  evolvesTo?: number[];
  megaEvolutions?: MegaEvolution[];
  fusionEvolutions?: Fusion[];
  allPokemonData: AllVariants;
  setSelectedPokemon: (p: PokemonVariant & { fusionInfo?: Fusion }) => void;
  currentPokemon: PokemonVariant & { fusionInfo?: Fusion };
}

const EvolutionShortcut: React.FC<EvolutionShortcutProps> = ({
  evolvesFrom = [],
  evolvesTo = [],
  megaEvolutions = [],
  fusionEvolutions = [],
  allPokemonData,
  setSelectedPokemon,
  currentPokemon,
}) => {
  const getBaseName = (name: string): string =>
    name.substring(name.lastIndexOf(' ') + 1);

  const findDefault = (id: number): PokemonVariant | undefined =>
    allPokemonData.find(
      p => p.pokemon_id === id && p.variantType === 'default'
    );

  const onEvolutionClick = (pokemonId: number, form?: string): void => {
    const candidates = form
      ? allPokemonData.filter(
          p => p.pokemon_id === pokemonId && p.variantType?.includes(form)
        )
      : allPokemonData.filter(
          p => p.pokemon_id === pokemonId && p.variantType === 'default'
        );
    const selection = candidates[0];
    if (selection) setSelectedPokemon(selection as EvolutionShortcutProps['currentPokemon']);
    else console.warn('[EvolutionShortcut] evolution not found', pokemonId, form);
  };

  const onMegaClick = (mega: MegaEvolution): void => {
    // Determine possible variantType(s) for this mega evolution
    const variantTypes: string[] = [];
    if (mega.primal) {
      variantTypes.push('primal');
    }
    if (mega.form) {
      // e.g. form = 'X' or 'Y'
      variantTypes.push(`mega${mega.form.toLowerCase()}`);
    } else {
      variantTypes.push('mega');
    }

    // Find the matching variant in allPokemonData
    const sel = allPokemonData.find(
      p => p.pokemon_id === currentPokemon.pokemon_id && variantTypes.includes(p.variantType)
    );
    if (sel) {
      setSelectedPokemon(sel as EvolutionShortcutProps['currentPokemon']);
    } else {
      console.warn(
        '[EvolutionShortcut] mega evolution not found',
        variantTypes
      );
    }
  };

  const onFusionClick = (fusion: Fusion): void => {
    if (fusion.fusion_id == null) return;
    const variantType = `fusion_${fusion.fusion_id}`;
    const sel = allPokemonData.find(
      p =>
        p.pokemon_id === fusion.base_pokemon_id1 && p.variantType === variantType
    );
    if (sel) {
      setSelectedPokemon({ ...(sel as PokemonVariant), fusionInfo: fusion });
    } else {
      console.warn('[EvolutionShortcut] fusion not found', fusion.fusion_id);
    }
  };

  const onRevertToBaseClick = (): void => {
    const base = findDefault(currentPokemon.pokemon_id);
    if (base) setSelectedPokemon(base as EvolutionShortcutProps['currentPokemon']);
    else console.warn(
      '[EvolutionShortcut] base form not found',
      currentPokemon.pokemon_id
    );
  };

  const isMega = currentPokemon.variantType?.includes('mega');
  const isPrimal = currentPokemon.variantType?.includes('primal');
  const isFusion = currentPokemon.variantType?.startsWith('fusion');

  // Compute fusionInfo if missing
  let computedFusionInfo = currentPokemon.fusionInfo;
  if (isFusion && !computedFusionInfo) {
    const parts = currentPokemon.variantType?.split('_');
    const id = parts?.[1];
    if (id) {
      computedFusionInfo = fusionEvolutions.find(
        f => f.fusion_id?.toString() === id
      );
    }
  }

  const renderList = (ids: number[], css: string) => (
    <div className={`evolution-list ${css}`}>
      {ids.map(id => {
        const variant = findDefault(id);
        return variant ? (
          <div
            key={id}
            className="evolution-item"
            onClick={() => onEvolutionClick(id)}
          >
            <img
              src={`/images/default/pokemon_${id}.png`}
              alt={getBaseName(variant.name)}
            />
            <span>{getBaseName(variant.name)}</span>
          </div>
        ) : null;
      })}
    </div>
  );

  const renderMega = (): React.ReactNode => (
    <div className="evolution-list evolves-to mega-evolutions">
      {megaEvolutions.map(m => {
        const prefix = m.primal ? 'Primal' : 'Mega';
        return (
          <div
            key={m.id}
            className="evolution-item"
            onClick={() => onMegaClick(m)}
          >
            <img
              src={m.image_url || `/images/default/pokemon_${m.id}.png`}
              alt={`${prefix} ${currentPokemon.name}${m.form ? ` ${m.form}` : ''}`}
            />
            <span>
              {`${prefix} ${currentPokemon.name}${m.form ? ` ${m.form}` : ''}`}
            </span>
          </div>
        );
      })}
    </div>
  );

  const renderFusion = (): React.ReactNode => (
    <div className="evolution-list fusion-evolutions">
      {fusionEvolutions
        .filter(f => f.fusion_id != null)
        .map(f => (
          <div
            key={f.fusion_id!}
            className="evolution-item"
            onClick={() => onFusionClick(f)}
          >
            <img
              src={
                f.image_url ||
                `/images/default/pokemon_${f.base_pokemon_id1}_${f.base_pokemon_id2}.png`
              }
              alt={f.name}
            />
            <span>{f.name}</span>
          </div>
        ))}
    </div>
  );

  const renderRevert = (): React.ReactNode => (
    <div className="evolution-list revert-to-base">
      <div className="evolution-item" onClick={onRevertToBaseClick}>
        <img
          src={`/images/default/pokemon_${currentPokemon.pokemon_id}.png`}
          alt={getBaseName(currentPokemon.name)}
        />
        <span>{getBaseName(currentPokemon.name)}</span>
      </div>
      {isFusion && computedFusionInfo?.base_pokemon_id2 && (
        <div className="evolution-item" onClick={onRevertToBaseClick}>
          <img
            src={`/images/default/pokemon_${computedFusionInfo.base_pokemon_id2}.png`}
            alt={getBaseName(currentPokemon.name)}
          />
          <span>{getBaseName(currentPokemon.name)}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="evolution-shortcut">
      {!isMega && renderList(evolvesFrom, 'evolves-from')}
      {!isMega && renderList(evolvesTo, 'evolves-to')}
      {!isMega && megaEvolutions.length > 0 && renderMega()}
      {!isFusion && fusionEvolutions.length > 0 && renderFusion()}
      {(isMega || isPrimal || isFusion) && renderRevert()}
    </div>
  );
};

export default React.memo(EvolutionShortcut);
