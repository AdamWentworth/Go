// OwnershipSearch.jsx
import React, { useState } from 'react';
import './OwnershipSearch.css'; // Import the CSS file for OwnershipSearch styling
import StatsInput from '../OwnershipComponents/StatsInput'; // Import StatsInput component
import FieldGroup from '../OwnershipComponents/FieldGroup'; // Import FieldGroup component

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

  const handleStatChange = (statName, value) => {
    setStats((prevStats) => ({
      ...prevStats,
      [statName]: value,
    }));
  };

  return (
    <div className="ownership-status">
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

      {/* Conditionally render additional fields for 'owned' status */}
      {ownershipStatus === 'owned' && (
        <div className="owned-options-container">
          <div className="column stats-column">
            <StatsInput stats={stats} onStatChange={handleStatChange} />
          </div>
          <div className="column field-group-column">
            <FieldGroup
              isLucky={isLucky}
              setIsLucky={setIsLucky}
              height={height}
              setHeight={setHeight}
              weight={weight}
              setWeight={setWeight}
              showPrefLucky={false} // Do not show Preferred Lucky for "owned"
            />
          </div>
        </div>
      )}

      {/* Conditionally render additional fields for 'trade' status */}
      {ownershipStatus === 'trade' && (
        <div className="trade-options">
          <FieldGroup
            isLucky={false}
            prefLucky={prefLucky}
            setPrefLucky={setPrefLucky}
            height={height}
            setHeight={setHeight}
            weight={weight}
            setWeight={setWeight}
            showLucky={false} // Do not show Lucky for "trade"
            showPrefLucky={true} // Show Preferred Lucky for "trade"
          />
          <div className="field">
            <label>
              Include Only Matches who want a Pokémon in your Trade List
            </label>
            <input
              type="checkbox"
              checked={onlyMatchingTrades}
              onChange={(e) => setOnlyMatchingTrades(e.target.checked)}
            />
          </div>
        </div>
      )}

      {/* Conditionally render additional fields for 'wanted' status */}
      {ownershipStatus === 'wanted' && (
        <div className="wanted-options">
          <FieldGroup
            isLucky={false}
            prefLucky={prefLucky}
            setPrefLucky={setPrefLucky}
            height={height}
            setHeight={setHeight}
            weight={weight}
            setWeight={setWeight}
            showLucky={false} // Do not show Lucky for "wanted"
            showPrefLucky={true} // Show Preferred Lucky for "wanted"
          />
          <div className="field">
            <label>Already Registered?</label>
            <input
              type="checkbox"
              checked={alreadyRegistered}
              onChange={(e) => setAlreadyRegistered(e.target.checked)}
            />
          </div>
          <div className="field">
            <label>
              Include Only Matches who offer a Pokémon in your Wanted List
            </label>
            <input
              type="checkbox"
              checked={tradeInWantedList}
              onChange={(e) => setTradeInWantedList(e.target.checked)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnershipSearch;