// WantedCard.jsx
import React from 'react';
import './WantedCard.css';

const WantedCard = () => {
  return (
    <div className="card wanted">
      <h3>Add to Your Wanted List</h3>
      <p>
        Use tags to track your <strong className="wanted-text">Wanted</strong> Pokémon and mark as <strong>Most Wanted</strong> to highlight the ones you value most.
      </p>
      <div className="pokemon-frame nightcap-snorlax centered-frame">
        {/* Add a unique class "wanted-bg" */}
        <div className="pokemon-image-container wanted-bg">
          <img
            src="/images/costumes_shiny/pokemon_143_nightcap_shiny.png"
            alt="Shiny Nightcap Snorlax"
            className="pokemon-img large-img"
          />
        </div>
        <p className="pokemon-name small-text">Shiny Nightcap Snorlax</p>
      </div>
    </div>
  );
};

export default WantedCard;
