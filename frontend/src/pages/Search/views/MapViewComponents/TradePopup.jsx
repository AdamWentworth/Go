// TradePopup.jsx

import React, { useState, useEffect } from 'react';
import IVDisplay from '../ListViewComponents/IVDisplay';
import MoveDisplay from '../ListViewComponents/MoveDisplay';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import ConfirmationOverlay from '../ConfirmationOverlay';
import { parsePokemonKey } from '../../../../utils/PokemonIDUtils';
import './TradePopup.css';

const TradePopup = ({ item, navigateToUserCatalog, findPokemonByKey }) => {
  const { username, fast_move_id, charged_move1_id, charged_move2_id, pokemonInfo, instance_id } = item;
  const pokemonDisplayName = getPokemonDisplayName(item);
  const imageUrl = URLSelect(pokemonInfo, item);

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handlePopupClick = (e) => {
    e.stopPropagation(); // Prevent propagation to the underlying map
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    navigateToUserCatalog(username, instance_id, "Trade");
    setShowConfirmation(false);
  };  

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="trade-popup-container">
      <div className="trade-popup-header">
        <strong>{username}</strong>
      </div>
      <div className="trade-popup-content" onClick={handlePopupClick}>
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
      <IVDisplay item={item} />

      {/* Wanted List Section */}
      {item.wanted_list && (
        <div className="wanted-list-section">
          <h3>Wanted Pokémon:</h3>
          <div className="wanted-list">
            {Object.keys(item.wanted_list).map((pokemonKeyWithUUID) => {

              const { baseKey } = parsePokemonKey(pokemonKeyWithUUID);

              const wantedListPokemon = item.wanted_list[pokemonKeyWithUUID];
              const matchedPokemon = findPokemonByKey(baseKey);

              return matchedPokemon ? (
                <img
                  key={pokemonKeyWithUUID}
                  src={matchedPokemon.currentImage}
                  alt={matchedPokemon.name}
                  className={`wanted-pokemon-image ${wantedListPokemon.match ? 'glowing-pokemon' : ''}`}
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
  );
};

export default TradePopup;
