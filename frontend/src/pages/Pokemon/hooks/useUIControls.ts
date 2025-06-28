// useUIControls.ts
import { useState, useCallback } from 'react';

type SortMode = 'descending' | 'ascending';

interface UISettings {
  showEvolutionaryLine: boolean;
  isFastSelectEnabled: boolean;
  sortType: string;
  sortMode: SortMode;
}

export default function useUIControls(initialSettings: UISettings) {
  const [showEvolutionaryLine, setShowEvolutionaryLine] = useState<boolean>(initialSettings.showEvolutionaryLine);
  const [isFastSelectEnabled, setIsFastSelectEnabled] = useState<boolean>(initialSettings.isFastSelectEnabled);
  const [sortType, setSortType] = useState<string>(initialSettings.sortType);
  const [sortMode, setSortMode] = useState<SortMode>(initialSettings.sortMode);
  const [highlightedCards, setHighlightedCards] = useState<Set<string>>(new Set());

  const toggleEvolutionaryLine = useCallback(() => {
    setShowEvolutionaryLine(prev => !prev);
  }, []);

  const toggleFastSelect = useCallback(() => {
    setIsFastSelectEnabled(prev => !prev);
  }, []);

  const toggleCardHighlight = useCallback((pokemonId: string) => {
    setHighlightedCards((prev) => {
      const newHighlights = new Set(prev);

      if (newHighlights.has(pokemonId)) {
        newHighlights.delete(pokemonId);
      } else {
        newHighlights.add(pokemonId);
      }

      if (newHighlights.size === 0) {
        setIsFastSelectEnabled(false);
      }

      return newHighlights;
    });
  }, [setIsFastSelectEnabled]);

  return {
    showEvolutionaryLine,
    toggleEvolutionaryLine,
    isFastSelectEnabled,
    setIsFastSelectEnabled,
    toggleFastSelect,
    sortType,
    setSortType,
    sortMode,
    setSortMode,
    highlightedCards,
    setHighlightedCards,
    toggleCardHighlight,
  };
}
