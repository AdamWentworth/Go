// FavoriteComponent.jsx
import React, { useState, useEffect } from 'react';
import './FavoriteComponent.css'

const FavoriteComponent = ({ pokemon }) => {
  // Set initial favorite state based on the pokemon's favorite status
  const [isFavorite, setIsFavorite] = useState(pokemon.ownershipStatus.favorite);

  // Determine the correct image based on the favorite status
  const favoriteImage = isFavorite
    ? process.env.PUBLIC_URL + '/images/fav_pressed.png'
    : process.env.PUBLIC_URL + '/images/fav_unpressed.png';

  // Toggle favorite status and image
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="favorite-component" onClick={toggleFavorite}>
      <img src={favoriteImage} alt={isFavorite ? 'Favorite' : 'Not Favorite'} />
    </div>
  );
}

export default FavoriteComponent;
