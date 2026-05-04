import React, { useState } from 'react';
import IV from '../../../../components/pokemonComponents/IV';
import ConfirmationOverlay from '../ConfirmationOverlay';
import MapPopupLinkedPokemonList, {
  type MapPopupLinkedEntry,
} from './MapPopupLinkedPokemonList';
import MapPopupPokemonSummary from './MapPopupPokemonSummary';
import {
  getMapPopupImageUrl,
  getMapPopupPokemonDisplayName,
} from './mapPopupHelpers';
import './WantedPopup.css';

type WantedPopupItem = {
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
  trade_list?: Record<string, MapPopupLinkedEntry> | null;
  [key: string]: unknown;
};

type MatchedPokemon = {
  currentImage?: string;
  name?: string;
  form?: string | null;
};

type WantedPopupProps = {
  item: WantedPopupItem;
  navigateToUserCatalog: (
    username: string,
    instanceId: string,
    instanceData: string,
  ) => void;
  findPokemonByKey: (
    keyOrInstanceId?: string | null,
    instanceLike?: Record<string, unknown> | null,
  ) => MatchedPokemon | null;
  onClose: () => void;
};

const WantedPopup: React.FC<WantedPopupProps> = ({
  item,
  navigateToUserCatalog,
  findPokemonByKey,
  onClose,
}) => {
  const {
    username,
    fast_move_id,
    charged_move1_id,
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
    navigateToUserCatalog(username, instance_id, 'Wanted');
    setShowConfirmation(false);
    onClose();
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleWrapperClick = () => {
    onClose();
  };

  return (
    <div className="wanted-popup-wrapper" onClick={handleWrapperClick}>
      <div
        className="wanted-popup-container"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wanted-popup-header">
          <strong>{username}</strong>
        </div>
        <MapPopupPokemonSummary
          className="wanted-popup-content"
          imageUrl={imageUrl}
          pokemonDisplayName={pokemonDisplayName}
          fastMoveId={fast_move_id}
          chargedMove1Id={charged_move1_id}
          chargedMove2Id={charged_move2_id}
          moves={pokemonInfo?.moves}
          onClick={handlePopupClick}
        />
        <IV item={item} />

        <MapPopupLinkedPokemonList
          title="Trade Pokemon:"
          sectionClassName="trade-list-section"
          listClassName="trade-list"
          imageClassName="trade-pokemon-image"
          entries={item.trade_list}
          findPokemonByKey={findPokemonByKey}
        />

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
    </div>
  );
};

export default WantedPopup;
