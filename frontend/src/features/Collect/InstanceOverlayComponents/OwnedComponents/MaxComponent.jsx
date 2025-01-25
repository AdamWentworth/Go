// MaxComponent.jsx

import React from 'react';
import PropTypes from 'prop-types';
import './MaxComponent.css'; // Optional: Create this file for styling

const MaxComponent = ({ pokemon, editMode }) => {
  // Conditional Rendering: Only render if editMode is true and pokemon.max is not empty
  if (!editMode || !Array.isArray(pokemon.max) || pokemon.max.length === 0) {
    return null;
  }

  return (
    <div className="max-component">
      <h3>Max Details</h3>
      <ul>
        {pokemon.max.map((item, index) => (
          <li key={index}>
            {/* Customize the rendering based on the structure of items in pokemon.max */}
            {item.name}: {item.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

MaxComponent.propTypes = {
  pokemon: PropTypes.shape({
    max: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.any.isRequired,
      })
    ),
    // Include other properties of pokemon as needed
  }).isRequired,
  editMode: PropTypes.bool.isRequired,
};

export default MaxComponent;
