// useFusion.js
import { useState } from 'react';
import { getAllFromDB } from '../../../../services/indexedDB';

export const useFusion = (pokemon, alert) => {
  const [fusion, setFusion] = useState({
    is_fused: pokemon.ownershipStatus?.is_fused || false,
    fusion_form: pokemon.ownershipStatus?.fusion_form || null,
    fusedWith: pokemon.ownershipStatus?.fused_with || null,
    fusedOtherInstanceKey: null,
    storedFusionObject: (pokemon.ownershipStatus && pokemon.ownershipStatus.fusion) || {},
    overlayPokemon: null,
    pendingFusionId: null,
  });

  const handleFusionToggle = async (fusionId) => {
    console.log('handleFusionToggle called with fusionId:', fusionId);
    setFusion(prev => {
      const newState = { ...prev, pendingFusionId: fusionId };
      console.log('Updated pendingFusionId:', newState);
      return newState;
    });

    const selectedFusion = pokemon.fusion.find(f => f.fusion_id === fusionId);
    if (selectedFusion && selectedFusion.base_pokemon_id2) {
      const baseId2 = selectedFusion.base_pokemon_id2;
      const padded = baseId2.toString().padStart(4, '0');
      try {
        const variants = await getAllFromDB('pokemonVariants');
        const variantMatch = variants.find(v => v.pokemon_id === baseId2);
        if (!variantMatch) {
          alert(`No variant data found for base_pokemon_id2 ${baseId2}.`);
          return;
        }
        const allOwnership = await getAllFromDB('pokemonOwnership');
        const ownershipMatches = allOwnership.filter(data => 
          data.instance_id && data.instance_id.startsWith(`${padded}-`)
        );
        if (ownershipMatches.length > 0) {
          const foundOwnership = ownershipMatches[0];
          setFusion(prev => {
            const newState = {
              ...prev,
              overlayPokemon: {
                ...variantMatch,
                ownershipStatus: foundOwnership
              }
            };
            console.log('Updated overlayPokemon:', newState.overlayPokemon);
            return newState;
          });
        } else {
          alert(`No matching instances found for fusion base_pokemon_id2 ${baseId2}.`);
        }
      } catch (error) {
        console.error('Error retrieving data from indexedDB:', error);
      }
    }
  };

  const handleFuseProceed = () => {
    console.log('handleFuseProceed called');
    setFusion(prev => {
      let updated = { ...prev };
      if (prev.pendingFusionId) {
        // Look up the fusion name corresponding to the pendingFusionId
        const foundFusion = pokemon.fusion.find(f => f.fusion_id === prev.pendingFusionId);
        const fusionName = foundFusion ? foundFusion.name : prev.pendingFusionId;
  
        updated = { 
          ...updated, 
          is_fused: true, 
          fusion_form: fusionName  // Store the name
        };
        if (prev.overlayPokemon?.ownershipStatus?.instance_id) {
          updated.fusedWith = prev.overlayPokemon.ownershipStatus.instance_id;
          updated.fusedOtherInstanceKey = prev.overlayPokemon.ownershipStatus.instance_id;
        }
        updated.pendingFusionId = null;
      }
      updated.overlayPokemon = null;
      console.log('handleFuseProceed updated fusion state:', updated);
      return updated;
    });
  };
  
  const handleUndoFusion = () => {
    console.log('handleUndoFusion called');
    setFusion(prev => {
      const newState = {
        ...prev,
        is_fused: false,
        fusion_form: null,
        fusedWith: null,
      };
      console.log('handleUndoFusion updated fusion state:', newState);
      return newState;
    });
  };

  return {
    fusion,
    setFusion,
    handleFusionToggle,
    handleFuseProceed,
    handleUndoFusion,
  };
};
