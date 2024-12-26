// TradeProposal.jsx
import React, { useEffect, useRef, useState } from 'react';
import './TradeProposal.css';
import TypeComponent from '../OwnedComponents/TypeComponent'; 
import MovesComponent from '../OwnedComponents/MovesComponent'; 
import CPComponent from '../OwnedComponents/CPComponent'; 
import LocationCaughtComponent from '../OwnedComponents/LocationCaughtComponent'
import DateCaughtComponent from '../OwnedComponents/DateCaughtComponent'
import { generateH2Content } from '../../../../utils/formattingHelpers'

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
            {passedInPokemon && (
                  <TypeComponent pokemon={passedInPokemon} />
                )}
                {/* Optional: show more details about the selected instance */}
                  {passedInPokemon && (
                  <div style={{ marginTop: '1rem' }}>
                      <p style={{ marginTop: '10px', color: 'white' }}>
                      {passedInPokemon.ownershipStatus.nickname
                        ? `Nickname: ${passedInPokemon.ownershipStatus.nickname}`
                        : null}
                      </p>
                      <CPComponent pokemon={passedInPokemon} />
                      <MovesComponent pokemon={passedInPokemon} />
                      <LocationCaughtComponent pokemon={passedInPokemon} />
                      <DateCaughtComponent pokemon={passedInPokemon} />
                  </div>
                  )}
            </div>
            <div className="trade-proposal-image">
              <img
                src={passedInPokemon.currentImage || '/images/default/placeholder.png'}
                alt={passedInPokemon.name}
                className="trade-proposal-pokemon-img"
                />
                {passedInPokemon &&
                <h3 className="trade-proposal-name">
                                {generateH2Content(passedInPokemon)}
                </h3>
                  }
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
              {selectedMatchedInstance &&
              <h3 className="trade-proposal-name">
                              {generateH2Content(selectedMatchedInstance)}
              </h3>
                }
            </div>
            <div className="trade-proposal-details">
            {selectedMatchedInstance && (
                  <TypeComponent pokemon={selectedMatchedInstance} />
                )}
                {/* Optional: show more details about the selected instance */}
                  {selectedMatchedInstance && (
                  <div style={{ marginTop: '1rem' }}>
                      <CPComponent pokemon={selectedMatchedInstance} />
                      <MovesComponent pokemon={selectedMatchedInstance} />
                      <LocationCaughtComponent pokemon={selectedMatchedInstance} />
                      <DateCaughtComponent pokemon={selectedMatchedInstance} />
                  </div>
                  )}
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
                {selectedMatchedInstance.ownershipStatus.nickname
                    ? `Nickname: ${selectedMatchedInstance.ownershipStatus.nickname}`
                    : null}
                </p>
                )}
  
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default TradeProposal;