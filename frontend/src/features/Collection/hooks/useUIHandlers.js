// useUIHandlers.js

import { useCallback } from 'react';

function useUIHandlers({
  setHighlightedCards,
  setIsFastSelectEnabled,
}) {
  const toggleCardHighlight = useCallback(
    (pokemonId) => {
      setHighlightedCards((prev) => {
        const newHighlights = new Set(prev);

        if (newHighlights.has(pokemonId)) {
          newHighlights.delete(pokemonId);
        } else {
          newHighlights.add(pokemonId);
        }

        // If we have no highlights after toggling, turn off fast-select
        if (newHighlights.size === 0) {
          setIsFastSelectEnabled(false);
        }

        return newHighlights;
      });
    },
    [setHighlightedCards, setIsFastSelectEnabled]
  );

  return { toggleCardHighlight };
}

export default useUIHandlers;
