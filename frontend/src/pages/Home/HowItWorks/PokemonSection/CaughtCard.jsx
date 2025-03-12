// CaughtCard.jsx

import React from 'react';
import './CaughtCard.css';

const CaughtCard = () => {
  return (
    <div className="card">
      <h3>Manage Your Collection</h3>
      <p>
        Seamlessly tag your Pokémon GO captures as <strong className="caught-text">Caught</strong> – ensuring each entry mirrors your Pokémon GO collection for an authentic experience.
      </p>
      <div className="pokemon-frame charizard centered-frame">
        <img src="/images/shiny/shiny_pokemon_6.png" alt="Shiny Charizard" className="pokemon-img large-img" />
        <p className="pokemon-name small-text">Shiny Charizard</p>
      </div>
    </div>
  );
};

export default CaughtCard;
