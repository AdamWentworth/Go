// HeaderUI.jsx

import React from 'react';
import FilterUI from './UIComponents/FilterUI';
import SearchUI from './UIComponents/SearchUI';
import CollectUI from './UIComponents/CollectUI';
import './HeaderUI.css';

const HeaderUI = ({
    isEditable, username,
    showFilterUI, toggleFilterUI,
    isShiny, toggleShiny,
    showCostume, toggleCostume,
    showShadow, toggleShadow,
    toggleShowAll, showAll,
    searchTerm, setSearchTerm,
    showEvolutionaryLine, toggleEvolutionaryLine,
    showCollectUI, toggleCollectUI,
    ownershipFilter, updateOwnershipFilter,
    handleFastSelectToggle, selectAllToggle,
    highlightedCards,
    confirmMoveToFilter
}) => {
    const contextText = isEditable
        ? "Editing your Collection"
        : <>Viewing <span className="username">{username}</span>'s Collection</>;

    return (
        <div className={`header ${showCollectUI ? 'expand-collect' : ''}`}>
            <button className="toggle-button" onClick={toggleFilterUI}>
                {showFilterUI ? 'Hide' : 'Filters'}
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
                />
            )}
            <SearchUI
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                showEvolutionaryLine={showEvolutionaryLine}
                toggleEvolutionaryLine={toggleEvolutionaryLine}
            />
            {showCollectUI && (
                  <CollectUI 
                  isEditable={isEditable}
                  statusFilter={ownershipFilter} 
                  setStatusFilter={updateOwnershipFilter} 
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
                  contextMode={isEditable ? "editing" : "viewing"}
              />
            )}
            <button className="toggle-button collect-ui-toggle" onClick={toggleCollectUI}>
                {showCollectUI ? 'Hide' : 'Collect'}
            </button>
        </div>
    );
};

export default React.memo(HeaderUI);
