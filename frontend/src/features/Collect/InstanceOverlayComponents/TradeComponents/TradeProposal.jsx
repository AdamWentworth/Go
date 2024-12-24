// TradeProposal.jsx
import React, { useEffect, useRef, useState } from 'react';
import './TradeProposal.css';
import MovesComponent from '../OwnedComponents/MovesComponent'; 

const TradeProposal = ({ passedInPokemon, clickedPokemon, onClose }) => {
    const closeButtonRef = useRef(null);
  
    // Track which matched instance is selected
    const [selectedMatchedInstance, setSelectedMatchedInstance] = useState(null);
  
    // Grab the matchedInstances array
    const { matchedInstances = [] } = clickedPokemon || {};
  
    // Default to the first matched instance when loaded
    useEffect(() => {
      if (matchedInstances.length > 0) {
        setSelectedMatchedInstance(matchedInstances[0]);
      }
    }, [matchedInstances]);
  
    // When user changes the <select> dropdown
    const handleInstanceChange = (e) => {
      const chosenId = e.target.value;
      const found = matchedInstances.find(
        (inst) => inst.ownershipStatus.instance_id === chosenId
      );
      setSelectedMatchedInstance(found || null);
    };
  
    // This is the button the user clicks to confirm the trade
    const handleProposeTrade = () => {
      if (!selectedMatchedInstance) {
        alert("Please select which instance to trade.");
        return;
      }
      // ...any further logic, e.g. calling an API...
      console.log("Propose trade with instance:", selectedMatchedInstance);
      onClose();
    };
  
    if (!passedInPokemon || !clickedPokemon) {
      return <p>Missing Pokémon data. Please try again.</p>;
    }

    console.log(selectedMatchedInstance)
  
    return (
      <div className="trade-proposal-overlay">
        <div className="trade-proposal-container">
          
          {/* Close Button */}
          <button
            className="trade-proposal-close-button"
            onClick={onClose}
            ref={closeButtonRef}
          >
            X
          </button>
  
          {/*
            ===========  TOP ROW (Passed-in Pokemon)  ===========
          */}
          <div className="trade-proposal-row trade-proposal-row-first">
            <div className="trade-proposal-details">
              <h3 className="trade-proposal-name">
                {passedInPokemon.name || 'Passed-in Pokémon'}
              </h3>
              <p className="trade-proposal-type">
                Type: {passedInPokemon.type || 'Type Details'}
              </p>
              <p className="trade-proposal-level">
                Level: {passedInPokemon.level || 'Level Details'}
              </p>
              {/* Add more details or MovesComponent, if desired */}
            </div>
            <div className="trade-proposal-image">
              <img
                src={passedInPokemon.currentImage || '/images/default/placeholder.png'}
                alt={passedInPokemon.name}
                className="trade-proposal-pokemon-img"
              />
            </div>
          </div>
  
          {/*
            ===========  MIDDLE ROW (Propose button / arrow / stardust)  ===========
          */}
          <div className="trade-proposal-row trade-proposal-row-middle">
            <button className="trade-proposal-propose-button" onClick={handleProposeTrade}>
              Propose Trade
            </button>
  
            <div className="trade-proposal-arrow">
              <img
                src="/images/trade_arrow.png"
                alt="Trade arrow"
                className="trade-proposal-arrow-image"
              />
            </div>
  
            <div className="trade-proposal-stardust">
              <p>Stardust: 0</p>
            </div>
          </div>
  
          {/*
            ===========  BOTTOM ROW (Our matchedInstances)  ===========
          */}
          <div className="trade-proposal-row trade-proposal-row-bottom">
            {/* If we have a selectedMatchedInstance, use its data for display */}
            <div className="trade-proposal-image">
              <img
                src={
                  selectedMatchedInstance?.currentImage ||
                  '/images/default/placeholder.png'
                }
                alt={selectedMatchedInstance?.name || 'Clicked Pokémon'}
                className="trade-proposal-pokemon-img"
              />
            </div>
            <div className="trade-proposal-details">
              <h3 className="trade-proposal-name">
                {selectedMatchedInstance?.name || 'Clicked Pokémon'}
              </h3>
              <p className="trade-proposal-type">
                Type: {selectedMatchedInstance?.type || 'Type Details'}
              </p>
  
              {/* 
                ===========  INSTANCE PICKER  ===========
                If more than 1 matchedInstance, show a <select>.
              */}
              {matchedInstances.length > 1 ? (
                <div className="trade-instance-picker" style={{ marginTop: '1rem' }}>
                    <label htmlFor="instance-selector" style={{ marginRight: '8px' }}>
                    Choose the instance to trade:
                    </label>
                    <select
                    id="instance-selector"
                    value={selectedMatchedInstance?.ownershipStatus?.instance_id || ''}
                    onChange={handleInstanceChange}
                    >
                    {matchedInstances.map((inst, index) => (
                        <option
                        key={inst.ownershipStatus.instance_id}
                        value={inst.ownershipStatus.instance_id}
                        >
                        {inst.ownershipStatus.nickname
                            ? inst.ownershipStatus.nickname
                            : `${inst.name} ${index + 1}`}
                        </option>
                    ))}
                    </select>
                </div>
                ) : (
                <p style={{ marginTop: '10px', color: 'white' }}>
                    {matchedInstances.length === 1
                    ? matchedInstances[0].ownershipStatus.nickname
                        ? `Nickname: ${matchedInstances[0].ownershipStatus.nickname}`
                        : `Name: ${matchedInstances[0].name}`
                    : 'No tradeable instances found.'}
                </p>
                )}
  
              {/* Optional: show more details about the selected instance */}
                {selectedMatchedInstance && (
                <div style={{ marginTop: '1rem' }}>
                    <strong>Selected Instance:</strong>
                    {/* Render the MovesComponent with selectedMatchedInstance passed as a prop */}
                    <MovesComponent pokemon={selectedMatchedInstance} />
                </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default TradeProposal;