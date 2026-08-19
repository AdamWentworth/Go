import React from 'react';

import type { UseVariantSearchControllerResult } from './useVariantSearchController';

type SelectedPokemonPreviewProps = {
  className?: string;
  controller: Pick<
    UseVariantSearchControllerResult,
    | 'handleImageError'
    | 'imageError'
    | 'imageUrl'
    | 'selectedBackground'
  >;
  dynamax: boolean;
  gigantamax: boolean;
  pokemon: string;
};

const SelectedPokemonPreview: React.FC<SelectedPokemonPreviewProps> = ({
  className,
  controller,
  dynamax,
  gigantamax,
  pokemon,
}) => {
  if (!controller.imageUrl || controller.imageError) return null;

  return (
    <div
      className={[
        'selected-pokemon-preview',
        controller.selectedBackground && 'has-background',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        controller.selectedBackground
          ? {
              backgroundImage: `url(${controller.selectedBackground.image_url})`,
            }
          : undefined
      }
    >
      <img
        alt={`${pokemon || 'Selected Pokémon'} preview`}
        className="selected-pokemon-preview__pokemon"
        onError={controller.handleImageError}
        src={controller.imageUrl}
      />
      {dynamax ? (
        <img
          alt="Dynamax"
          className="selected-pokemon-preview__badge"
          src="/images/dynamax.png"
        />
      ) : null}
      {gigantamax ? (
        <img
          alt="Gigantamax"
          className="selected-pokemon-preview__badge"
          src="/images/gigantamax.png"
        />
      ) : null}
    </div>
  );
};

export default SelectedPokemonPreview;
