// OwnedInstance.jsx
import React, { useState } from 'react';
import './OwnedInstance.css';
import CPComponent from './OwnedComponents/CPComponent';
import NameComponent from './OwnedComponents/NameComponent';
import GenderComponent from './OwnedComponents/GenderComponent';

import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';

import PvPMovesComponent from './OwnedComponents/PvPMovesComponent';
import RaidMovesComponent from './OwnedComponents/RaidMovesComponent';

const OwnedInstance = ({ pokemon }) => {
  const [showPvP, setShowPvP] = useState(false); // Default to "Gym & Raids"

  const toggleMoves = () => {
    setShowPvP(!showPvP);
  };

  return (
    <div>
      <CPComponent pokemon={pokemon} />
      <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" />
      <NameComponent pokemon={pokemon} />
      <GenderComponent pokemon={pokemon} />
      <div className="stats-container">
        <WeightComponent pokemon={pokemon} />
        <TypeComponent pokemon={pokemon} />
        <HeightComponent pokemon={pokemon} />
      </div>
      <div className="moves-toggle">
        <span className={`toggle-option ${!showPvP ? 'active' : ''}`} onClick={() => setShowPvP(false)}>Gym & Raids</span>
        <span className={`toggle-option ${showPvP ? 'active' : ''}`} onClick={() => setShowPvP(true)}>Trainer Battles</span>
      </div>
      <div className="moves-content">
        <div className={`moves-container ${showPvP ? 'slide-out' : 'slide-in'}`}>
          <div className="raid-content">
            <RaidMovesComponent pokemon={pokemon} />
          </div>
          <div className="pvp-content">
            <PvPMovesComponent pokemon={pokemon} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OwnedInstance;

