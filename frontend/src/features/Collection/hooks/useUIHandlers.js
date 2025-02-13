// useUIHandlers.js

import { useCallback } from 'react';

function useUIHandlers({ setHighlightedCards }) {
  const toggleCardHighlight = useCallback(
    (pokemonId) => {
      setHighlightedCards((prev) => {
        const newHighlights = new Set(prev);
        if (newHighlights.has(pokemonId)) {
          newHighlights.delete(pokemonId);
        } else {
          newHighlights.add(pokemonId);
        }
        return newHighlights;
      });
    },
    [setHighlightedCards]
  );

  return { toggleCardHighlight };
}

export default useUIHandlers;
