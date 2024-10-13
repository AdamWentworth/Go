// TradeInstance.jsx
import React, { useState, useContext, useEffect } from 'react';
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
import BackgroundComponent from './OwnedComponents/BackgroundComponent';
import { determineImageUrl } from '../../../utils/imageHelpers'; // Import image helper

const TradeInstance = ({ pokemon }) => {
  const { updateDetails } = useContext(PokemonDataContext);
  
  const [isFemale, setIsFemale] = useState(pokemon.ownershipStatus.gender === 'Female');
  const [currentImage, setCurrentImage] = useState(determineImageUrl(isFemale, pokemon)); // Set initial image based on gender
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

  // Background-related state
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);

  useEffect(() => {
    if (pokemon.ownershipStatus.location_card !== null) {
      const locationCardId = parseInt(pokemon.ownershipStatus.location_card, 10);
      const background = pokemon.backgrounds.find(bg => bg.background_id === locationCardId);
      if (background) {
        setSelectedBackground(background);
      }
    }
  }, [pokemon.backgrounds, pokemon.ownershipStatus.location_card]);

  // Update the image whenever gender or Pokémon changes
  useEffect(() => {
    const updatedImage = determineImageUrl(isFemale, pokemon);
    setCurrentImage(updatedImage);
  }, [isFemale, pokemon]);

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female'); // Update gender state and isFemale flag
  };

  const handleCPChange = (newCP) => {
    setCP(newCP);
  };

  const handleNicknameChange = (newNickname) => {
    setNickname(newNickname);
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
        date_caught: dateCaught,
        location_card: selectedBackground ? selectedBackground.background_id : null,  // Include background ID
      });
    }
    setEditMode(!editMode);
  };

  const handleBackgroundSelect = (background) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  };

  const selectableBackgrounds = pokemon.backgrounds.filter((background) => {
    if (!background.costume_id) {
      return true;
    }
    const variantTypeId = pokemon.variantType.split('_')[1];
    return background.costume_id === parseInt(variantTypeId, 10);
  });

  return (
    <div className="trade-instance">
      <div className="trade-title"></div>
      <div className="top-row">
        <div className="edit-save-container">
          <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        </div>
        <h2>Trade</h2>
      </div>

      <div className="CPComponent">
        <CPComponent pokemon={pokemon} editMode={editMode} onCPChange={handleCPChange} />
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

      <div className="image-container">
        {selectedBackground && (
          <div className="background-container">
            <div className="background-image" style={{ backgroundImage: `url(${selectedBackground.image_url})` }}></div>
            <div className="brightness-overlay"></div>
          </div>
        )}
        <div className="pokemon-image-container">
          <img src={currentImage} alt={pokemon.name} className="pokemon-image" />
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

      <div className="location-container">
        <LocationCaughtComponent pokemon={pokemon} editMode={editMode} onLocationChange={handleLocationCaughtChange} />
      </div>

      <div className="date-container">
        <DateCaughtComponent pokemon={pokemon} editMode={editMode} onDateChange={handleDateCaughtChange} />
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

export default TradeInstance;