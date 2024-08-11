// WantedInstance.jsx
import React, { useState, useContext } from 'react';
import './WantedInstance.css';

import { PokemonDataContext } from '../../../contexts/PokemonDataContext'; 

import EditSaveComponent from './EditSaveComponent';
import FavoriteComponent from './OwnedComponents/FavoriteComponent';
import NameComponent from './OwnedComponents/NameComponent';
import GenderComponent from './OwnedComponents/GenderComponent';
import WeightComponent from './OwnedComponents/WeightComponent';
import TypeComponent from './OwnedComponents/TypeComponent';
import HeightComponent from './OwnedComponents/HeightComponent';
import MovesComponent from './OwnedComponents/MovesComponent';
import FriendshipManager from './WantedComponents/FriendshipManager';

const WantedInstance = ({ pokemon }) => {
  const { updateDetails } = useContext(PokemonDataContext);
  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);
  const [isFavorite, setIsFavorite] = useState(pokemon.ownershipStatus.favorite);
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const [weight, setWeight] = useState(pokemon.ownershipStatus.weight);
  const [height, setHeight] = useState(pokemon.ownershipStatus.height);
  const [moves, setMoves] = useState({
    fastMove: pokemon.ownershipStatus.fast_move_id,
    chargedMove1: pokemon.ownershipStatus.charged_move1_id,
    chargedMove2: pokemon.ownershipStatus.charged_move2_id,
  });
  const [friendship, setFriendship] = useState(pokemon.ownershipStatus.friendship_level || 0);
  const [isLucky, setIsLucky] = useState(pokemon.ownershipStatus.pref_lucky);

  const handleNicknameChange = (newNickname) => setNickname(newNickname);
  const handleFavoriteChange = (newFavoriteStatus) => setIsFavorite(newFavoriteStatus);
  const handleGenderChange = (newGender) => setGender(newGender);
  const handleWeightChange = (newWeight) => setWeight(newWeight);
  const handleHeightChange = (newHeight) => setHeight(newHeight);
  const handleMovesChange = (newMoves) => setMoves(newMoves);

  const toggleEditMode = () => {
    if (editMode) {
      updateDetails(pokemon.pokemonKey, { 
        nickname, 
        favorite: isFavorite, 
        gender, 
        weight, 
        height,
        fast_move_id: moves.fastMove,
        charged_move1_id: moves.chargedMove1,
        charged_move2_id: moves.chargedMove2,
        friendship_level: friendship,
        pref_lucky: isLucky,
      });
    }
    setEditMode(!editMode);
  };

  return (
    <div className="wanted-instance">
      <div className="top-row">
        <div className="edit-save-container">
          <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        </div>
        <h2>Wanted</h2>
        <div className="favorite-container">
          <FavoriteComponent pokemon={pokemon} editMode={editMode} onFavoriteChange={handleFavoriteChange} />
        </div>
      </div>

      <FriendshipManager 
        friendship={friendship} 
        setFriendship={setFriendship} 
        editMode={editMode} 
        isLucky={isLucky}
        setIsLucky={setIsLucky}
      />

      <div className="image-container">
        {isLucky && (
          <img
            src={`${process.env.PUBLIC_URL}/images/lucky.png`}
            alt="Lucky backdrop"
            className="lucky-backdrop"
          />
        )}
        <img 
          src={process.env.PUBLIC_URL + pokemon.currentImage} 
          alt={pokemon.name} 
          className="pokemon-image"
        />
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
    </div>
  );
};

export default WantedInstance;