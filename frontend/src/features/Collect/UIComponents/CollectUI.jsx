// CollectUI.jsx
import React, { useState, useEffect, useRef } from 'react';
import './CollectUI.css';

const CollectUI = ({
    isEditable,
    statusFilter,
    setStatusFilter,
    onFastSelectToggle,
    onSelectAll,
    highlightedCards,
    confirmMoveToFilter,
    showAll,
    toggleShowAll,
    isShiny,
    showCostume,
    showShadow,
    contextText
}) => {
    const filters = ['Owned', 'Trade', 'Unowned', 'Wanted'];
    const [selectedFilter, setSelectedFilter] = useState("");
    const [fastSelectEnabled, setFastSelectEnabled] = useState(false);
    const [selectAllEnabled, setSelectAllEnabled] = useState(false);

    const previousFilter = useRef(statusFilter); // Track previous filter state

    useEffect(() => {
        setSelectedFilter(statusFilter);
        previousFilter.current = statusFilter;
    }, [statusFilter]);

    const handleFilterChange = (filter) => {
        // If highlighted cards exist, confirm moving to the selected filter
        if (highlightedCards.size > 0) {
            confirmMoveToFilter(filter);
            return;
        }

        // Prevent setting the same filter repeatedly if isEditable is false
        if (!isEditable && previousFilter.current === filter) {
            return;
        }

        // Determine the new filter state based on toggling logic
        const newFilter = statusFilter === filter ? "" : filter;

        // Set the new filter
        setStatusFilter(newFilter);
        previousFilter.current = newFilter;

        // Adjust showAll based on the filter state and conditions
        if (newFilter === "" && !isShiny && !showCostume && !showShadow) {
            toggleShowAll(false);
        } else if (!showAll && newFilter !== "" && !isShiny && !showCostume && !showShadow) {
            toggleShowAll(true);
        }

        // Reset selectAll when a filter is selected or changed
        setSelectAllEnabled(false);
    };

    const handleSelectAll = () => {
        const newSelectAllState = !selectAllEnabled;
        setSelectAllEnabled(newSelectAllState);
        onSelectAll(newSelectAllState);
    };

    const handleToggleFastSelect = () => {
        const newFastSelectState = !fastSelectEnabled;
        setFastSelectEnabled(newFastSelectState);
        onFastSelectToggle(newFastSelectState);
    };

    return (
        <div className="header-section collect-section">
            <div className="collect-header"></div>
            <div className="button-container">
                {isEditable ? (
                    <>
                        <button
                            className={`select-all-button ${selectAllEnabled ? 'active' : ''}`}
                            onClick={handleSelectAll}
                        >
                            Select All
                        </button>
                        <button
                            onClick={handleToggleFastSelect}
                            className={`fast-select-button ${fastSelectEnabled ? 'active' : ''}`}
                        >
                            <img src="/images/fast_select.png" alt="Toggle Fast Select" />
                        </button>
                    </>
                ) : (
                    <>
                        <div className="placeholder select-all-placeholder"></div>
                        <div className="placeholder fast-select-placeholder"></div>
                    </>
                )}
                {filters.map((filter) => (
                    <button
                        key={filter}
                        className={`filter-button ${filter} ${selectedFilter === filter ? 'active' : ''} ${selectedFilter !== "" && selectedFilter !== filter ? 'non-selected' : ''}`}
                        onClick={() => handleFilterChange(filter)}
                    >
                        {filter}
                    </button>
                ))}
                {/* Dynamically set context mode and viewing-all if no filter selected */}
                <div className={`context-text-container ${isEditable ? 'editing' : 'viewing'} ${!selectedFilter ? 'viewing-all' : ''}`}>
                    <p className="context-text">{contextText}</p>
                </div>
            </div>
        </div>
    );
};

export default CollectUI;