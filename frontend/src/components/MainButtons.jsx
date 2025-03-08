import React from 'react';
import { Link } from 'react-router-dom';
import './MainButtons.css';

function MainButtons() {
  return (
    <div className="mainButtonsContainerNavbar">
      <Link to="/pokemon">
        <button className="mainButton navbar-action-button button-pokemon">
          <div className="button-content">
            <img src="/images/btn_pokemon.png" alt="Pokémon" className="button-icon" />
            <span className="button-label">Pokémon</span>
          </div>
        </button>
      </Link>
      <Link to="/search">
        <button className="mainButton navbar-action-button button-search">
          <div className="button-content">
            <img src="/images/btn_search.png" alt="Search" className="button-icon" />
            <span className="button-label">Search</span>
          </div>
        </button>
      </Link>
      <Link to="/trades">
        <button className="mainButton navbar-action-button button-trades">
          <div className="button-content">
            <img src="/images/btn_trades.png" alt="Trades" className="button-icon" />
            <span className="button-label">Trades</span>
          </div>
        </button>
      </Link>
    </div>
  );
}

export default MainButtons;
