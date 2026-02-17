import React from 'react';

import Gender from '@/components/pokemonComponents/Gender';
import type { PokemonVariant } from '@/types/pokemonVariants';

import type { BackgroundSelection } from './VariantSearchBackgroundOverlay';
import MovesSearch, { type SelectedMoves } from './VariantComponents/MovesSearch';

interface VariantSearchPreviewPanelProps {
  selectedBackground: BackgroundSelection | null;
  imageUrl: string | null;
  imageError: boolean;
  pokemon: string;
  onImageError: () => void;
  dynamax: boolean;
  gigantamax: boolean;
  currentPokemonData: PokemonVariant | undefined;
  selectedMoves: SelectedMoves;
  onMovesChange: (moves: SelectedMoves) => void;
  onGenderChange: (gender: string | null) => void;
  backgroundAllowed: boolean;
  onOpenBackgroundOverlay: () => void;
  canDynamax: boolean;
  onToggleMax: () => void;
}

const VariantSearchPreviewPanel: React.FC<VariantSearchPreviewPanelProps> = ({
  selectedBackground,
  imageUrl,
  imageError,
  pokemon,
  onImageError,
  dynamax,
  gigantamax,
  currentPokemonData,
  selectedMoves,
  onMovesChange,
  onGenderChange,
  backgroundAllowed,
  onOpenBackgroundOverlay,
  canDynamax,
  onToggleMax,
}) => {
  const maxIconAlt = gigantamax
    ? 'Gigantamax'
    : dynamax
      ? 'Dynamax'
      : 'Dynamax (Desaturated)';
  const maxIconSrc = gigantamax ? '/images/gigantamax-icon.png' : '/images/dynamax-icon.png';

  return (
    <>
      <div className="pokemon-variant-image">
        {selectedBackground && (
          <div
            className="background-image"
            style={{ backgroundImage: `url(${selectedBackground.image_url})` }}
          />
        )}
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={pokemon}
            onError={onImageError}
            className="pokemon-image"
          />
        ) : imageError ? (
          <div className="pokemon-variant-image-error">This variant doesn't exist.</div>
        ) : null}

        {dynamax && <img src="/images/dynamax.png" alt="Dynamax Badge" className="max-badge" />}
        {gigantamax && (
          <img src="/images/gigantamax.png" alt="Gigantamax Badge" className="max-badge" />
        )}
      </div>

      <div className="pokemon-moves-gender-section">
        <MovesSearch
          pokemon={currentPokemonData}
          selectedMoves={selectedMoves}
          onMovesChange={onMovesChange}
        />

        <div className="gender-background-row">
          <Gender
            genderRate={currentPokemonData?.gender_rate}
            editMode={true}
            searchMode={true}
            onGenderChange={onGenderChange}
          />

          {backgroundAllowed && (
            <div className="background-button-container">
              <img
                src="/images/location.png"
                alt="Background Selector"
                className="background-button"
                onClick={onOpenBackgroundOverlay}
              />
            </div>
          )}

          {canDynamax && (
            <img
              onClick={onToggleMax}
              src={maxIconSrc}
              alt={maxIconAlt}
              className={`max-icon ${!gigantamax && !dynamax ? 'desaturated' : ''}`}
              title={maxIconAlt}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default VariantSearchPreviewPanel;

