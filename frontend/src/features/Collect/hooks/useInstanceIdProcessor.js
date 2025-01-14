import { useEffect, useState } from 'react';

function useInstanceIdProcessor({
  loading,
  viewedLoading, 
  viewedOwnershipData,
  filteredVariants,
  location,
  selectedPokemon,
  isOwnCollection,
  hasProcessedInstanceId,
  navigate,
  setSelectedPokemon,
  setHasProcessedInstanceId,
}) {
  const [retryCounter, setRetryCounter] = useState(0);

  useEffect(() => {
    // Wait until both global and user data finish loading
    if (loading || viewedLoading) {
      return;
    }

    // Skip if no user data or no filtered variants available yet
    if (!viewedOwnershipData || !filteredVariants.length) {
      return;
    }

    // Skip if viewing own collection or instance ID already processed
    if (isOwnCollection || hasProcessedInstanceId) {
      return;
    }

    const instanceId = location.state?.instanceId;

    if (instanceId && !selectedPokemon) {
      // Try finding enriched Pokémon data in filteredVariants
      const enrichedPokemonData = filteredVariants.find(
        (p) => p.pokemonKey === instanceId
      );

      let combinedPokemonData = null;
      if (enrichedPokemonData) {
        combinedPokemonData = enrichedPokemonData;
      } else {
        const fallbackOwnership = viewedOwnershipData[instanceId];
        if (fallbackOwnership) {
          // Use the base Pokémon data that corresponds to the ownership data
          const basePokemonData = filteredVariants.find(
            (p) => p.pokemon_id === fallbackOwnership.pokemon_id
          );

          if (basePokemonData) {
            // Merge base Pokémon data with ownership data under ownershipStatus
            combinedPokemonData = {
              ...basePokemonData,
              pokemonKey: instanceId,
              ownershipStatus: fallbackOwnership,
            };
          }
        }
      }

      if (combinedPokemonData) {
        setSelectedPokemon({
          pokemon: combinedPokemonData,
          overlayType: 'instance',
        });
        setHasProcessedInstanceId(true);

        setTimeout(() => {
          navigate(location.pathname, {
            replace: true,
            state: { ...location.state, instanceId: null },
          });
        }, 100);
      } else {
        setTimeout(() => {
          setRetryCounter((prev) => prev + 1);
        }, 500);
      }
    }
  }, [
    loading,
    viewedLoading,
    viewedOwnershipData,
    filteredVariants,
    location,
    selectedPokemon,
    isOwnCollection,
    hasProcessedInstanceId,
    navigate,
    setSelectedPokemon,
    setHasProcessedInstanceId,
    retryCounter,
  ]);
}

export default useInstanceIdProcessor;
