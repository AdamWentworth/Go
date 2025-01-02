// MegaPokemonSelection.jsx

import React, { useState, useEffect, useContext } from 'react';
import './MegaPokemonSelection.css'; // Ensure this file exists and is correctly imported
import OwnedInstance from '../../InstanceOverlayComponents/OwnedInstance';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext'; // Adjust the path as necessary

const MegaPokemonSelection = ({
  ownedPokemon,
  onAssignExisting,
  onCreateNew,
  onCancel,
}) => {
  const { updateDetails, updateLists } = useContext(PokemonDataContext);
  const [error, setError] = useState(null); // State to handle errors

  // Handler to assign existing Mega Pokémon
  const handleAssignExisting = async (instanceId) => {
    try {
      // Example action: Mark the instance as Mega Evolved
      await updateDetails(instanceId, { is_mega_evolved: true });

      await updateLists();

      console.log(`Instance ${instanceId} assigned to existing Mega Pokémon.`);
      onAssignExisting(instanceId); // Notify parent if necessary
    } catch (err) {
      console.error(`Error assigning instance ${instanceId} to existing Mega Pokémon:`, err);
      setError(`Failed to assign instance ${instanceId}.`);
    }
  };

  // Handler to create a new Mega Pokémon
  const handleCreateNew = async () => {
    try {
      // Example action: Create a new Mega Pokémon instance
      await updateDetails(null, { is_mega_evolved: true }); // Adjust payload as necessary

      await updateLists();

      console.log(`New Mega Pokémon created.`);
      onCreateNew(); // Notify parent if necessary
    } catch (err) {
      console.error(`Error creating new Mega Pokémon:`, err);
      setError(`Failed to create a new Mega Pokémon.`);
    }
  };

  return (
    <div
      className="mega-pokemon-selection-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mega-modal-title"
    >
      <div className="mega-modal-content">
        <h2 id="mega-modal-title">Mega Evolve Pokémon</h2>

        {/* Error Message */}
        {error && <p className="error">{error}</p>}

        {/* Render OwnedInstance Components */}
        {ownedPokemon.length > 0 ? (
          <div className="mega-pokemon-list">
            {ownedPokemon.map((pokemon) => {
              const { instance_id, variantData } = pokemon;

              if (!variantData) {
                return (
                  <div key={instance_id} className="mega-pokemon-item">
                    <p>Error loading data for Pokémon with Instance ID: {instance_id}</p>
                  </div>
                );
              }

              // Combine variant data with ownership data
              const combinedData = {
                ...variantData,
                ownershipStatus: {
                  ...pokemon,
                },
              };

              return (
                <div key={instance_id} className="mega-pokemon-item">
                  <OwnedInstance pokemon={combinedData} />
                  <div className="mega-actions">
                    <button onClick={() => handleAssignExisting(instance_id)}>
                      Mega Evolve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No owned Mega Pokémon found.</p>
        )}

        {/* Create New Button */}
        <div className="create-new-action">
          <button onClick={handleCreateNew}>
            Generate and Evolve New
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mega-modal-actions">
          <button onClick={onCancel} className="close-button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MegaPokemonSelection;
