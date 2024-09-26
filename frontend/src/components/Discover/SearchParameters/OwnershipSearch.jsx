// OwnershipSearch.jsx
import React, { useState } from 'react';
import './OwnershipSearch.css'; // Import the CSS file for OwnershipSearch styling
import OwnedSearch from '../OwnershipComponents/OwnedSearch';
import TradeSearch from '../OwnershipComponents/TradeSearch';
import WantedSearch from '../OwnershipComponents/WantedSearch';

const OwnershipSearch = ({ ownershipStatus, setOwnershipStatus }) => {
  const options = ['owned', 'trade', 'wanted']; // Define the options

  // States for additional fields when "owned", "trade", or "wanted" is selected
  const [isLucky, setIsLucky] = useState(false);
  const [prefLucky, setPrefLucky] = useState(false);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  // Set initial stats to empty strings instead of zeros
  const [stats, setStats] = useState({ attack: '', defense: '', stamina: '' });
  const [onlyMatchingTrades, setOnlyMatchingTrades] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [tradeInWantedList, setTradeInWantedList] = useState(false); // New state for the additional filter
  const [isHundo, setIsHundo] = useState(false); // State for the Hundo checkbox

  const handleStatChange = (statName, value) => {
    setStats((prevStats) => ({
      ...prevStats,
      [statName]: value,
    }));
  };

  return (
    <div className="ownership-status-container">
      {/* Left Column: Dynamic Content Based on Selection */}
      <div className="ownership-content">
        {ownershipStatus === 'owned' && (
          <OwnedSearch
            stats={stats}
            onStatChange={handleStatChange}
            isHundo={isHundo}
            setIsHundo={setIsHundo}
            isLucky={isLucky}
            setIsLucky={setIsLucky}
          />
        )}

        {ownershipStatus === 'trade' && (
          <TradeSearch
            prefLucky={prefLucky}
            setPrefLucky={setPrefLucky}
            onlyMatchingTrades={onlyMatchingTrades}
            setOnlyMatchingTrades={setOnlyMatchingTrades}
          />
        )}

        {ownershipStatus === 'wanted' && (
          <WantedSearch
            prefLucky={prefLucky}
            setPrefLucky={setPrefLucky}
            alreadyRegistered={alreadyRegistered}
            setAlreadyRegistered={setAlreadyRegistered}
            tradeInWantedList={tradeInWantedList}
            setTradeInWantedList={setTradeInWantedList}
          />
        )}
      </div>

      {/* Right Column: Static Ownership Options Buttons */}
      <div className="ownership-options-container">
        <h3 className="ownership-header">Ownership Status</h3>
        <div className="ownership-options">
          {options.map((option) => (
            <button
              key={option}
              className={`ownership-button ${ownershipStatus === option ? 'active ' + option : 'inactive ' + option}`}
              onClick={() => setOwnershipStatus(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)} {/* Capitalize first letter */}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnershipSearch;