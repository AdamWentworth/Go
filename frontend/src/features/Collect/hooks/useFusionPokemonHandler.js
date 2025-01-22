// useFusionPokemonHandler.js

import { useState, useContext } from 'react';
import { getAllFromDB, getFromDB } from '../../../services/indexedDB';
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';
import FusionPokemonSelection from '../PokemonOwnership/components/FusionPokemonSelection';
import { createNewInstanceData } from '../../../contexts/PokemonData/createNewInstanceData';
import { generateUUID } from '../../../utils/PokemonIDUtils';
import { PokemonDataContext } from '../../../contexts/PokemonDataContext';
import React from 'react';

/**
 * Custom hook to manage Fusion Pokémon selection and state.
 */
function useFusionPokemonHandler() {

  const { updateDetails, ownershipData } = React.useContext(PokemonDataContext);
  const [isFusionSelectionOpen, setIsFusionSelectionOpen] = useState(false);
  const [fusionSelectionData, setFusionSelectionData] = useState(null);

  /**
   * Parse the leading digits (e.g. "0800") from "0800-fusion_1".
   */
  function parseBaseNumber(key) {
    const match = key.match(/^(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Parse the fusion ID (e.g. "1" in "0800-fusion_1").
   */
  function parseFusionId(key) {
    const match = key.match(/fusion_(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * Check if it's shiny by looking for "shiny" in the key.
   */
  function parseShinyStatus(key) {
    return key.includes('shiny');
  }

  /**
   * For each user-owned candidate (i.e., matching base ID and filters),
   * also fetch its variant data (similar to Mega's approach).
   */
  async function getCandidatesForIdWithVariants(baseId, isShiny, ignoreShiny = false) {
    const ownershipArray = await getAllFromDB('pokemonOwnership');
    if (!ownershipArray || !Array.isArray(ownershipArray)) {
      throw new Error('[Fusion Handler] Invalid data from DB in getCandidatesForIdWithVariants');
    }
  
    // 1) Filter out invalid candidates
    const filtered = ownershipArray.filter((entry) => {
      if (!entry.instance_id?.startsWith(baseId.padStart(4, '0') + '-')) return false;
      if (!entry.is_owned) return false;
      if (entry.is_for_trade) return false;
      if (entry.is_fused) return false;
      if (entry.disabled) return false;
      if (!ignoreShiny) {
        const entryIsShiny = !!entry.shiny;
        if (entryIsShiny !== isShiny) return false;
      }
      return true;
    });
  
    console.log(
      `[Fusion Handler] getCandidatesForIdWithVariants(${baseId}, shiny=${isShiny}, ignoreShiny=${ignoreShiny}) => found ${filtered.length} candidate(s)`
    );

    // 2) For each candidate, fetch the matching variant data
    const enrichedCandidates = [];
    for (const candidate of filtered) {
      const { instance_id } = candidate;
      const parsedKey = parsePokemonKey(instance_id);
      if (!parsedKey) {
        console.warn(`[Fusion Handler] Could not parse instance_id: ${instance_id}`);
        continue;
      }

      // e.g. "0800-default"
      const candidateVariantKey = parsedKey.baseKey;
      try {
        const variantData = await getFromDB('pokemonVariants', candidateVariantKey);
        if (!variantData) {
          console.warn(`[Fusion Handler] No variant data found for ${candidateVariantKey}`);
          continue;
        }

        // Merge top-level variant data + nested ownershipStatus
        enrichedCandidates.push({
          ...variantData,
          ownershipStatus: candidate,
        });
      } catch (err) {
        console.error(`[Fusion Handler] Error fetching variantData for ${candidateVariantKey}:`, err);
      }
    }

    console.log(
      `[Fusion Handler] getCandidatesForIdWithVariants => returning ${enrichedCandidates.length} enriched candidate(s)`
    );
    return enrichedCandidates;
  }

  /**
   * Main logic for retrieving the two sets of candidate Pokémon (left & right),
   * based on which fusion is selected.
   */
  async function handleFusionPokemon(baseKey) {
    console.log('[Fusion Handler] handleFusionPokemon called with baseKey:', baseKey);

    // 1) Parse out baseNumber, fusionId, isShiny
    const baseNumber = parseBaseNumber(baseKey); // "0800"
    const fusionIdStr = parseFusionId(baseKey);  // "1" or "2", etc.
    const isShiny = parseShinyStatus(baseKey);

    if (!baseNumber || !fusionIdStr) {
      throw new Error(`[Fusion Handler] Could not parse baseNumber/fusionId from key: ${baseKey}`);
    }
    console.log(`[Fusion Handler] baseNumber=${baseNumber}, fusionId=${fusionIdStr}, isShiny=${isShiny}`);

    // 2) Retrieve the "parent" variant data (e.g. "0800-default" or "0800-shiny")
    const variantKey = isShiny ? `${baseNumber}-shiny` : `${baseNumber}-default`;
    console.log('[Fusion Handler] Retrieving parent variant:', variantKey);

    const parentVariant = await getFromDB('pokemonVariants', variantKey);
    if (!parentVariant) {
      throw new Error(`[Fusion Handler] No variant data found for key ${variantKey}`);
    }

    // 3) If 'fusion' is an array, find the correct object. If it's an object, convert to array.
    const fusionList = Array.isArray(parentVariant.fusion)
      ? parentVariant.fusion
      : Object.values(parentVariant.fusion || {});

    const fusionId = parseInt(fusionIdStr, 10);
    console.log('[Fusion Handler] Searching in fusion data array for fusion_id=', fusionId);
    const fusionData = fusionList.find((f) => f.fusion_id === fusionId);
    if (!fusionData) {
      throw new Error(`[Fusion Handler] No matching fusion object for fusion_id=${fusionId}`);
    }

    console.log('[Fusion Handler] Found fusion data =>', fusionData);
    const { base_pokemon_id1, base_pokemon_id2 } = fusionData;

    // 4) Gather "enriched" candidates for each parent ID
    const leftCandidates = await getCandidatesForIdWithVariants(String(base_pokemon_id1), isShiny, false); // enforce shiny requirement
    const rightCandidates = await getCandidatesForIdWithVariants(String(base_pokemon_id2), isShiny, true); // ignore shiny requirement

    // 5) Return everything needed for the UI
    return {
      fusionId: fusionIdStr,    // e.g. "1"
      baseNumber,               // e.g. "0800"
      isShiny,
      leftBaseId: base_pokemon_id1,
      rightBaseId: base_pokemon_id2,
      leftCandidatesList: leftCandidates,   // each is { ...variantData, ownershipStatus: { ... } }
      rightCandidatesList: rightCandidates, // each is { ...variantData, ownershipStatus: { ... } }
      parentVariant,
      fusionData,
    };
  }

  /**
   * Handler to create a new fused Pokémon for the left parent.
   */
  async function handleCreateNewLeft() {
    console.log('[Fusion Handler] handleCreateNewLeft called');
    if (!fusionSelectionData) {
      console.error('[Fusion Handler] Fusion selection data is not available.');
      return;
    }

    const { baseNumber, isShiny, leftBaseId, fusionData } = fusionSelectionData;
    const leftVariantKey = isShiny ? `${baseNumber}-shiny` : `${baseNumber}-default`;
    console.log('[Fusion Handler] Fetching variant data for left side:', leftVariantKey);

    try {
      const leftVariantData = await getFromDB('pokemonVariants', leftVariantKey);
      if (!leftVariantData) {
        throw new Error(`Variant data not found for key: ${leftVariantKey}`);
      }

      const newInstanceData = createNewInstanceData(leftVariantData);
      const uuid = generateUUID();
      const newInstanceId = `${leftVariantData.pokemonKey}_${uuid}`;
      newInstanceData.instance_id = newInstanceId;

      newInstanceData.is_owned = true;
      newInstanceData.is_unowned = false;
      newInstanceData.is_for_trade = false;
      newInstanceData.shiny = isShiny; // Must match fusion's shiny status

      await updateDetails(newInstanceId, newInstanceData);
      console.log(`[Fusion Handler] Successfully created new fused Pokémon: ${newInstanceId}`);

      const enrichedVariantData = await getFromDB('pokemonVariants', leftVariantKey);
      if (!enrichedVariantData) {
        throw new Error(`Failed to fetch variant data for newly created instance: ${leftVariantKey}`);
      }

      const enrichedCandidate = {
        ...enrichedVariantData,
        ownershipStatus: newInstanceData,
      };

      setFusionSelectionData((prevData) => ({
        ...prevData,
        leftCandidatesList: [...prevData.leftCandidatesList, enrichedCandidate],
      }));

      console.log('[Fusion Handler] Left candidates list updated with new instance.');
    } catch (err) {
      console.error('[Fusion Handler] Error creating new fused Pokémon for left:', err);
      setFusionSelectionData((prevData) => ({
        ...prevData,
        error: 'Failed to create a new fused Pokémon for the left parent.',
      }));
    }
  }

  /**
   * Handler to create a new fused Pokémon for the right parent.
   */
  async function handleCreateNewRight() {
    console.log('[Fusion Handler] handleCreateNewRight called');
    if (!fusionSelectionData) {
      console.error('[Fusion Handler] Fusion selection data is not available.');
      return;
    }

    const { baseNumber, fusionData } = fusionSelectionData;
    const rightVariantKey = `${fusionData.base_pokemon_id2}`.padStart(4, '0') + '-default';
    console.log('[Fusion Handler] Fetching variant data for right side:', rightVariantKey);

    try {
      const rightVariantData = await getFromDB('pokemonVariants', rightVariantKey);
      if (!rightVariantData) {
        throw new Error(`Variant data not found for key: ${rightVariantKey}`);
      }

      const newInstanceData = createNewInstanceData(rightVariantData);
      const uuid = generateUUID();
      const newInstanceId = `${rightVariantData.pokemonKey}_${uuid}`;
      newInstanceData.instance_id = newInstanceId;

      newInstanceData.is_owned = true;
      newInstanceData.is_unowned = false;
      newInstanceData.is_for_trade = false;
      newInstanceData.shiny = false; // Right side doesn't enforce shiny

      await updateDetails(newInstanceId, newInstanceData);
      console.log(`[Fusion Handler] Successfully created new fused Pokémon: ${newInstanceId}`);

      const enrichedVariantData = await getFromDB('pokemonVariants', rightVariantKey);
      if (!enrichedVariantData) {
        throw new Error(`Failed to fetch variant data for newly created instance: ${rightVariantKey}`);
      }

      const enrichedCandidate = {
        ...enrichedVariantData,
        ownershipStatus: newInstanceData,
      };

      setFusionSelectionData((prevData) => ({
        ...prevData,
        rightCandidatesList: [...prevData.rightCandidatesList, enrichedCandidate],
      }));

      console.log('[Fusion Handler] Right candidates list updated with new instance.');
    } catch (err) {
      console.error('[Fusion Handler] Error creating new fused Pokémon for right:', err);
      setFusionSelectionData((prevData) => ({
        ...prevData,
        error: 'Failed to create a new fused Pokémon for the right parent.',
      }));
    }
  }

  /**
   * Main logic for retrieving the two sets of candidate Pokémon (left & right),
   * based on which fusion is selected.
   */
  async function handleFusionPokemon(baseKey) {
    console.log('[Fusion Handler] handleFusionPokemon called with baseKey:', baseKey);

    // 1) Parse out baseNumber, fusionId, isShiny
    const baseNumber = parseBaseNumber(baseKey); // "0800"
    const fusionIdStr = parseFusionId(baseKey);  // "1" or "2", etc.
    const isShiny = parseShinyStatus(baseKey);

    if (!baseNumber || !fusionIdStr) {
      throw new Error(`[Fusion Handler] Could not parse baseNumber/fusionId from key: ${baseKey}`);
    }
    console.log(`[Fusion Handler] baseNumber=${baseNumber}, fusionId=${fusionIdStr}, isShiny=${isShiny}`);

    // 2) Retrieve the "parent" variant data (e.g. "0800-default" or "0800-shiny")
    const variantKey = isShiny ? `${baseNumber}-shiny` : `${baseNumber}-default`;
    console.log('[Fusion Handler] Retrieving parent variant:', variantKey);

    const parentVariant = await getFromDB('pokemonVariants', variantKey);
    if (!parentVariant) {
      throw new Error(`[Fusion Handler] No variant data found for key ${variantKey}`);
    }

    // 3) If 'fusion' is an array, find the correct object. If it's an object, convert to array.
    const fusionList = Array.isArray(parentVariant.fusion)
      ? parentVariant.fusion
      : Object.values(parentVariant.fusion || {});

    const fusionId = parseInt(fusionIdStr, 10);
    console.log('[Fusion Handler] Searching in fusion data array for fusion_id=', fusionId);
    const fusionData = fusionList.find((f) => f.fusion_id === fusionId);
    if (!fusionData) {
      throw new Error(`[Fusion Handler] No matching fusion object for fusion_id=${fusionId}`);
    }

    console.log('[Fusion Handler] Found fusion data =>', fusionData);
    const { base_pokemon_id1, base_pokemon_id2 } = fusionData;

    // 4) Gather "enriched" candidates for each parent ID
    const leftCandidates = await getCandidatesForIdWithVariants(String(base_pokemon_id1), isShiny, false); // enforce shiny requirement
    const rightCandidates = await getCandidatesForIdWithVariants(String(base_pokemon_id2), isShiny, true); // ignore shiny requirement

    // 5) Return everything needed for the UI
    return {
      fusionId: fusionIdStr,    // e.g. "1"
      baseNumber,               // e.g. "0800"
      isShiny,
      leftBaseId: base_pokemon_id1,
      rightBaseId: base_pokemon_id2,
      leftCandidatesList: leftCandidates,   // each is { ...variantData, ownershipStatus: { ... } }
      rightCandidatesList: rightCandidates, // each is { ...variantData, ownershipStatus: { ... } }
      parentVariant,
      fusionData,
      error: null, // Initialize error as null
    };
  }

  /**
   * Exposed function to open the Fusion selection modal.
   */
  function promptFusionPokemonSelection(baseKey) {
    console.log('[Fusion Handler] promptFusionPokemonSelection called with baseKey:', baseKey);

    return new Promise(async (resolve, reject) => {
      try {
        const fusionDetails = await handleFusionPokemon(baseKey);
        console.log('[Fusion Handler] fusionDetails =>', fusionDetails);

        // We'll store everything in state, including candidate lists
        setFusionSelectionData({
          baseKey,
          resolve,
          reject,
          ...fusionDetails,
        });

        setIsFusionSelectionOpen(true);
      } catch (err) {
        console.error('[Fusion Handler] Error in promptFusionPokemonSelection:', err);
        reject(err);
      }
    });
  }

  /**
   * If user picks an action in the modal (like "Fuse" or "Cancel").
   */
  async function handleFusionSelectionResolve(choice, leftInstanceId, rightInstanceId) {
    console.log('[Fusion Handler] handleFusionSelectionResolve =>', { choice, leftInstanceId, rightInstanceId });
  
    if (choice === 'confirmFuse' && leftInstanceId && rightInstanceId) {
      try {
        // You already have the relevant "fusionData" in fusionSelectionData
        const { fusionData } = fusionSelectionData;
  
        const fusionName = fusionData.name;
        const fusionId = fusionData.fusion_id;
  
        // Merge the new fusion ID with any existing fusion data for both instances
        const changes = {
          [leftInstanceId]: {
            is_fused: true,
            fused_with: rightInstanceId,
            fusion_form: fusionName,
            fusion: {
              // Spread previous fusion data for left instance if available, then add new fusionId
              ...(ownershipData[leftInstanceId]?.fusion || {}),
              [fusionId]: true,
            },
          },
          [rightInstanceId]: {
            is_fused: true,
            fused_with: leftInstanceId,
            fusion_form: fusionName,
            disabled: true,
          },
        };
  
        console.log('[Fusion Handler] Updating DB with changes =>', changes);
  
        await updateDetails(changes);
        console.log('[Fusion Handler] Fusion completed successfully!');
      } catch (error) {
        console.error('[Fusion Handler] Error fusing:', error);
      }
      if (fusionSelectionData?.resolve) {
        fusionSelectionData.resolve('fuseThis');
      }
    } else {
      if (fusionSelectionData?.resolve) {
        fusionSelectionData.resolve('cancel');
      }
    }
  
    setFusionSelectionData(null);
    setIsFusionSelectionOpen(false);
  }  

  function handleFusionSelectionReject(error) {
    console.log('[Fusion Handler] handleFusionSelectionReject with error:', error);
    if (fusionSelectionData?.reject) {
      fusionSelectionData.reject(error);
    }
    setFusionSelectionData(null);
    setIsFusionSelectionOpen(false);
  }

  /**
   * Handler to close the modal.
   */
  function closeFusionSelection() {
    handleFusionSelectionReject('User canceled');
  }

  /**
   * Modal component for Fusion Pokémon selection.
   */
  function FusionPokemonModal() {
    if (!isFusionSelectionOpen || !fusionSelectionData) return null;
    console.log('[Fusion Handler] Rendering FusionPokemonModal with data:', fusionSelectionData);

    return (
        <FusionPokemonSelection
          {...fusionSelectionData}
          leftCandidatesList={fusionSelectionData.leftCandidatesList}
          rightCandidatesList={fusionSelectionData.rightCandidatesList}
          onConfirm={(choice, leftId, rightId) =>
            handleFusionSelectionResolve(choice, leftId, rightId)
          }
          onCancel={closeFusionSelection}
          onCreateNewLeft={handleCreateNewLeft}
          onCreateNewRight={handleCreateNewRight}
        />
      );
  }

  return {
    promptFusionPokemonSelection,
    FusionPokemonModal,
  };
}

export default useFusionPokemonHandler;
