// WantedPopup.jsx

import React, { useState } from 'react';
import IV from '../../../../components/pokemonComponents/IV.jsx';
import MoveDisplay from '../../../../components/pokemonComponents/MoveDisplay.jsx';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import ConfirmationOverlay from '../ConfirmationOverlay.jsx';
import { parsePokemonKey } from '../../../../utils/PokemonIDUtils';
import './WantedPopup.css';

const WantedPopup = ({ item, navigateToUserCatalog, findPokemonByKey, onClose }) => {
  const { username, fast_move_id, charged_move1_id, charged_move2_id, pokemonInfo, instance_id } = item;
  const pokemonDisplayName = getPokemonDisplayName(item);
  const imageUrl = URLSelect(pokemonInfo, item);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePopupClick = (e) => {
    e.stopPropagation(); // Prevent propagation to the underlying wrapper
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    navigateToUserCatalog(username, instance_id, "Wanted");
    setShowConfirmation(false);
    onClose(); // Close the popup after confirming
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  // Close popup when clicking outside
  const handleWrapperClick = () => {
    onClose();
  };

  return (
    <div className="wanted-popup-wrapper" onClick={handleWrapperClick}>
      <div className="wanted-popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="wanted-popup-header">
          <strong>{username}</strong>
        </div>
        <div className="wanted-popup-content" onClick={handlePopupClick}>
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
              chargedMove1Id={charged_move1_id}
              chargedMove2Id={charged_move2_id}
              moves={pokemonInfo?.moves || []}
            />
          </div>
        </div>
        <IV item={item} />

        {/* Trade List Section */}
        {item.trade_list && (
          <div className="trade-list-section">
            <h3>Trade Pokémon:</h3>
            <div className="trade-list">
              {Object.keys(item.trade_list).map((pokemonKeyWithUUID) => {
                const { baseKey } = parsePokemonKey(pokemonKeyWithUUID);
                const tradeListPokemon = item.trade_list[pokemonKeyWithUUID];
                const matchedPokemon = findPokemonByKey(baseKey);

                return matchedPokemon ? (
                  <img
                    key={pokemonKeyWithUUID}
                    src={matchedPokemon.currentImage}
                    alt={matchedPokemon.name}
                    className={`trade-pokemon-image ${tradeListPokemon.match ? 'glowing-pokemon' : ''}`}
                    title={`${matchedPokemon.form ? `${matchedPokemon.form} ` : ''}${matchedPokemon.name}`}
                  />
                ) : (
                  <p key={pokemonKeyWithUUID}>No match found for {baseKey}</p>
                );
              })}
            </div>
          </div>
        )}

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
