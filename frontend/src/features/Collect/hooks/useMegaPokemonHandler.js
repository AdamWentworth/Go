// useMegaPokemonHandler.js

import { useState } from 'react';
import { getAllFromDB, getFromDB } from '../../../services/indexedDB'; // Ensure getFromDB is imported
import { parsePokemonKey } from '../../../utils/PokemonIDUtils';
import MegaPokemonSelection from '../PokemonOwnership/components/MegaPokemonSelection';

/**
 * Custom hook to manage Mega Pokémon selection and state.
 */
function useMegaPokemonHandler() {
  const [isMegaSelectionOpen, setIsMegaSelectionOpen] = useState(false);
  const [megaSelectionData, setMegaSelectionData] = useState(null);

  /**
   * Parses the base key from a given baseKey string.
   * @param {string} baseKey - The base key of the Mega Pokémon.
   * @returns {string|null} - The parsed base number or null if not found.
   */
  const parseBaseKey = (baseKey) => {
    const match = baseKey.match(/^\d+/);
    return match ? match[0] : null;
  };

  /**
   * Parses the shiny status from a given baseKey string.
   * @param {string} baseKey - The base key of the Mega Pokémon.
   * @returns {boolean} - True if shiny is present, otherwise false.
   */
  const parseShinyStatus = (baseKey) => {
    return baseKey.includes('shiny');
  };

  /**
   * Retrieves owned Pokémon based on the base number and shiny status,
   * and excludes those that are already Mega evolved.
   * @param {string} baseNumber - The base number extracted from baseKey.
   * @param {boolean} isShiny - Whether to filter for shiny Pokémon.
   * @returns {Promise<Array>} - A promise that resolves with an array of owned Pokémon.
   */
  const getOwnedPokemon = async (baseNumber, isShiny) => {
    const allData = await getAllFromDB('pokemonOwnership');
    if (!allData || !Array.isArray(allData)) {
      throw new Error("Invalid data retrieved from IndexedDB");
    }

    // Filter for Pokémon with matching base number, ownership, shiny status,
    // and ensure they are not already Mega evolved
    const filteredPokemon = allData.filter(entry => {
      if (!entry.instance_id || typeof entry.instance_id !== 'string') {
        console.warn("Skipping entry with invalid instance_id:", entry);
        return false;
      }
      const entryBaseKey = entry.instance_id.split('-')[0]; // Extract base number from instance_id
      return (
        entryBaseKey === baseNumber &&
        entry.is_owned &&
        entry.shiny === isShiny &&
        !entry.is_mega // Exclude Pokémon that are already Mega evolved
      );
    });

    // Further filter out Pokémon that cannot mega evolve (e.g., clone, shadow, mega)
    return filteredPokemon.filter(entry => {
      const { baseKey } = parsePokemonKey(entry.instance_id);
      return !(baseKey.includes('clone') || baseKey.includes('shadow') || baseKey.includes('mega'));
    });
  };

  /**
   * Fetches and processes Mega Pokémon data, including variant data per instance.
   * @param {string} baseKey - The base key of the Mega Pokémon.
   * @returns {Promise<Array>} - Resolves with an array of owned Pokémon with variant data.
   */
  const handleMegaPokemon = async (baseKey) => {
    try {
      const baseNumber = parseBaseKey(baseKey);
      if (!baseNumber) {
        throw new Error(`Invalid baseKey format: ${baseKey}`);
      }

      const isShiny = parseShinyStatus(baseKey); // Determine shiny status
      const ownedPokemon = await getOwnedPokemon(baseNumber, isShiny); // Pass shiny status
      console.log("Owned Pokémon matching requirements:", ownedPokemon);

      // Fetch variant data for each owned Pokémon
      const ownedPokemonWithVariants = await Promise.all(
        ownedPokemon.map(async (pokemon) => {
          const { instance_id } = pokemon;
          const parsed = parsePokemonKey(instance_id);
          if (!parsed) {
            console.warn(`Invalid instance_id format: ${instance_id}`);
            return { ...pokemon, variantData: null };
          }
          const { baseKey: variantKey } = parsed;
          try {
            const variantData = await getFromDB('pokemonVariants', variantKey);
            if (!variantData) {
              throw new Error(`Variant data not found for baseKey: ${variantKey}`);
            }
            return { ...pokemon, variantData };
          } catch (error) {
            console.error(`Error fetching variant data for ${variantKey}:`, error);
            return { ...pokemon, variantData: null };
          }
        })
      );

      return ownedPokemonWithVariants;
    } catch (error) {
      console.error("Error handling Mega Pokémon:", error);
      throw error;
    }
  };

  /**
   * Prompts the Mega Pokémon selection modal and returns a Promise.
   * @param {string} baseKey - The base key of the Mega Pokémon.
   * @returns {Promise<string>} - Resolves with the user's selection.
   */
  const promptMegaPokemonSelection = (baseKey) => {
    return new Promise(async (resolve, reject) => {
      try {
        const ownedPokemonWithVariants = await handleMegaPokemon(baseKey);
        setMegaSelectionData({ ownedPokemon: ownedPokemonWithVariants, resolve, reject });
        setIsMegaSelectionOpen(true);
      } catch (error) {
        reject(error);
      }
    });
  };

  /**
   * Handles the resolution of the Mega Pokémon selection.
   * @param {string} selectedOption - The option selected by the user.
   */
  const handleMegaSelectionResolve = (selectedOption) => {
    if (megaSelectionData && megaSelectionData.resolve) {
      megaSelectionData.resolve(selectedOption);
    }
    setIsMegaSelectionOpen(false);
    setMegaSelectionData(null);
  };

  /**
   * Handles the rejection of the Mega Pokémon selection.
   * @param {any} error - The error or reason for rejection.
   */
  const handleMegaSelectionReject = (error) => {
    if (megaSelectionData && megaSelectionData.reject) {
      megaSelectionData.reject(error);
    }
    setIsMegaSelectionOpen(false);
    setMegaSelectionData(null);
  };

  /**
   * Renders the Mega Pokémon selection modal if open.
   */
  const MegaPokemonModal = () =>
    isMegaSelectionOpen && megaSelectionData ? (
      <MegaPokemonSelection
        ownedPokemon={megaSelectionData.ownedPokemon}
        onAssignExisting={() => handleMegaSelectionResolve('assignExisting')}
        onCreateNew={() => handleMegaSelectionResolve('createNew')}
        onCancel={() => handleMegaSelectionReject('User canceled')}
      />
    ) : null;

  return {
    promptMegaPokemonSelection,
    MegaPokemonModal,
  };
}

export default useMegaPokemonHandler;
