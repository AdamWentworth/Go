import { useEffect, useState, memo, useRef } from 'react';
import CP from '@/components/pokemonComponents/CP';
import PokemonImagePresentation from './PokemonImagePresentation';
import './PokemonCard.css';
import { usePokemonCardTouchHandlers } from './hooks/usePokemonCardTouchHandlers';
import { usePokemonAttributes } from './hooks/usePokemonAttributes';
import { usePokemonImage } from './hooks/usePokemonImage';

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
  variants: { pokemon_id: number; backgrounds: VariantBackground[] }[];
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
  tagFilter ='',
  sortType,
  variants,
}: Props) => {
  const [shouldJiggle, setShouldJiggle] = useState(false);
  const prevIsHighlighted = useRef(isHighlighted);
  const {
    isDisabled,
    isFemale,
    isMega,
    megaForm,
    isFused,
    fusionForm,
    isPurified,
    isDynamax,
    isGigantamax
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
    if (pokemon.instanceData?.nickname) {
      return pokemon.instanceData.nickname;
    }
  
    let name = pokemon.name;
  
    if (isFused && fusionForm) {
      name = pokemon.instanceData?.shiny
        ? `Shiny ${fusionForm}`
        : fusionForm;
    }
  
    if (isMega && megaForm) {
      name = pokemon.instanceData?.shiny
        ? `Shiny Mega ${name} ${pokemon.instanceData?.mega_form}`
        : `Mega ${name} ${pokemon.instanceData?.mega_form}`;
    }
  
    return name;
  };      

  // inside PokemonCard component, before calling the hook
  const highlightKey =
    pokemon.instanceData?.instance_id ?? // prefer instance UUID
    pokemon.variant_id;                  // fallback to variant key

  const {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClick
  } = usePokemonCardTouchHandlers({
    onSelect,
    onSwipe,
    toggleCardHighlight,
    setIsFastSelectEnabled,
    isEditable,
    isFastSelectEnabled,
    isDisabled,
    // ⬇️ use the highlight key, not the raw pokemonKey
    selectKey: highlightKey,
  });

  const getOwnershipClass = () => {
    // Normalize terms used by CSS
    const f = (tagFilter || '').toLowerCase();
    switch (f) {
      case 'caught':
        return 'caught';
      case 'trade':
        return 'trade';
      case 'wanted':
        return 'wanted';
      case 'missing':
        return 'missing';
      default:
        return '';
    }
  };

  const shouldDisplayLuckyBackdrop =
    (tagFilter.toLowerCase() === 'wanted' && pokemon.instanceData?.pref_lucky) ||
    (tagFilter.toLowerCase() === 'caught' && pokemon.instanceData?.lucky);

  let locationBackground: VariantBackground | null = null;
  if (pokemon.instanceData?.location_card) {
    const variant = variants.find(v => v.pokemon_id === pokemon.pokemon_id);
    const locationCardId = Number(pokemon.instanceData?.location_card);
    if (!isNaN(locationCardId)) {
      locationBackground = variant?.backgrounds.find(bg => bg.background_id === locationCardId) || null;
    }
  }

  const cpValue =
    tagFilter !== ''
      ? (pokemon.instanceData?.cp ?? '')
      : (sortType === 'combatPower' && (pokemon as any).cp50 != null ? (pokemon as any).cp50 : '');

  const cardClass = `
    pokemon-card
    ${getOwnershipClass()}
    ${isHighlighted ? 'highlighted' : ''}
    ${isDisabled ? 'disabled-card' : ''}
    ${shouldJiggle ? 'jiggle' : ''}
  `.trim();

  return (
    <div
      className={cardClass}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <div className="cp-container">
        <CP cp={cpValue} editMode={false} onCPChange={() => {}} />
      </div>

      <div className="fav-container">
        {pokemon.instanceData?.favorite && (
          <img src="/images/fav_pressed.png" alt="Favorite" className="favorite-icon" draggable={false} />
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

      <p>#{(pokemon as any).pokedex_number}</p>

      <div className="type-icons">
        {(pokemon as any).type_1_icon && <img src={(pokemon as any).type_1_icon} alt={(pokemon as any).type1_name} loading="lazy" draggable={false} />}
        {(pokemon as any).type_2_icon && <img src={(pokemon as any).type_2_icon} alt={(pokemon as any).type2_name} loading="lazy" draggable={false} />}
      </div>

      <h2 className="pokemon-name-display"> 
        {getDisplayName()}
      </h2>
    </div>
  );
});

export default PokemonCard;
