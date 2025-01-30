// WantedInstance.jsx

import React, { useState, useContext, useEffect } from 'react';
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
import BackgroundComponent from './OwnedComponents/BackgroundComponent'; 

import { determineImageUrl } from '../../../utils/imageHelpers';  // Import the image helper

const WantedInstance = ({ pokemon, isEditable }) => {
  // console.log(pokemon.pokemonKey)
  const { updateDetails } = useContext(PokemonDataContext);

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.ownershipStatus.nickname);
  const [isFavorite, setIsFavorite] = useState(pokemon.ownershipStatus.favorite);
  const [gender, setGender] = useState(pokemon.ownershipStatus.gender);
  const [isFemale, setIsFemale] = useState(pokemon.ownershipStatus.gender === 'Female');
  const [currentImage, setCurrentImage] = useState(determineImageUrl(isFemale, pokemon));  // Set the initial image based on gender
  const [weight, setWeight] = useState(pokemon.ownershipStatus.weight);
  const [height, setHeight] = useState(pokemon.ownershipStatus.height);
  const [moves, setMoves] = useState({
    fastMove: pokemon.ownershipStatus.fast_move_id,
    chargedMove1: pokemon.ownershipStatus.charged_move1_id,
    chargedMove2: pokemon.ownershipStatus.charged_move2_id,
  });
  const [friendship, setFriendship] = useState(pokemon.ownershipStatus.friendship_level || 0);
  const [isLucky, setIsLucky] = useState(pokemon.ownershipStatus.pref_lucky);

  // Background-related state
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);

  // State to hold Dynamax and Gigantamax
  const [dynamax] = useState(!!pokemon.ownershipStatus.dynamax);
  const [gigantamax] = useState(!!pokemon.ownershipStatus.gigantamax);

  // On mount, set background if relevant
  useEffect(() => {
    if (pokemon.ownershipStatus.location_card !== null) {
      const locationCardId = parseInt(pokemon.ownershipStatus.location_card, 10);
      const background = pokemon.backgrounds.find(
        (bg) => bg.background_id === locationCardId
      );
      if (background) {
        setSelectedBackground(background);
      }
    }
  }, [pokemon.backgrounds, pokemon.ownershipStatus.location_card]);

  useEffect(() => {
    // Update the image when the gender or pokemon changes or max states change
    const updatedImage = determineImageUrl(
      isFemale,
      pokemon,
      false,
      undefined,
      false,
      undefined,
      false,
      gigantamax
    );
    setCurrentImage(updatedImage);
  }, [isFemale, pokemon, dynamax, gigantamax]);

  const handleNicknameChange = (newNickname) => setNickname(newNickname);
  const handleFavoriteChange = (newFavoriteStatus) => setIsFavorite(newFavoriteStatus);
  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female');  // Update gender state and isFemale flag
  };
  const handleWeightChange = (newWeight) => setWeight(newWeight);
  const handleHeightChange = (newHeight) => setHeight(newHeight);
  const handleMovesChange = (newMoves) => setMoves(newMoves);

  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  };

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
        location_card: selectedBackground ? selectedBackground.background_id : null,
        dynamax: dynamax,
        gigantamax: gigantamax
      });
    }
    setEditMode(!editMode);
  };

  const selectableBackgrounds = pokemon.backgrounds.filter((background) => {
    if (!background.costume_id) {
      return true;
    }
    const variantTypeId = pokemon.variantType.split('_')[1];
    return background.costume_id === parseInt(variantTypeId, 10);
  });

  return (
    <div className="wanted-instance">
      <div className="top-row">
        <div className="edit-save-container">
            <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} isEditable={isEditable} />
        </div>
        <h2>Wanted</h2>
        <div className="favorite-container">
          <FavoriteComponent pokemon={pokemon} editMode={editMode} onFavoriteChange={handleFavoriteChange} />
        </div>
      </div>

      {selectableBackgrounds.length > 0 && (
        <div className={`background-select-row ${editMode ? 'active' : ''}`}>
          <img
            src={process.env.PUBLIC_URL + '/images/location.png'}
            alt="Background Selector"
            className="background-icon"
            onClick={editMode ? () => setShowBackgrounds(!showBackgrounds) : null}
          />
        </div>
      )}

      <FriendshipManager 
        friendship={friendship} 
        setFriendship={setFriendship} 
        editMode={editMode} 
        isLucky={isLucky}
        setIsLucky={setIsLucky}
      />

      <div className="image-container">
        {selectedBackground && (
          <div className="background-container">
            <div className="background-image" style={{ backgroundImage: `url(${selectedBackground.image_url})` }}></div>
            <div className="brightness-overlay"></div>
          </div>
        )}
        <div className="pokemon-image-container">
          {isLucky && (
            <img
              src={`${process.env.PUBLIC_URL}/images/lucky.png`}
              alt="Lucky backdrop"
              className="lucky-backdrop"
            />
          )}
          <img 
            src={currentImage}  // Use the updated image state here
            alt={pokemon.name} 
            className="pokemon-image"
          />
          {dynamax && (
            <img 
              src={process.env.PUBLIC_URL + '/images/dynamax.png'} 
              alt="Dynamax Badge" 
              className="max-badge" 
            />
          )}
          {gigantamax && (
            <img 
              src={process.env.PUBLIC_URL + '/images/gigantamax.png'} 
              alt="Gigantamax Badge" 
              className="max-badge" 
            />
          )}
        </div>
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

      {showBackgrounds && (
        <div className="background-overlay" onClick={() => setShowBackgrounds(false)}>
          <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowBackgrounds(false)}>Close</button>
            <BackgroundComponent pokemon={pokemon} onSelectBackground={handleBackgroundSelect} />
          </div>
        </div>
      )}
    </div>
  );
};

export default WantedInstance;
