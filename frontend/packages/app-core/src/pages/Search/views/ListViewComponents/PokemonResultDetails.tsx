import React from 'react';

import FriendshipLevel from '@/components/pokemonComponents/FriendshipLevel';
import MoveDisplay from '@/components/pokemonComponents/MoveDisplay';

type PokemonMove = {
  move_id: number;
  name: string;
  type: string;
  type_name: string;
  legacy?: boolean;
};

type PokemonResultDetailsProps = {
  friendshipLevel?: number | null;
  prefLucky?: boolean;
  weight?: number | null;
  height?: number | null;
  fastMoveId?: number | null;
  chargedMove1Id?: number | null;
  chargedMove2Id?: number | null;
  moves?: PokemonMove[] | null;
  locationCaught?: string;
  dateCaught?: string;
  formatDate: (dateString: string) => string;
};

const PokemonResultDetails: React.FC<PokemonResultDetailsProps> = ({
  friendshipLevel,
  prefLucky = false,
  weight,
  height,
  fastMoveId,
  chargedMove1Id,
  chargedMove2Id,
  moves,
  locationCaught,
  dateCaught,
  formatDate,
}) => {
  const hasMoves = Boolean(fastMoveId || chargedMove1Id || chargedMove2Id);

  return (
    <div className="pokemon-second-column">
      {typeof friendshipLevel === 'number' && friendshipLevel > 0 && (
        <div className="pokemon-friendship">
          <FriendshipLevel level={friendshipLevel} prefLucky={prefLucky} />
        </div>
      )}

      <div className="pokemon-weight-height">
        {typeof weight === 'number' && weight > 0 && (
          <div className="pokemon-weight">
            <p>
              <strong>{weight}kg</strong>
            </p>
            <p>WEIGHT</p>
          </div>
        )}
        {typeof height === 'number' && height > 0 && (
          <div className="pokemon-height">
            <p>
              <strong>{height}m</strong>
            </p>
            <p>HEIGHT</p>
          </div>
        )}
      </div>

      {hasMoves && (
        <div className="pokemon-moves">
          <MoveDisplay
            fastMoveId={fastMoveId ?? null}
            chargedMove1Id={chargedMove1Id ?? null}
            chargedMove2Id={chargedMove2Id ?? null}
            moves={moves}
          />
        </div>
      )}

      {locationCaught && (
        <div className="pokemon-location">
          <p>
            <strong>Location Caught: </strong>
            {locationCaught}
          </p>
        </div>
      )}

      {dateCaught && (
        <div className="pokemon-date">
          <p>
            <strong>Date Caught: </strong>
            {formatDate(dateCaught)}
          </p>
        </div>
      )}
    </div>
  );
};

export default PokemonResultDetails;
