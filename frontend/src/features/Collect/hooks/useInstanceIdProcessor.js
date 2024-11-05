// useInstanceIdProcessor.js

import { useEffect } from 'react';

function useInstanceIdProcessor({
  viewedOwnershipData,
  viewedLoading,
  filteredVariants,
  location,
  selectedPokemon,
  isOwnCollection,
  hasProcessedInstanceId,
  navigate,
  setSelectedPokemon,
  setHasProcessedInstanceId,
}) {
  useEffect(() => {
    if (
      viewedLoading || // Wait if data is loading
      !viewedOwnershipData || // Wait until data is available
      !filteredVariants.length || // Ensure there are variants
      isOwnCollection || // Skip if viewing own collection
      hasProcessedInstanceId // Skip if already processed
    ) {
      return;
    }

    const instanceId = location.state?.instanceId;

    if (instanceId && !selectedPokemon) {
      const enrichedPokemonData = filteredVariants.find(
        (pokemon) => pokemon.pokemonKey === instanceId
      );
      const pokemonData =
        enrichedPokemonData || viewedOwnershipData[instanceId];

      if (pokemonData) {
        setSelectedPokemon({
          pokemon: { ...pokemonData, pokemonKey: instanceId },
          overlayType: 'instance',
        });

        setHasProcessedInstanceId(true);

        // Clear instanceId from location state to prevent re-trigger
        navigate(location.pathname, {
          replace: true,
          state: { ...location.state, instanceId: null },
        });
      }
    }
  }, [
    viewedOwnershipData,
    viewedLoading,
    filteredVariants,
    location.state,
    selectedPokemon,
    isOwnCollection,
    hasProcessedInstanceId,
    navigate,
    location.pathname,
  ]); // Include necessary dependencies only
}

export default useInstanceIdProcessor;
