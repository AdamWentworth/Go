// PokemonCard.tsx
import { useEffect, useState, memo, useRef } from 'react';
import CP from '@/components/pokemonComponents/CP';
import PokemonImagePresentation from './PokemonImagePresentation';
import './PokemonCard.css';
import { usePokemonCardTouchHandlers } from './hooks/usePokemonCardTouchHandlers';
import { usePokemonAttributes } from './hooks/usePokemonAttributes';
import { usePokemonImage } from './hooks/usePokemonImage';
import SelectChip from './SelectChip';

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
    isFused, fusionForm, isPurified, isDynamax, isGigantamax
  } = usePokemonAttributes(pokemon);

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
    isPurified
  });

  const getDisplayName = () => {
    if (pokemon.instanceData?.nickname) return pokemon.instanceData.nickname;

    let name = pokemon.name;
    if (isFused && fusionForm) {
      name = pokemon.instanceData?.shiny ? `Shiny ${fusionForm}` : fusionForm;
    }
    if (isMega && megaForm) {
      name = pokemon.instanceData?.shiny
        ? `Shiny Mega ${name} ${pokemon.instanceData?.mega_form}`
        : `Mega ${name} ${pokemon.instanceData?.mega_form}`;
    }
    return name;
  };

  // Prefer instance UUID, fallback to variant key
  const highlightKey = pokemon.instanceData?.instance_id ?? pokemon.variant_id;

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

  const getOwnershipClass = () => {
    const f = (tagFilter || '').toLowerCase();
    switch (f) {
      case 'caught': return 'caught';
      case 'trade': return 'trade';
      case 'wanted': return 'wanted';
      case 'missing': return 'missing';
      default: return '';
    }
  };

  const shouldDisplayLuckyBackdrop =
    (tagFilter.toLowerCase() === 'wanted' && pokemon.instanceData?.pref_lucky) ||
    pokemon.instanceData?.lucky;

  let locationBackground: VariantBackground | null = null;
  if (pokemon.instanceData?.location_card) {
    const variant = variantByPokemonId.get(pokemon.pokemon_id);
    const locationCardId = Number(pokemon.instanceData?.location_card);
    if (!isNaN(locationCardId)) {
      locationBackground = variant?.backgrounds?.find((bg) => bg.background_id === locationCardId) || null;
    }
  }

  const cpValue =
    tagFilter !== ''
      ? (pokemon.instanceData?.cp ?? '')
      : (sortType === 'combatPower' && pokemon.cp50 != null ? pokemon.cp50 : '');

  const cardClass = `
    pokemon-card
    ${getOwnershipClass()}
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
        {pokemon.type_1_icon && (
          <img
            src={pokemon.type_1_icon}
            alt={pokemon.type1_name}
            loading="lazy"
            draggable={false}
          />
        )}
        {pokemon.type_2_icon && (
          <img
            src={pokemon.type_2_icon}
            alt={pokemon.type2_name}
            loading="lazy"
            draggable={false}
          />
        )}
      </div>

      <h2 className="pokemon-name-display">{getDisplayName()}</h2>
    </div>
  );
});

export default PokemonCard;
