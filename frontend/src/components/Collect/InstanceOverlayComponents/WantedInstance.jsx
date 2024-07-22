// WantedInstance.jsx
import React, { useState, useContext } from 'react';
import './OwnedInstance.css';
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
  console.log("Initial Pokemon Data: ", pokemon);

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
      console.log("Saving changes...");
      updateDetails(pokemon.pokemonKey, { 
        nickname: nickname, 
        favorite: isFavorite, 
        gender: gender, 
        weight: weight, 
        height: height,
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
    <div>
      <h2>Wanted</h2>
      <div className="top-row">
        <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        <div className="spacer"></div>
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
      <div className="pokemon-image-container" style={{ position: 'relative' }}>
        {pokemon.ownershipStatus.pref_lucky && (
          <img
            src={`${process.env.PUBLIC_URL}/images/lucky.png`}
            alt="Lucky backdrop"
            className="lucky-backdrop"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '175px', // Double the original width of 91px
              height: '125px', // Double the original height of 63px
              transform: 'translate(-50%, -50%)',
              zIndex: 1 // Ensure the backdrop is behind the image
            }}
          />
        )}
        <img src={process.env.PUBLIC_URL + pokemon.currentImage} alt={pokemon.name} className="pokemon-image" style={{ zIndex: 2 }} />
      </div>
      <NameComponent pokemon={pokemon} editMode={editMode} onNicknameChange={handleNicknameChange} />
      <div className="gender-container">
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
    </div>
  );
}

export default WantedInstance;
