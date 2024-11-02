// CollectUI.jsx
import React, { useState, useEffect } from 'react';
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
    contextText // Add contextText prop
}) => {
    const filters = ['Owned', 'Trade', 'Unowned', 'Wanted'];
    const [selectedFilter, setSelectedFilter] = useState("");
    const [fastSelectEnabled, setFastSelectEnabled] = useState(false);
    const [selectAllEnabled, setSelectAllEnabled] = useState(false);

    useEffect(() => {
        setSelectedFilter(statusFilter);
    }, [statusFilter]);

    const handleFilterClick = (filter) => {
        if (highlightedCards.size > 0) {
            confirmMoveToFilter(filter);
        } else {
            const newFilter = statusFilter === filter ? "" : filter;
            setStatusFilter(newFilter);
        }
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
                        onClick={() => handleFilterClick(filter)}
                    >
                        {filter}
                    </button>
                ))}
                {/* Dynamically set context mode */}
                <div className={`context-text-container ${isEditable ? 'editing' : 'viewing'}`}>
                    <p className="context-text">{contextText}</p>
                </div>
            </div>
        </div>
    );
};

export default CollectUI;