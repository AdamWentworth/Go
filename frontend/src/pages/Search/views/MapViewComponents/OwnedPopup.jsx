// OwnedPopup.jsx

import React, { useState } from 'react';
import IV from '../../../../components/pokemonComponents/IV.jsx';
import MoveDisplay from '../../../../components/pokemonComponents/MoveDisplay.jsx';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import ConfirmationOverlay from '../ConfirmationOverlay';
import './OwnedPopup.css';

const OwnedPopup = ({ item, navigateToUserCatalog }) => {
  const { username, fast_move_id, charged_move1Id, charged_move2_id, pokemonInfo, instance_id } = item;
  const pokemonDisplayName = getPokemonDisplayName(item);
  const imageUrl = URLSelect(pokemonInfo, item);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePopupClick = (e) => {
    e.stopPropagation();  // Prevent propagation to underlying map
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    navigateToUserCatalog(username, instance_id, "Owned");
    setShowConfirmation(false);
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="owned-popup-container" onClick={handlePopupClick}>
      <div className="owned-popup-header">
        <strong>{username}</strong>
      </div>
      <div className="owned-popup-content">
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
            fastMoveId={fast_move_id}
            chargedMove1Id={charged_move1Id}
            chargedMove2Id={charged_move2_id}
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

export default OwnedPopup;
