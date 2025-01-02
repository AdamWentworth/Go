// MegaPokemonSelection.jsx

import React, { useState, useContext } from 'react';
import './MegaPokemonSelection.css';
import OwnedInstance from '../../InstanceOverlayComponents/OwnedInstance';
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';
import CloseButton from '../../../../components/CloseButton';

const MegaPokemonSelection = ({
  ownedPokemon,
  onAssignExisting,
  onCreateNew,
  onCancel,
}) => {
  const { updateDetails, updateLists } = useContext(PokemonDataContext);
  const [error, setError] = useState(null);

  const handleAssignExisting = async (instanceId) => {
    console.log(`Initiating mega evolution for Instance ID: ${instanceId}`);
    try {
      // Update the specific Pokémon instance with mega: true
      await updateDetails(instanceId, { mega: true });
      console.log(`Successfully set mega: true for Instance ID: ${instanceId}`);

      // Refresh the Pokémon lists
      await updateLists();
      console.log(`Updated Pokémon lists after mega evolution for Instance ID: ${instanceId}`);

      // Callback to parent component
      onAssignExisting(instanceId);
    } catch (err) {
      console.error(`Error assigning Instance ID ${instanceId} to Mega Pokémon:`, err);
      setError(`Failed to assign Instance ID ${instanceId} to Mega Pokémon.`);
    }
  };

  const handleCreateNew = async () => {
    console.log('Initiating creation of a new Mega Pokémon');
    try {
      // Create a new Mega Pokémon by setting mega: true without a specific instance ID
      await updateDetails(null, { mega: true });
      console.log('Successfully created a new Mega Pokémon');

      // Refresh the Pokémon lists
      await updateLists();
      console.log('Updated Pokémon lists after creating a new Mega Pokémon');

      // Callback to parent component
      onCreateNew();
    } catch (err) {
      console.error('Error creating a new Mega Pokémon:', err);
      setError('Failed to create a new Mega Pokémon.');
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

        {/* Create New Button */}
        <div className="create-new-action">
          <button onClick={handleCreateNew}>
            Generate and Evolve New
          </button>
        </div>

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

              const combinedData = {
                ...variantData,
                ownershipStatus: { ...pokemon },
              };

              return (
                <div key={instance_id} className="mega-pokemon-item">
                  <div className="mega-actions">
                    <button onClick={() => handleAssignExisting(instance_id)}>
                      Mega Evolve
                    </button>
                  </div>
                  <OwnedInstance pokemon={combinedData} />
                </div>
              );
            })}
          </div>
        ) : (
          <p>No owned Mega Pokémon found.</p>
        )}

      </div>
      {/* Close Button Positioned at Bottom */}
      <CloseButton onClick={onCancel} />
    </div>
  );
};

export default MegaPokemonSelection;
