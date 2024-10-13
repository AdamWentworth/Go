// FavoriteComponent.jsx

import React, { useState, useEffect } from 'react';
import './FavoriteComponent.css'

const FavoriteComponent = ({ pokemon, editMode, onFavoriteChange }) => {
  const [isFavorite, setIsFavorite] = useState(pokemon.ownershipStatus.favorite);

  const favoriteImage = isFavorite
    ? process.env.PUBLIC_URL + '/images/fav_pressed.png'
    : process.env.PUBLIC_URL + '/images/fav_unpressed.png';

  const toggleFavorite = () => {
    if (editMode) {
      const newFavoriteStatus = !isFavorite;
      setIsFavorite(newFavoriteStatus);
      onFavoriteChange(newFavoriteStatus);  // Notify parent component of the change
    }
  };

  useEffect(() => {
    setIsFavorite(pokemon.ownershipStatus.favorite);  // Reset state when pokemon changes
  }, [pokemon]);

  return (
    <div className={`favorite-component ${editMode ? 'editable' : ''}`} onClick={toggleFavorite}>
      <img src={favoriteImage} alt={isFavorite ? 'Favorite' : 'Not Favorite'} />
    </div>
  );
}

export default FavoriteComponent;


