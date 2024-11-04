// OwnedPopup.jsx

import React from 'react';
import IVDisplay from '../ListViewComponents/IVDisplay';
import MoveDisplay from '../ListViewComponents/MoveDisplay';
import { URLSelect } from '../../utils/URLSelect';
import getPokemonDisplayName from '../../utils/getPokemonDisplayName';
import './OwnedPopup.css';

const OwnedPopup = ({ item }) => {
  const { username, fast_move_id, charged_move1_id, charged_move2_id, pokemonInfo } = item;
  const pokemonDisplayName = getPokemonDisplayName(item); // Use the display name function
  const imageUrl = URLSelect(pokemonInfo, item);

  // Log the item to inspect the IV fields
  console.log('OwnedPopup item:', item);

  return (
    <div className="owned-popup-container">
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
          {/* Replace type with MoveDisplay */}
          <MoveDisplay
            fastMoveId={fast_move_id}
            chargedMove1Id={charged_move1_id}
            chargedMove2Id={charged_move2_id}
            moves={pokemonInfo?.moves || []}
          />
        </div>
      </div>
      <IVDisplay item={item} /> {/* Pass item directly to IVDisplay */}
    </div>
  );
};

export default OwnedPopup;