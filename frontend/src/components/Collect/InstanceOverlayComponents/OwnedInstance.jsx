// OwnedInstance.jsx
import React, { useState, useContext } from 'react';
import './OwnedInstance.css';

import { PokemonDataContext } from '../../../contexts/PokemonDataContext'; 

import EditSaveComponent from './EditSaveComponent';
import CPComponent from './OwnedComponents/CPComponent';
import FavoriteComponent from './OwnedComponents/FavoriteComponent';

import NameComponent from './OwnedComponents/NameComponent';

import LuckyComponent from './OwnedComponents/LuckyComponent';
import GenderComponent from './OwnedComponents/GenderComponent';

import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';

import MovesComponent from './OwnedComponents/MovesComponent';
import IVComponent from './OwnedComponents/IVComponent';

import LocationCaughtComponent from './OwnedComponents/LocationCaughtComponent';
import DateCaughtComponent from './OwnedComponents/DateCaughtComponent';

const OwnedInstance = ({ pokemon }) => {
  console.log("Initial Pokemon Data: ", pokemon);

  const { updateDetails } = useContext(PokemonDataContext);
  const [isLucky, setIsLucky] = useState(pokemon.ownershipStatus.lucky);
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);
  const [cp, setCP] = useState(pokemon.ownershipStatus.cp);
  const [isFavorite, setIsFavorite] = useState(pokemon.ownershipStatus.favorite);
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const [weight, setWeight] = useState(pokemon.ownershipStatus.weight);
  const [height, setHeight] = useState(pokemon.ownershipStatus.height);
  const [moves, setMoves] = useState({
    fastMove: pokemon.ownershipStatus.fast_move_id,
    chargedMove1: pokemon.ownershipStatus.charged_move1_id,
    chargedMove2: pokemon.ownershipStatus.charged_move2_id,
  });
  const [ivs, setIvs] = useState({
    Attack: pokemon.ownershipStatus.attack_iv,
    Defense: pokemon.ownershipStatus.defense_iv,
    Stamina: pokemon.ownershipStatus.stamina_iv
  });
  const [locationCaught, setLocationCaught] = useState(pokemon.ownershipStatus.location_caught);
  const [dateCaught, setDateCaught] = useState(pokemon.ownershipStatus.date_caught);

  const handleCPChange = (newCP) => {
    setCP(newCP);  // Update CP state
  };

  const handleLuckyToggle = (newLuckyStatus) => {
    setIsLucky(newLuckyStatus);
  };

  const handleNicknameChange = (newNickname) => {
    setNickname(newNickname);  // Update state with new nickname
  };

  const handleFavoriteChange = (newFavoriteStatus) => {
    setIsFavorite(newFavoriteStatus);  // Update state with new favorite status
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

  const handleIvChange = (newIvs) => {
    setIvs(newIvs);
  };

  const handleLocationCaughtChange = (newLocation) => {
    setLocationCaught(newLocation);
  };

  const handleDateCaughtChange = (newDate) => {
    setDateCaught(newDate);
  };

  const toggleEditMode = () => {
    if (editMode) {
      console.log("Saving changes...");
      updateDetails(pokemon.pokemonKey, { 
        nickname: nickname, 
        lucky: isLucky, 
        cp: cp, 
        favorite: isFavorite, 
        gender: gender, 
        weight: weight, 
        height: height,
        fast_move_id: moves.fastMove,
        charged_move1_id: moves.chargedMove1,
        charged_move2_id: moves.chargedMove2,
        attack_iv: ivs.Attack,
        defense_iv: ivs.Defense,
        stamina_iv: ivs.Stamina,
        location_caught: locationCaught,
        date_caught: dateCaught
      });
    }
    setEditMode(!editMode);
  };

  return (
    <div>
      <div className="top-row">
        <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        <CPComponent pokemon={pokemon} editMode={editMode} toggleEditMode={toggleEditMode} onCPChange={handleCPChange} />
        <div className="right-stack">
          <FavoriteComponent pokemon={pokemon} editMode={editMode} onFavoriteChange={handleFavoriteChange} />
        </div>
      </div>
      <div className="pokemon-image-container">
        {isLucky && <img src={process.env.PUBLIC_URL + '/images/lucky.png'} alt="Lucky Backdrop" className="lucky-backdrop" />}
        <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" />
      </div>
      <NameComponent pokemon={pokemon} editMode={editMode} onNicknameChange={handleNicknameChange} />
      <div className="gender-lucky-row">
        {pokemon.ownershipStatus.shadow || pokemon.ownershipStatus.is_for_trade ? <div className="lucky-placeholder"></div> : (
          <LuckyComponent pokemon={pokemon} onToggleLucky={handleLuckyToggle} isLucky={isLucky} editMode={editMode} />
        )}
        <GenderComponent pokemon={pokemon} editMode={editMode} onGenderChange={handleGenderChange} />
      </div>
      <div className="stats-container">
        <WeightComponent pokemon={pokemon} editMode={editMode} onWeightChange={handleWeightChange} />
        <TypeComponent pokemon={pokemon} />
        <HeightComponent pokemon={pokemon} editMode={editMode} onHeightChange={handleHeightChange} />
      </div>
      <div className="moves-content">
        <MovesComponent pokemon={pokemon} editMode={editMode} onMovesChange={handleMovesChange} />
      </div>
      <IVComponent pokemon={pokemon} editMode={editMode} onIvChange={handleIvChange} />
      <LocationCaughtComponent pokemon={pokemon} editMode={editMode} onLocationChange={handleLocationCaughtChange} />
      <DateCaughtComponent pokemon={pokemon} editMode={editMode} onDateChange={handleDateCaughtChange} />      
    </div>
  );
}

export default OwnedInstance;