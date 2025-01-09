// useInstanceIdProcessor.js
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
  // Dummy state to force effect re-runs for polling
  const [retryCounter, setRetryCounter] = useState(0);

  useEffect(() => {
    // Skip until BOTH global data & user data is done loading
    if (loading || viewedLoading) {
      return;
    }

    // Skip if we still have no user data or no filteredVariants for that user
    if (!viewedOwnershipData || !filteredVariants.length) {
      return;
    }

    // Skip if we’re viewing own collection or if instance ID is already processed
    if (isOwnCollection || hasProcessedInstanceId) {
      return;
    }

    // Finally, we can read the instanceId from location.state
    const instanceId = location.state?.instanceId;

    if (instanceId && !selectedPokemon) {
      const enrichedPokemonData = filteredVariants.find(
        (p) => p.pokemonKey === instanceId
      );

      const pokemonData =
        enrichedPokemonData || viewedOwnershipData[instanceId];

      if (pokemonData) {
        setSelectedPokemon({
          pokemon: { ...pokemonData, pokemonKey: instanceId },
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
    } else {
      if (!instanceId) {
        console.log('No instanceId found in location.state.');
      }
    }
  }, [
    loading,
    viewedLoading,
    viewedOwnershipData,
    filteredVariants,
    selectedPokemon,
    isOwnCollection,
    hasProcessedInstanceId,
    navigate,
    location.pathname,
    location.state,
    setSelectedPokemon,
    setHasProcessedInstanceId,
    retryCounter, // added to dependencies to trigger re-run on change
  ]);
}

export default useInstanceIdProcessor;
