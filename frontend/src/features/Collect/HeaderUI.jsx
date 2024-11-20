// HeaderUI.jsx

import React from 'react';
import FilterUI from './UIComponents/FilterUI';
import SearchUI from './UIComponents/SearchUI';
import CollectUI from './UIComponents/CollectUI';
import './HeaderUI.css';

const HeaderUI = ({
    isEditable,
    username,
    showFilterUI,
    toggleFilterUI,
    isShiny,
    toggleShiny,
    showCostume,
    toggleCostume,
    showShadow,
    toggleShadow,
    toggleShowAll,
    showAll,
    searchTerm,
    setSearchTerm,
    showEvolutionaryLine,
    toggleEvolutionaryLine,
    showCollectUI,
    toggleCollectUI,
    ownershipFilter,
    updateOwnershipFilter,
    handleFastSelectToggle,
    selectAllToggle,
    highlightedCards,
    confirmMoveToFilter,
    onListsButtonClick,
    contextText,
    isWide,
}) => {
    return (
        <div className={`header ${showCollectUI ? 'expand-collect' : ''}`}>
            <div className="filters-container">
                <button className="toggle-button" onClick={toggleFilterUI}>
                    {showFilterUI ? 'Filters' : 'Filters'}
                </button>
                {showFilterUI && (
                    <FilterUI
                        isShiny={isShiny}
                        toggleShiny={toggleShiny}
                        showCostume={showCostume}
                        toggleCostume={toggleCostume}
                        showShadow={showShadow}
                        toggleShadow={toggleShadow}
                        toggleShowAll={toggleShowAll}
                        showAll={showAll}
                        isWide={isWide}
                    />
                )}
            </div>
            <SearchUI
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                showEvolutionaryLine={showEvolutionaryLine}
                toggleEvolutionaryLine={toggleEvolutionaryLine}
            />
            <button className="toggle-button collect-ui-toggle" onClick={toggleCollectUI}>
                {showCollectUI ? 'Hide' : 'Collect'}
            </button>
            {showCollectUI && (
                <CollectUI
                    isEditable={isEditable}
                    ownershipFilter={ownershipFilter}
                    onFastSelectToggle={handleFastSelectToggle}
                    onSelectAll={selectAllToggle}
                    highlightedCards={highlightedCards}
                    confirmMoveToFilter={confirmMoveToFilter}
                    showAll={showAll}
                    toggleShowAll={toggleShowAll}
                    isShiny={isShiny}
                    showCostume={showCostume}
                    showShadow={showShadow}
                    contextText={contextText}
                    onListsButtonClick={onListsButtonClick}
                />
            )}
        </div>
    );
};

export default React.memo(HeaderUI);
