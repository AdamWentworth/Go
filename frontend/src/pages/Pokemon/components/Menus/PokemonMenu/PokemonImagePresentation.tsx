// PokemonImagePresentation.tsx
import { useEffect, useRef } from 'react';

import { recordImageLoadError, recordImageLoadTimingMs } from '@/utils/perfTelemetry';
import type { VariantBackground } from '@/types/pokemonSubTypes';

interface Props {
  imageUrl?: string;
  altText: string;
  locationBackground: VariantBackground | null;
  shouldDisplayLuckyBackdrop?: boolean;
  isDynamax: boolean;
  isGigantamax: boolean;
  isPurified: boolean;
}

const PokemonImagePresentation = ({
  imageUrl,
  altText,
  locationBackground,
  shouldDisplayLuckyBackdrop,
  isDynamax,
  isGigantamax,
  isPurified
}: Props) => {
  const imageStartRef = useRef<number>(performance.now());

  useEffect(() => {
    imageStartRef.current = performance.now();
  }, [imageUrl]);

  const handleImageLoad = () => {
    recordImageLoadTimingMs(performance.now() - imageStartRef.current);
  };

  const handleImageError = () => {
    recordImageLoadError();
  };

  return (
    <div className="pokemon-image-container">
      {locationBackground && (
        <img
          src={locationBackground.image_url}
          alt={`Location backdrop for ${locationBackground.name}`}
          className="location-backdrop"
          draggable={false}
        />
      )}
      {shouldDisplayLuckyBackdrop && (
        <div className="lucky-backdrop-wrapper">
          <img
            src="/images/lucky.png"
            alt="Lucky backdrop"
            className="lucky-backdrop"
            draggable={false}
          />
        </div>
      )}
      <img
        src={imageUrl}
        alt={altText}
        loading="lazy"
        decoding="async"
        className="pokemon-image"
        draggable={false}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {isDynamax && (
        <img src="/images/dynamax.png" alt="Dynamax Badge" className="max-badge" draggable={false} />
      )}
      {isGigantamax && (
        <img src="/images/gigantamax.png" alt="Gigantamax Badge" className="max-badge" draggable={false} />
      )}
      {isPurified && (
        <div className="purified-badge">
          <img src="/images/purified.png" alt={`${altText} is purified`} className="purified-badge-image" draggable={false} />
        </div>
      )}
    </div>
  );
};

export default PokemonImagePresentation;
