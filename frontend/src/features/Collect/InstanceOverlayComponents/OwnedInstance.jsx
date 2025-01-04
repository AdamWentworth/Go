// OwnedInstance.jsx

import React, { useState, useEffect, useContext } from 'react';
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
import BackgroundComponent from './OwnedComponents/BackgroundComponent';
import MegaComponent from './OwnedComponents/MegaComponent';

import { determineImageUrl } from '../../../utils/imageHelpers';

const OwnedInstance = ({ pokemon, isEditable }) => {
  console.log(pokemon);
  const { updateDetails } = useContext(PokemonDataContext);

  const [isMega, setIsMega] = useState(pokemon.ownershipStatus.is_mega || false);
  const [mega, setMega] = useState(pokemon.ownershipStatus.mega || false);

  const [megaForm, setMegaForm] = useState(() => {
    // Only set initial megaForm if Pokemon is currently mega evolved
    if (pokemon.ownershipStatus.mega && pokemon.megaEvolutions?.length > 0) {
        return pokemon.ownershipStatus.mega_form || pokemon.megaEvolutions[0].form;
    }
    return null;
  });

  const [isFemale, setIsFemale] = useState(pokemon.ownershipStatus.gender === 'Female');
  const [isLucky, setIsLucky] = useState(pokemon.ownershipStatus.lucky);
  const [currentImage, setCurrentImage] = useState(determineImageUrl(isFemale, pokemon, isMega));

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
    Stamina: pokemon.ownershipStatus.stamina_iv,
  });
  const [locationCaught, setLocationCaught] = useState(pokemon.ownershipStatus.location_caught);
  const [dateCaught, setDateCaught] = useState(pokemon.ownershipStatus.date_caught);
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

  useEffect(() => {
    const updatedImage = determineImageUrl(isFemale, pokemon, isMega, megaForm);
    setCurrentImage(updatedImage); 
  }, [isFemale, isMega, pokemon, megaForm]);

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    setIsFemale(newGender === 'Female'); // Update the gender state and isFemale
  };

  const handleMegaToggle = (newMegaStatus, specificForm = null) => {
    setIsMega(newMegaStatus);
    if (newMegaStatus) {
      setMega(true); // Once mega is activated, the Pokémon is marked as having mega-evolved.
      setMegaForm(specificForm || pokemon.megaEvolutions[0].form);
    } else {
      setMegaForm(null);
    }
  };

  // Update the handleMegaFormChange function
  const handleMegaFormChange = () => {
    if (!pokemon.megaEvolutions || pokemon.megaEvolutions.length <= 1) return;
    
    const currentIndex = pokemon.megaEvolutions.findIndex(
        me => me.form.toLowerCase() === megaForm?.toLowerCase()
    );
    const nextIndex = (currentIndex + 1) % pokemon.megaEvolutions.length;
    setMegaForm(pokemon.megaEvolutions[nextIndex].form);
  };

  const handleCPChange = (newCP) => {
    setCP(newCP);
  };

  const handleLuckyToggle = (newLuckyStatus) => {
    setIsLucky(newLuckyStatus);
  };

  const handleNicknameChange = (newNickname) => {
    setNickname(newNickname);
  };

  const handleFavoriteChange = (newFavoriteStatus) => {
    setIsFavorite(newFavoriteStatus);
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
        date_caught: dateCaught,
        location_card: selectedBackground ? selectedBackground.background_id : null,
        mega: mega,
        is_mega: isMega,
        mega_form: isMega ? megaForm : null
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
    <div className="owned-instance">
      <div className="top-row">
        {isEditable && (
          <EditSaveComponent editMode={editMode} toggleEditMode={toggleEditMode} />
        )}
        <CPComponent pokemon={pokemon} editMode={editMode} toggleEditMode={toggleEditMode} onCPChange={handleCPChange} />
        <FavoriteComponent pokemon={pokemon} editMode={editMode} onFavoriteChange={handleFavoriteChange} />
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
          {isLucky && <img src={process.env.PUBLIC_URL + '/images/lucky.png'} alt="Lucky Backdrop" className="lucky-backdrop" />}
          <img src={currentImage} alt={pokemon.name} className="pokemon-image" />
        </div>
      </div>
      <div className="name-mega-container">
        <NameComponent pokemon={pokemon} editMode={editMode} onNicknameChange={handleNicknameChange} />
        {pokemon.megaEvolutions &&
          pokemon.megaEvolutions.length > 0 &&
          !pokemon.ownershipStatus.shadow && // Ensure shadow ownership is false
          !pokemon.name.toLowerCase().includes("clone") && ( // Ensure name does not include "clone"
            <MegaComponent
              isMega={isMega}
              onToggleMega={handleMegaToggle}
              editMode={editMode}
              megaEvolutions={pokemon.megaEvolutions}
              currentMegaForm={megaForm}
              onMegaFormChange={handleMegaFormChange}
            />
        )}
      </div>
      <div className="gender-lucky-row">
        {pokemon.ownershipStatus.shadow || pokemon.ownershipStatus.is_for_trade || pokemon.rarity === "Mythic" ? (
          <div className="lucky-placeholder"></div>
        ) : (
          <LuckyComponent pokemon={pokemon} onToggleLucky={handleLuckyToggle} isLucky={isLucky} editMode={editMode} />
        )}
        <GenderComponent 
          pokemon={pokemon} 
          editMode={editMode} 
          isFemale={isFemale} 
          onGenderChange={handleGenderChange}
        />
      </div>
      <div className="stats-container">
        <WeightComponent pokemon={pokemon} editMode={editMode} onWeightChange={handleWeightChange} />
        <TypeComponent pokemon={pokemon} />
        <HeightComponent pokemon={pokemon} editMode={editMode} onHeightChange={handleHeightChange} />
      </div>
      <div className="moves-content">
        <MovesComponent pokemon={pokemon} editMode={editMode} onMovesChange={handleMovesChange} />
      </div>
      <div className="iv-component">
        <IVComponent pokemon={pokemon} editMode={editMode} onIvChange={handleIvChange} />
      </div>
      <div className="location-caught-component">
        <LocationCaughtComponent pokemon={pokemon} editMode={editMode} onLocationChange={handleLocationCaughtChange} />
      </div>
      <div className="date-caught-component">
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

export default OwnedInstance;
