// PokemonCard.tsx
import { useEffect, useState, memo, useRef, useMemo } from 'react';
import CP from '@/components/pokemonComponents/CP';
import PokemonImagePresentation from './PokemonImagePresentation';
import './PokemonCard.css';
import { usePokemonCardTouchHandlers } from './hooks/usePokemonCardTouchHandlers';
import { usePokemonAttributes } from './hooks/usePokemonAttributes';
import { usePokemonImage } from './hooks/usePokemonImage';
import SelectChip from './SelectChip';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import { resolveFusionBackgroundPool } from '@/pages/Pokemon/features/instances/utils/resolveFusionBackgroundPool';
import { getCrownFormLabel, resolveActiveCrownForm } from '@/utils/crownHelpers';
import {
  collectInstanceRefCandidates,
  findInstanceByRefs,
  getPokemonCardCpValue,
  getPokemonCardDisplayName,
  getPokemonCardHighlightKey,
  getPokemonCardOwnershipClass,
  resolvePokemonCardActiveFusionEntry,
  resolvePokemonCardActiveMegaEvolution,
  resolvePokemonCardLocationBackground,
  resolvePokemonCardTypeData,
  shouldDisplayPokemonCardLuckyBackdrop,
} from './pokemonCardState';

import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { VariantBackground } from '@/types/pokemonSubTypes';

interface Props {
  pokemon: PokemonVariant & {
    instanceData?: Partial<PokemonInstance>;
    currentImage: string;
  };
  onSelect: () => void;
  onSwipe?: (direction: 'left' | 'right') => void;
  toggleCardHighlight: (key: string) => void;
  setIsFastSelectEnabled: (enabled: boolean) => void;
  isEditable: boolean;
  isFastSelectEnabled: boolean;
  isHighlighted: boolean;
  tagFilter: string;
  sortType: string;
  variantByPokemonId: Map<number, { backgrounds?: VariantBackground[] }>;
}

const PokemonCard = memo(({
  pokemon,
  onSelect,
  onSwipe,
  toggleCardHighlight,
  setIsFastSelectEnabled,
  isEditable,
  isFastSelectEnabled,
  isHighlighted,
  tagFilter = '',
  sortType,
  variantByPokemonId,
}: Props) => {
  const [shouldJiggle, setShouldJiggle] = useState(false);
  const prevIsHighlighted = useRef(isHighlighted);
  const {
    isDisabled, isFemale, isMega, megaForm,
    isFused, fusionForm, isCrown, isPurified, isDynamax, isGigantamax
  } = usePokemonAttributes(pokemon);
  const activeCrownForm = useMemo(
    () => resolveActiveCrownForm(pokemon.crownForms, undefined),
    [pokemon.crownForms],
  );
  const activeMegaEvolution = useMemo(() => {
    return resolvePokemonCardActiveMegaEvolution({
      isMega,
      megaForm,
      megaEvolutions: pokemon.megaEvolutions,
    });
  }, [isMega, megaForm, pokemon.megaEvolutions]);
  const activeFusionEntry = useMemo(() => {
    const storedFusion = pokemon.instanceData?.fusion as Record<string, unknown> | null | undefined;
    return resolvePokemonCardActiveFusionEntry({
      isFused,
      fusionForm,
      fusionEntries: pokemon.fusion,
      storedFusion,
    });
  }, [fusionForm, isFused, pokemon.fusion, pokemon.instanceData?.fusion]);
  const displayTypeData = useMemo(() => {
    return resolvePokemonCardTypeData({
      pokemon,
      isFused,
      activeFusionEntry,
      isCrown,
      activeCrownForm,
      isMega,
      activeMegaEvolution,
    });
  }, [
    activeFusionEntry,
    activeCrownForm,
    activeMegaEvolution,
    isFused,
    isCrown,
    isMega,
    pokemon,
  ]);
  const fusedPartnerInstance = useInstancesStore((state) => {
    const fusedWithKey =
      typeof pokemon.instanceData?.fused_with === 'string' ? pokemon.instanceData.fused_with : null;
    if (!fusedWithKey) return null;

    const refs = collectInstanceRefCandidates(fusedWithKey);
    if (refs.length === 0) return null;

    const fromOwned = findInstanceByRefs(state.instances, refs);
    if (fromOwned) return fromOwned;
    return findInstanceByRefs(state.foreignInstances, refs);
  });
  const resolvedFusionBackgrounds = useMemo(
    () =>
      resolveFusionBackgroundPool({
        pokemon,
        fusion: {
          is_fused: Boolean(isFused),
          fusion_form: fusionForm ?? null,
          storedFusionObject:
            pokemon.instanceData && typeof pokemon.instanceData.fusion === 'object'
              ? (pokemon.instanceData.fusion as Record<string, unknown>)
              : null,
        },
      }),
    [fusionForm, isFused, pokemon],
  );

  useEffect(() => {
    if (prevIsHighlighted.current !== isHighlighted) {
      setShouldJiggle(true);
      const timer = setTimeout(() => setShouldJiggle(false), 300);
      return () => clearTimeout(timer);
    }
    prevIsHighlighted.current = isHighlighted;
  }, [isHighlighted]);

  const currentImage = usePokemonImage({
    pokemon,
    isDisabled,
    isFemale,
    isMega,
    megaForm,
    isFused,
    fusionForm,
    isCrown,
    crownForm: getCrownFormLabel(activeCrownForm) ?? undefined,
    isPurified,
    isGigantamax,
  });

  const displayName = getPokemonCardDisplayName({
    pokemon,
    isFused,
    fusionForm,
    isMega,
    megaForm,
    isCrown,
    activeCrownForm,
  });

  // Prefer instance UUID, fallback to variant key
  const highlightKey = getPokemonCardHighlightKey(pokemon);

  const { handleTouchStart, handleTouchMove, handleTouchEnd, handleClick } =
    usePokemonCardTouchHandlers({
      onSelect,
      onSwipe,
      toggleCardHighlight,
      setIsFastSelectEnabled,
      isEditable,
      isFastSelectEnabled,
      isDisabled,
      selectKey: highlightKey,
    });

  const ownershipClass = getPokemonCardOwnershipClass(tagFilter);
  const shouldDisplayLuckyBackdrop = shouldDisplayPokemonCardLuckyBackdrop(
    tagFilter,
    pokemon.instanceData,
  );

  const locationBackground = useMemo(() => {
    return resolvePokemonCardLocationBackground({
      pokemon,
      variantByPokemonId,
      resolvedFusionBackgrounds,
      isFused,
      fusedPartnerInstance,
      fusionForm,
    });
  }, [
    fusedPartnerInstance,
    fusionForm,
    isFused,
    pokemon,
    resolvedFusionBackgrounds,
    variantByPokemonId,
  ]);

  const cpValue = getPokemonCardCpValue({ tagFilter, sortType, pokemon });

  const cardClass = `
    pokemon-card
    ${ownershipClass}
    ${isHighlighted ? 'highlighted' : ''}
    ${isDisabled ? 'disabled-card' : ''}
    ${shouldJiggle ? 'jiggle' : ''}
  `.trim();

  // Modifier-click toggles selection on desktop; normal click opens details
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      e.preventDefault();
      e.stopPropagation();
      if (isEditable) {
        setIsFastSelectEnabled(true);
        toggleCardHighlight(highlightKey);
      }
      return;
    }
    handleClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      if (isEditable) {
        setIsFastSelectEnabled(true);
        toggleCardHighlight(highlightKey);
      }
    } else if (e.key === 'Enter') {
      onSelect();
    }
  };

  return (
    <div
      className={`${cardClass} ${isFastSelectEnabled ? 'hide-select-chip' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View ${pokemon.name} details`}
    >
      {/* Select chip (desktop hover only before fast-select is enabled) */}
      {isEditable && (
        <SelectChip
          selected={isHighlighted}
          delayMs={300}
          onToggle={() => {
            // enter fast-select only when selecting via chip
            if (!isHighlighted && !isFastSelectEnabled) {
              setIsFastSelectEnabled(true);
            }
            toggleCardHighlight(highlightKey);
          }}
        />
      )}

      <div className="cp-container">
        <CP cp={cpValue} editMode={false} onCPChange={() => {}} />
      </div>

      <div className="fav-container">
        {pokemon.instanceData?.favorite && (
          <img
            src="/images/fav_pressed.png"
            alt="Favorite"
            className="favorite-icon"
            draggable={false}
          />
        )}
      </div>

      <PokemonImagePresentation
        imageUrl={currentImage}
        altText={pokemon.name}
        locationBackground={locationBackground}
        shouldDisplayLuckyBackdrop={shouldDisplayLuckyBackdrop}
        isDynamax={isDynamax}
        isGigantamax={isGigantamax}
        isPurified={isPurified}
      />

      <p>#{pokemon.pokedex_number}</p>

      <div className="type-icons">
        {displayTypeData.type_1_icon && displayTypeData.type1_name && (
          <img
            src={displayTypeData.type_1_icon}
            alt={displayTypeData.type1_name}
            loading="lazy"
            draggable={false}
          />
        )}
        {displayTypeData.type_2_icon && displayTypeData.type2_name && (
          <img
            src={displayTypeData.type_2_icon}
            alt={displayTypeData.type2_name}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>

      <h2 className="pokemon-name-display">{displayName}</h2>
    </div>
  );
});

export default PokemonCard;
