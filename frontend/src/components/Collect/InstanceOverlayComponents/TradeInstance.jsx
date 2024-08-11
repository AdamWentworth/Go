// TradeInstance.jsx
import React, { useState, useContext } from 'react';
import './TradeInstance.css';

import { PokemonDataContext } from '../../../contexts/PokemonDataContext'; 

import EditSaveComponent from './EditSaveComponent';
import CPComponent from './OwnedComponents/CPComponent';
import NameComponent from './OwnedComponents/NameComponent';
import GenderComponent from './OwnedComponents/GenderComponent';
import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';
import MovesComponent from './OwnedComponents/MovesComponent';
import LocationCaughtComponent from './OwnedComponents/LocationCaughtComponent';
import DateCaughtComponent from './OwnedComponents/DateCaughtComponent';

const TradeInstance = ({ pokemon }) => {
  const { updateDetails } = useContext(PokemonDataContext);
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);
  const [cp, setCP] = useState(pokemon.ownershipStatus.cp);
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const [weight, setWeight] = useState(pokemon.ownershipStatus.weight);
  const [height, setHeight] = useState(pokemon.ownershipStatus.height);
  const [moves, setMoves] = useState({
    fastMove: pokemon.ownershipStatus.fast_move_id,
    chargedMove1: pokemon.ownershipStatus.charged_move1_id,
    chargedMove2: pokemon.ownershipStatus.charged_move2_id,
  });
  const [locationCaught, setLocationCaught] = useState(pokemon.ownershipStatus.location_caught);
  const [dateCaught, setDateCaught] = useState(pokemon.ownershipStatus.date_caught);

  // Define the handleCPChange function
  const handleCPChange = (newCP) => {
    setCP(newCP);  // Update CP state
  };

  const handleNicknameChange = (newNickname) => {
    setNickname(newNickname);  // Update state with new nickname
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
  };

  const handleWeightChange = (newWeight) => {
    setWeight(newWeight);
  };

  const handleHeightChange = (newHeight) => {
    setHeight(newHeight);
  };

  const handleMovesChange = (newMoves) => {
    setMoves(newMoves);
  };

  const handleLocationCaughtChange = (newLocation) => {
    setLocationCaught(newLocation);
  };

  const handleDateCaughtChange = (newDate) => {
    setDateCaught(newDate);
  };

  const toggleEditMode = () => {
    if (editMode) {
      updateDetails(pokemon.pokemonKey, { 
        nickname: nickname,
        cp: cp,
        gender: gender, 
        weight: weight, 
        height: height,
        fast_move_id: moves.fastMove,
        charged_move1_id: moves.chargedMove1,
        charged_move2_id: moves.chargedMove2,
        location_caught: locationCaught,
        date_caught: dateCaught
      });
    }
    setEditMode(!editMode);
  };

  return (
    <div className="trade-instance">
      <div className="top-row">
        <div className="edit-save-container">
          <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        </div>
        <h2>For Trade</h2>
      </div>

      <div className="cp-container">
        <CPComponent pokemon={pokemon} editMode={editMode} onCPChange={handleCPChange} />
      </div>

      <div className="image-container">
        <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" />
      </div>

      <div className="name-container">
        <NameComponent pokemon={pokemon} editMode={editMode} onNicknameChange={handleNicknameChange} />
      </div>

      <div className="gender-container">
        <GenderComponent pokemon={pokemon} editMode={editMode} onGenderChange={handleGenderChange} />
      </div>

      <div className="stats-container">
          <WeightComponent pokemon={pokemon} editMode={editMode} onWeightChange={handleWeightChange} />
          <TypeComponent pokemon={pokemon} />
          <HeightComponent pokemon={pokemon} editMode={editMode} onHeightChange={handleHeightChange} />
      </div>

      <div className="moves-container">
        <MovesComponent pokemon={pokemon} editMode={editMode} onMovesChange={handleMovesChange} />
      </div>

      <div className="location-container">
        <LocationCaughtComponent pokemon={pokemon} editMode={editMode} onLocationChange={handleLocationCaughtChange} />
      </div>

      <div className="date-container">
        <DateCaughtComponent pokemon={pokemon} editMode={editMode} onDateChange={handleDateCaughtChange} />
      </div>
    </div>
  );
};

export default TradeInstance;