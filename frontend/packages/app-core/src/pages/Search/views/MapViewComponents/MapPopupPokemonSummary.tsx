import React from 'react';

import MoveDisplay from '@/components/pokemonComponents/MoveDisplay';

import type { MapPopupMove } from './mapPopupHelpers';

type MapPopupPokemonSummaryProps = {
  className: string;
  imageUrl?: string | null;
  pokemonDisplayName: string;
  fastMoveId?: number | null;
  chargedMove1Id?: number | null;
  chargedMove2Id?: number | null;
  moves?: MapPopupMove[] | null;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
};

const MapPopupPokemonSummary: React.FC<MapPopupPokemonSummaryProps> = ({
  className,
  imageUrl,
  pokemonDisplayName,
  fastMoveId,
  chargedMove1Id,
  chargedMove2Id,
  moves,
  onClick,
}) => {
  return (
    <div className={className} onClick={onClick}>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={`${pokemonDisplayName} Image`}
          className="pokemon-image"
        />
      )}
      <div className="pokemon-details">
        <p>{pokemonDisplayName}</p>
        <MoveDisplay
          fastMoveId={fastMoveId ?? null}
          chargedMove1Id={chargedMove1Id ?? null}
          chargedMove2Id={chargedMove2Id ?? null}
          moves={moves || []}
        />
      </div>
    </div>
  );
};

export default MapPopupPokemonSummary;
