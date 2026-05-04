import React, { useState } from 'react';

import IV from '../../../../components/pokemonComponents/IV';
import ConfirmationOverlay from '../ConfirmationOverlay';
import MapPopupPokemonSummary from './MapPopupPokemonSummary';
import {
  getMapPopupImageUrl,
  getMapPopupPokemonDisplayName,
} from './mapPopupHelpers';
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

  const pokemonDisplayName = getMapPopupPokemonDisplayName(item);
  const imageUrl = getMapPopupImageUrl(item);

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
      <MapPopupPokemonSummary
        className="caught-popup-content"
        imageUrl={imageUrl}
        pokemonDisplayName={pokemonDisplayName}
        fastMoveId={fast_move_id}
        chargedMove1Id={charged_move1_id ?? charged_move1Id}
        chargedMove2Id={charged_move2_id}
        moves={pokemonInfo?.moves}
      />
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
