// TradeCard.jsx

import React from 'react';
import './TradeCard.css';

const TradeCard = () => {
  return (
    <div className="card trade">
      <h3>Add to Your Trade List</h3>
      <p>
        Use tags to list your Pokémon for <strong className="trade-text">Trade</strong> and customize trade preferences for each listed Pokémon as you desire.
      </p>
      <div className="pokemon-frame detective-pikachu centered-frame">
        <img src="/images/costumes_shiny/pokemon_25_detective_shiny.png" alt="Shiny Detective Pikachu" className="pokemon-img large-img" />
        <p className="pokemon-name small-text">Shiny Detective Pikachu</p>
      </div>
    </div>
  );
};

export default TradeCard;
