import React from 'react';

type RaidBossOption = {
  id?: string | number;
  name: string;
};

type RaidBossSelectorProps = {
  searchTerm: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  filteredRaidBosses: RaidBossOption[];
};

const RaidBossSelector: React.FC<RaidBossSelectorProps> = ({
  searchTerm,
  handleInputChange,
  filteredRaidBosses,
}) => {
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
        {filteredRaidBosses.map((boss) => (
          <option key={`${boss.id ?? boss.name}`} value={boss.name}>
            {boss.name}
          </option>
        ))}
      </datalist>
    </div>
  );
};

export default RaidBossSelector;
