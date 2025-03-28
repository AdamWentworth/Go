// SearchMenu.jsx

import React from 'react';
import { createPortal } from 'react-dom';
import './SearchMenu.css';

const filterSections = {
  Variants: ['Shiny', 'Costume', 'Shadow', 'Mega', 'Dynamax', 'Gigantamax'],
  Qualities: ['Lucky', 'XXS', 'XXL', '100%'],
  Rarity: ['Legendary', 'Mythical', 'Regional'],
  Region: [
    'Kanto',
    'Johto',
    'Hoenn',
    'Sinnoh',
    'Unova',
    'Kalos',
    'Alola',
    'Galar',
    'Hisui',
    'Paldea',
  ],
  Types: [
    'Normal',
    'Fighting',
    'Flying',
    'Poison',
    'Ground',
    'Rock',
    'Bug',
    'Ghost',
    'Steel',
    'Fire',
    'Water',
    'Grass',
    'Electric',
    'Psychic',
    'Ice',
    'Dragon',
    'Dark',
    'Fairy',
  ],
};

const regionClassMap = {
  Kanto: 'kanto-region',
  Johto: 'johto-region',
  Hoenn: 'hoenn-region',
  Sinnoh: 'sinnoh-region',
  Unova: 'unova-region',
  Kalos: 'kalos-region',
  Alola: 'alola-region',
  Galar: 'galar-region',
  Hisui: 'hisui-region',
  Paldea: 'paldea-region',
};

function SearchMenu({ onFilterClick, onCloseMenu }) {
  const handleFilterItemClick = (filter) => {
    onFilterClick(filter);
  };

  return (
    <div className="search-menu">

      {Object.keys(filterSections).map((section) => (
        <div key={section} className="search-menu-section">
          <h3 className="section-title">{section}</h3>
          <div className="filters-grid">
            {filterSections[section].map((filter) => (
              <div
                key={filter}
                className="filter-item"
                onClick={() => handleFilterItemClick(filter)}
              >
                <div
                  className={`filter-image ${
                    section === 'Region'
                      ? `region-background ${regionClassMap[filter] || ''}`
                      : section === 'Types'
                      ? 'types'
                      : filter === 'Shiny'
                      ? 'shiny-background'
                      : filter === 'Costume'
                      ? 'costume-background'
                      : filter === 'Shadow'
                      ? 'shadow-background'
                      : filter === 'Mega'
                      ? 'mega-background'
                      : filter === 'Dynamax'
                      ? 'dynamax-background'
                      : filter === 'Gigantamax'
                      ? 'gigantamax-background'
                      : filter === 'Lucky'
                      ? 'lucky-background'
                      : filter === 'XXS'
                      ? 'xxs-background'
                      : filter === 'XXL'
                      ? 'xxl-background'
                      : filter === '100%'
                      ? 'percent-background'
                      : filter === 'Legendary'
                      ? 'legendary-background'
                      : filter === 'Mythical'
                      ? 'mythical-background'
                      : filter === 'Regional' && section !== 'Region'
                      ? 'regional-background'
                      : ''
                  }`}
                >
                  <img
                    src={
                      section === 'Region'
                        ? `/images/${filter.toLowerCase()}_search.png`
                        : section === 'Types'
                        ? `/images/types/${filter.toLowerCase()}.png`
                        : filter === 'Shiny'
                        ? '/images/shiny_search.png'
                        : filter === 'Costume'
                        ? '/images/costume_search.png'
                        : filter === 'Shadow'
                        ? '/images/shadow_search.png'
                        : filter === 'Mega'
                        ? '/images/mega_search.png'
                        : filter === 'Dynamax'
                        ? '/images/dynamax_search.png'
                        : filter === 'Gigantamax'
                        ? '/images/gigantamax_search.png'
                        : filter === 'Lucky'
                        ? '/images/lucky-icon.png'
                        : filter === 'XXS'
                        ? '/images/xxs.png'
                        : filter === 'XXL'
                        ? '/images/xxl.png'
                        : filter === '100%'
                        ? '/images/appraisal_04.png'
                        : filter === 'Legendary'
                        ? '/images/legendary_search.png'
                        : filter === 'Mythical'
                        ? '/images/mythical_search.png'
                        : filter === 'Regional'
                        ? '/images/regional_search.png'
                        : 'https://via.placeholder.com/80'
                    }
                    alt={filter}
                  />
                </div>
                <div className="filter-label">{filter}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SearchMenu;
