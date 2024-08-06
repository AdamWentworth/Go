// RaidBossSelector.jsx
import React from 'react';

function RaidBossSelector({ searchTerm, handleInputChange, filteredRaidBosses }) {
    return (
        <div className="raid-boss-selector">
            <label htmlFor="raid-boss">Select or Type Raid Boss:</label>
            <input
                type="text"
                id="raid-boss"
                value={searchTerm}
                onChange={handleInputChange}
                placeholder="Type to search or select from dropdown"
                list="raid-boss-options"
            />
            <datalist id="raid-boss-options">
                {filteredRaidBosses.map(boss => (
                    <option key={boss.id} value={boss.name}>
                        {boss.name}
                    </option>
                ))}
            </datalist>
        </div>
    );
}

export default RaidBossSelector;
