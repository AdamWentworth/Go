// FavoriteComponent.jsx
import React, { useState } from 'react';
import './FavoriteComponent.css'

const FavoriteComponent = ({ pokemon, editMode }) => {
  const [isFavorite, setIsFavorite] = useState(pokemon.ownershipStatus.favorite);

  const favoriteImage = isFavorite
    ? process.env.PUBLIC_URL + '/images/fav_pressed.png'
    : process.env.PUBLIC_URL + '/images/fav_unpressed.png';

  const toggleFavorite = () => {
    if (editMode) {
      setIsFavorite(!isFavorite);
    }
  };

  return (
    <div className={`favorite-component ${editMode ? 'editable' : ''}`} onClick={toggleFavorite}>
      <img src={favoriteImage} alt={isFavorite ? 'Favorite' : 'Not Favorite'} />
    </div>
  );
}

export default FavoriteComponent;

