// MaxComponent.jsx

import React from 'react';
import PropTypes from 'prop-types';
import './MaxComponent.css';

const MaxComponent = ({ 
    pokemon, 
    editMode, 
    dynamax, 
    gigantamax, 
    onToggleMax,
    showMaxOptions // New prop to indicate the current state
}) => {
    // Early return if conditions are not met
    if (
        !editMode || 
        !Array.isArray(pokemon.max) || 
        pokemon.max.length === 0 || 
        pokemon.ownershipStatus.shadow || 
        pokemon.ownershipStatus.purified || 
        (pokemon.variantType && pokemon.variantType.includes('costume'))
    ) {
        return null;
    }      

    const maxEntry = pokemon.max[0];
    if (!maxEntry) return null;

    return (
        <div className="max-component">
            <div 
                className="max-icon" 
                onClick={onToggleMax} 
                style={{ cursor: 'pointer' }}
                aria-expanded={showMaxOptions}
                aria-controls={`max-options-${pokemon.pokemonKey}`}
            >
                <img
                    src={
                        gigantamax
                        ? process.env.PUBLIC_URL + '/images/gigantamax-icon.png'
                        : process.env.PUBLIC_URL + '/images/dynamax-icon.png'
                    }
                    alt={gigantamax ? 'Gigantamax' : 'Dynamax'}
                    className={gigantamax || dynamax ? 'saturated' : 'desaturated'}
                />
            </div>
        </div>
    );
};

MaxComponent.propTypes = {
    pokemon: PropTypes.shape({
        max: PropTypes.arrayOf(
            PropTypes.shape({
                dynamax: PropTypes.number,
                gigantamax: PropTypes.number,
                dynamax_release_date: PropTypes.string,
                gigantamax_image_url: PropTypes.string,
                gigantamax_release_date: PropTypes.string,
                pokemon_id: PropTypes.number,
                shiny_gigantamax_image_url: PropTypes.string,
            })
        ).isRequired,
        ownershipStatus: PropTypes.shape({
            shadow: PropTypes.bool,
            purified: PropTypes.bool,
            // Include other relevant ownershipStatus fields if necessary
        }).isRequired,
        variantType: PropTypes.string,
    }).isRequired,
    editMode: PropTypes.bool.isRequired,
    dynamax: PropTypes.bool.isRequired,
    gigantamax: PropTypes.bool.isRequired,
    onToggleMax: PropTypes.func.isRequired,
    showMaxOptions: PropTypes.bool.isRequired, // New prop
};

export default MaxComponent;
