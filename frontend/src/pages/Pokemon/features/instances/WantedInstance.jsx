// WantedInstance.jsx

import React, { useState, useContext, useEffect } from 'react';
import './WantedInstance.css';

import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

import EditSaveComponent from '@/components/EditSaveComponent';
import NameComponent from './components/Owned/NameComponent';
import Gender from '@/components/pokemonComponents/Gender';
import Weight from '@/components/pokemonComponents/Weight';
import Types from '@/components/pokemonComponents/Types';
import Height from '@/components/pokemonComponents/Height';
import Moves from '@/components/pokemonComponents/Moves';
import FriendshipManager from './components/Wanted/FriendshipManager';
import BackgroundLocationCard from '@/components/pokemonComponents/BackgroundLocationCard';

import { determineImageUrl } from '@/utils/imageHelpers';

const WantedInstance = ({ pokemon, isEditable }) => {
  // console.log(pokemon.pokemonKey)
  const updateDetails = useInstancesStore((s) => s.updateDetails);

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState(pokemon.instanceData.nickname);
  const [isFavorite, setIsFavorite] = useState(pokemon.instanceData.favorite);
  const [gender, setGender] = useState(pokemon.instanceData.gender);
  const [isFemale, setIsFemale] = useState(pokemon.instanceData.gender === 'Female');
  const [currentImage, setCurrentImage] = useState(determineImageUrl(isFemale, pokemon));  // Set the initial image based on gender
  const [weight, setWeight] = useState(pokemon.instanceData.weight);
  const [height, setHeight] = useState(pokemon.instanceData.height);
  const [moves, setMoves] = useState({
    fastMove: pokemon.instanceData.fast_move_id,
    chargedMove1: pokemon.instanceData.charged_move1_id,
    chargedMove2: pokemon.instanceData.charged_move2_id,
  });
  const [friendship, setFriendship] = useState(pokemon.instanceData.friendship_level || 0);
  const [isLucky, setIsLucky] = useState(pokemon.instanceData.pref_lucky);

  // Background-related state
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null);

  // State to hold Dynamax and Gigantamax
  const [dynamax] = useState(!!pokemon.instanceData.dynamax);
  const [gigantamax] = useState(!!pokemon.instanceData.gigantamax);

  // On mount, set background if relevant
  useEffect(() => {
    if (pokemon.instanceData.location_card !== null) {
      const locationCardId = parseInt(pokemon.instanceData.location_card, 10);
      const background = pokemon.backgrounds.find(
        (bg) => bg.background_id === locationCardId
      );
      if (background) {
        setSelectedBackground(background);
      }
    }
  }, [pokemon.backgrounds, pokemon.instanceData.location_card]);

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
      </div>

      {selectableBackgrounds.length > 0 && (
        <div className="background-select-container">
          <div className={`background-select-row ${editMode ? 'active' : ''}`}>
            <img
              src={'/images/location.png'}
              alt="Background Selector"
              className="background-icon"
              onClick={editMode ? () => setShowBackgrounds(!showBackgrounds) : null}
            />
          </div>
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
              src={`/images/lucky.png`}
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
              src={'/images/dynamax.png'} 
              alt="Dynamax Badge" 
              className="max-badge" 
            />
          )}
          {gigantamax && (
            <img 
              src={'/images/gigantamax.png'} 
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
      { (editMode || (gender !== null && gender !== '')) && (
          <div className="gender-wrapper">
            <Gender 
              pokemon={pokemon} 
              editMode={editMode} 
              onGenderChange={handleGenderChange} 
            />
          </div>
        )}
      </div>

      <div className="stats-container">
        <Weight pokemon={pokemon} editMode={editMode} onWeightChange={handleWeightChange} />
        <Types pokemon={pokemon} />
        <Height pokemon={pokemon} editMode={editMode} onHeightChange={handleHeightChange} />
      </div>

      <div className="moves-container">
        <Moves pokemon={pokemon} editMode={editMode} onMovesChange={handleMovesChange} />
      </div>

      {showBackgrounds && (
      <div className="background-overlay" onClick={() => setShowBackgrounds(false)}>
        <div className="background-overlay-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={() => setShowBackgrounds(false)}>
            Close
          </button>
          <BackgroundLocationCard
            pokemon={pokemon}
            onSelectBackground={handleBackgroundSelect}
            // No selectedCostumeId passed, so it uses pokemon.variantType for filtering.
          />
        </div>
      </div>
    )}
    </div>
  );
};

export default WantedInstance;
