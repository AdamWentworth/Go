import React, { useState } from 'react';

import IV from '../../../../components/pokemonComponents/IV';
import MoveDisplay from '../../../../components/pokemonComponents/MoveDisplay';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import ConfirmationOverlay from '../ConfirmationOverlay';
import './CaughtPopup.css';

type CaughtPopupItem = {
  username: string;
  instance_id: string;
  shiny?: boolean;
  shadow?: boolean;
  costume_id?: number | string | null;
  dynamax?: boolean;
  gigantamax?: boolean;
  gender?: string | null;
  attack_iv?: number | string | null;
  defense_iv?: number | string | null;
  stamina_iv?: number | string | null;
  fast_move_id?: number | null;
  charged_move1_id?: number | null;
  charged_move1Id?: number | null;
  charged_move2_id?: number | null;
  pokemonInfo?: {
    name?: string | null;
    form?: string | null;
    costumes?: Array<{
      costume_id?: number | string | null;
      name?: string | null;
      [key: string]: unknown;
    }> | null;
    moves?: Array<{
      move_id: number;
      name: string;
      type: string;
      type_name: string;
      legacy?: boolean;
    }> | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
};

type CaughtPopupProps = {
  item: CaughtPopupItem;
  navigateToUserCatalog: (
    username: string,
    instanceId: string,
    instanceData: string,
  ) => void;
};

const CaughtPopup: React.FC<CaughtPopupProps> = ({ item, navigateToUserCatalog }) => {
  const {
    username,
    fast_move_id,
    charged_move1_id,
    charged_move1Id,
    charged_move2_id,
    pokemonInfo,
    instance_id,
  } = item;

  const pokemonDisplayName = getPokemonDisplayName({
    shiny: item.shiny,
    shadow: item.shadow,
    costume_id: item.costume_id ?? null,
    pokemonInfo: {
      name:
        typeof pokemonInfo?.name === 'string' && pokemonInfo.name.trim().length > 0
          ? pokemonInfo.name
          : 'Unknown',
      form: typeof pokemonInfo?.form === 'string' ? pokemonInfo.form : null,
      costumes: Array.isArray(pokemonInfo?.costumes) ? pokemonInfo.costumes : null,
    },
  });

  const imageUrl = URLSelect(
    pokemonInfo as Parameters<typeof URLSelect>[0],
    {
      dynamax: item.dynamax,
      gigantamax: item.gigantamax,
      shiny: item.shiny,
      shadow: item.shadow,
      costume_id: item.costume_id,
      gender: item.gender,
    },
  );

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePopupClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    navigateToUserCatalog(username, instance_id, 'Caught');
    setShowConfirmation(false);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="caught-popup-container" onClick={handlePopupClick}>
      <div className="caught-popup-header">
        <strong>{username}</strong>
      </div>
      <div className="caught-popup-content">
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
            fastMoveId={fast_move_id ?? null}
            chargedMove1Id={charged_move1_id ?? charged_move1Id ?? null}
            chargedMove2Id={charged_move2_id ?? null}
            moves={pokemonInfo?.moves || []}
          />
        </div>
      </div>
      <IV item={item} />

      {showConfirmation && (
        <ConfirmationOverlay
          username={username}
          pokemonDisplayName={pokemonDisplayName}
          instanceId={instance_id}
          onConfirm={handleConfirm}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
};

export default CaughtPopup;
