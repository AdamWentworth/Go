// FindTradesCard.jsx

import React from 'react';
import './FindTradesCard.css';

const FindTradesCard = () => {
  return (
    <div className="card">
      <h3>Find Trades</h3>
      <p>
        Use the search feature to find your <strong>Friends</strong> or <strong>Pokémon</strong> and propose trades that match your interests.
      </p>
      <div className="trade-images">
        <div className="pokemon-frame findtrades-detective-pikachu">
          <img src="/images/costumes_shiny/pokemon_25_detective_shiny.png" alt="Shiny Detective Pikachu" className="pokemon-img" />
          <p className="pokemon-name smaller-text">Shiny Detective Pikachu</p>
        </div>
        <img src="/images/pogo_trade_icon.png" alt="Trade Icon" className="trade-icon" />
        <div className="pokemon-frame findtrades-nightcap-snorlax">
          <img src="/images/costumes_shiny/pokemon_143_nightcap_shiny.png" alt="Shiny Nightcap Snorlax" className="pokemon-img" />
          <p className="pokemon-name smaller-text">Shiny Nightcap Snorlax</p>
        </div>
      </div>
    </div>
  );
};

export default FindTradesCard;
