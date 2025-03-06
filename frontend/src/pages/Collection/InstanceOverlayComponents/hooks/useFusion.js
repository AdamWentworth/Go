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
    
    // --- 1) Check if OUR current Pokémon is for trade or not owned ---
    if (!pokemon.ownershipStatus?.is_owned) {
      alert(`This Pokémon is not owned. You cannot fuse with a non-owned instance.`);
      return;
    }
    if (pokemon.ownershipStatus?.is_for_trade) {
      alert(`This instance is listed "for trade". Remove it from trade listings before fusing.`);
      return;
    }

    // If we pass those checks, proceed to set pendingFusionId
    setFusion(prev => ({
      ...prev,
      pendingFusionId: fusionId
    }));

    // --- 2) Look up the partner instance to fuse with ---
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
        // Gather all potential matches for the second base ID
        const ownershipMatches = allOwnership.filter(data =>
          data.instance_id && data.instance_id.startsWith(`${padded}-`)
        );

        console.log('[useFusion] Potential ownershipMatches:', ownershipMatches);

        // --- 3) Filter out any ownership instance that is not viable ---
        // e.g., it's not owned, it's for trade, or it's disabled (already fused)
        const validMatches = ownershipMatches.filter(match => {
          const reasons = [];
          if (!match.is_owned) {
            reasons.push('not owned');
          }
          if (match.is_for_trade) {
            reasons.push('for trade');
          }
          if (match.disabled) {
            reasons.push('disabled');
          }

          if (reasons.length > 0) {
            console.log(`[useFusion] Excluding ${match.instance_id} because: ${reasons.join(', ')}`);
          }
          return reasons.length === 0; // Only keep if no invalid reasons
        });

        if (validMatches.length === 0) {
          alert(`No valid instance found for fusion with base_pokemon_id2 ${baseId2}.
All matches were either not owned, for trade, or already fused (disabled).`);
          return;
        }

        // If you only want the *first* valid match:
        const foundOwnership = validMatches[0];

        // If checks pass, set the overlay so user can confirm fuse
        setFusion(prev => ({
          ...prev,
          overlayPokemon: {
            ...variantMatch,
            ownershipStatus: foundOwnership
          }
        }));
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
        // Find the fusion data in the array for a readable name
        const foundFusion = pokemon.fusion.find(f => f.fusion_id === prev.pendingFusionId);
        const fusionName = foundFusion ? foundFusion.name : `Fusion ${prev.pendingFusionId}`;

        updated.is_fused = true;
        updated.fusion_form = fusionName;

        // If we found a second instance to fuse with, record its instance_id
        if (prev.overlayPokemon?.ownershipStatus?.instance_id) {
          updated.fusedWith = prev.overlayPokemon.ownershipStatus.instance_id;
          updated.fusedOtherInstanceKey = prev.overlayPokemon.ownershipStatus.instance_id;

          // If you also want to set the partner's "disabled = true" once fused, you can do so
          // (But you'd need an update back to your DB if you want it persistent)
        }

        // Permanently record that we have used this fusion_id in the storedFusionObject
        updated.storedFusionObject = {
          ...prev.storedFusionObject,
          [prev.pendingFusionId]: true
        };

        // Clear out the pendingFusionId since user has proceeded
        updated.pendingFusionId = null;
      }

      // We no longer need the overlay once we finish fusing
      updated.overlayPokemon = null;

      console.log('handleFuseProceed updated fusion state:', updated);
      return updated;
    });
  };

  const handleUndoFusion = () => {
    console.log('handleUndoFusion called');
    // Note: we do *not* remove anything from storedFusionObject here—so we retain history
    setFusion(prev => ({
      ...prev,
      is_fused: false,
      fusion_form: null,
      fusedWith: null,
      fusedOtherInstanceKey: null,
    }));
  };

  return {
    fusion,
    setFusion,
    handleFusionToggle,
    handleFuseProceed,
    handleUndoFusion,
  };
};
