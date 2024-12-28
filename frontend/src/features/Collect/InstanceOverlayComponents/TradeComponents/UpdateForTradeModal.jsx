// UpdateForTradeModal.jsx

import React, { useState, useEffect, useRef, useContext } from 'react';
import './UpdateForTradeModal.css'; // Ensure this file exists and is correctly imported
import { PokemonDataContext } from '../../../../contexts/PokemonDataContext';

// Import the getFromDB function
import { getFromDB } from '../../../../services/indexedDB.js'; // Adjust the path based on your project structure

// Import the OwnedInstance component
import OwnedInstance from '../OwnedInstance.jsx'; // Adjust the path as necessary

const UpdateForTradeModal = ({
  ownedInstances,
  baseKey = null, // Set default value directly in destructuring
  onClose,
  onConfirm,
}) => {
  const { updateDetails, updateLists } = useContext(PokemonDataContext);
  const [loading, setLoading] = useState(false); // State to handle loading
  const [error, setError] = useState(null); // State to handle errors
  const [variantData, setVariantData] = useState(null); // State to hold fetched variant data
  const [restructuredData, setRestructuredData] = useState([]); // State to hold restructured data

  const modalContentRef = useRef(null); // Ref to the modal content

  // Fetch variant data based on baseKey
  useEffect(() => {
    const fetchVariantData = async () => {
      if (!baseKey) {
        console.warn('No baseKey provided to UpdateForTradeModal.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getFromDB('pokemonVariants', baseKey); // Ensure 'pokemonVariants' is the correct store name
        console.log('Fetched variant data:', data); // Log the fetched data for verification
        setVariantData(data);
      } catch (err) {
        console.error('Error fetching variant data:', err);
        setError('Failed to fetch variant data.');
      } finally {
        setLoading(false);
      }
    };

    fetchVariantData();
  }, [baseKey]);

  // Restructure ownedInstances by merging with variantData
  useEffect(() => {
    if (variantData && ownedInstances && ownedInstances.length > 0) {
      // Restructure ownedInstances
      const newRestructuredData = ownedInstances.map((instance) => ({
        // Spread all properties from variantData
        ...variantData,

        // Nest all instance-specific properties under ownershipStatus
        ownershipStatus: {
          ...instance,
        },
      }));

      console.log('Restructured Owned Instances:', newRestructuredData); // Log for verification
      setRestructuredData(newRestructuredData);
    }
  }, [variantData, ownedInstances]);

  // Handler to update a specific instance to be for trade
  const handleUpdateToTrade = async (instanceId) => {
    try {
      // Call updateDetails with instanceId and is_for_trade: true
      await updateDetails(instanceId, { is_for_trade: true });

      await updateLists();

      // Update local state to reflect the change
      const updatedData = restructuredData.map((pokemon) => {
        if (pokemon.ownershipStatus.instance_id === instanceId) {
          return {
            ...pokemon,
            ownershipStatus: {
              ...pokemon.ownershipStatus,
              is_for_trade: true,
            },
          };
        }
        return pokemon;
      });

      setRestructuredData(updatedData);
      console.log(`Instance ${instanceId} marked for trade.`);
    } catch (err) {
      console.error(`Error updating instance ${instanceId} for trade:`, err);
      setError(`Failed to update instance ${instanceId} for trade.`);
    }
  };

  // Close modal when clicking outside the modal content
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      className="update-for-trade-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" ref={modalContentRef}>
        <h2 id="modal-title">Update Instances for Trade</h2>

        {/* Loading Indicator */}
        {loading && <p>Loading variant data...</p>}

        {/* Error Message */}
        {error && <p className="error">{error}</p>}

        {/* Render OwnedInstance Components */}
        {!loading && !error && restructuredData.length > 0 && (
          <div className="instances-list">
            {restructuredData.map((pokemon) => (
              <div className="instance-item" key={pokemon.ownershipStatus.instance_id}>
                <OwnedInstance pokemon={pokemon} />
                <button
                  onClick={() => handleUpdateToTrade(pokemon.ownershipStatus.instance_id)}
                  className="update-button"
                  disabled={pokemon.ownershipStatus.is_for_trade}
                >
                  {pokemon.ownershipStatus.is_for_trade ? 'For Trade' : 'Add to For Trade'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Removed defaultProps as we've set default values in the function parameters

export default UpdateForTradeModal;
