// SecondarySection.jsx

import React from 'react';
import './SecondarySection.css';

const SecondarySection = () => {
  return (
    <div className="row">
      <div className="card">
        <img src="/images/btn_pokemon.png" alt="Pokémon Button" />
        <h3>Catalog Your Pokémon</h3>
        <p>
          Access a complete, up-to-date Pokédex where you can add, customize, and list your Pokémon for trade.
        </p>
      </div>
      <div className="card">
        <h3>Manage &amp; Trade</h3>
        <p>
          Keep track of your trade inventory and wishlist, and coordinate trades with nearby trainers.
        </p>
      </div>
    </div>
  );
};

export default SecondarySection;
