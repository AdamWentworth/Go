//useUIControls.js

import { useState, useCallback } from 'react';

export function useUIControls(initialSettings) {
    const [showFilterUI, setShowFilterUI] = useState(initialSettings.showFilterUI);
    const [showCollectUI, setShowCollectUI] = useState(initialSettings.showCollectUI);
    const [showEvolutionaryLine, setShowEvolutionaryLine] = useState(initialSettings.showEvolutionaryLine);
    const [isFastSelectEnabled, setIsFastSelectEnabled] = useState(initialSettings.isFastSelectEnabled);
    const [isSelectAllEnabled, setIsSelectAllEnabled] = useState(initialSettings.isSelectAllEnabled);
    const [sortType, setSortType] = useState(initialSettings.sortType);
    const [sortMode, setSortMode] = useState(initialSettings.sortMode);

    const toggleFilterUI = useCallback(() => setShowFilterUI(prev => !prev), []);
    const toggleCollectUI = useCallback(() => setShowCollectUI(prev => !prev), []);
    const toggleEvolutionaryLine = useCallback(() => setShowEvolutionaryLine(prev => !prev), []);
    const toggleFastSelect = useCallback(() => setIsFastSelectEnabled(prev => !prev), []);
    const toggleSortMode = useCallback(() => {
        setSortMode(currentMode => currentMode === 'ascending' ? 'descending' : 'ascending');
    }, []);

    return {
        showFilterUI,
        setShowFilterUI,
        toggleFilterUI,
        showCollectUI,
        setShowCollectUI,
        toggleCollectUI,
        showEvolutionaryLine,
        toggleEvolutionaryLine,
        isFastSelectEnabled,
        setIsFastSelectEnabled,
        isSelectAllEnabled,
        setIsSelectAllEnabled,
        toggleFastSelect,
        sortType,
        setSortType,
        sortMode,
        toggleSortMode
    };
}
