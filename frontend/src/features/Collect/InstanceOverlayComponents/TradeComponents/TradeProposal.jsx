// TradeProposal.jsx
import React, { useEffect, useRef, useState } from 'react';
import './TradeProposal.css';
import MovesComponent from '../OwnedComponents/MovesComponent';
import CPComponent from '../OwnedComponents/CPComponent';
import LocationCaughtComponent from '../OwnedComponents/LocationCaughtComponent';
import DateCaughtComponent from '../OwnedComponents/DateCaughtComponent';
import { generateH2Content } from '../../../../utils/formattingHelpers';

import FriendshipManager from '../WantedComponents/FriendshipManager';
import useCalculateStardustCost from '../hooks/useCalculateStardustCost';

const TradeProposal = ({ passedInPokemon, clickedPokemon, wantedPokemon, onClose, myOwnershipData, ownershipData }) => {
  const containerRef = useRef(null);
  const closeButtonRef = useRef(null);

  const [selectedMatchedInstance, setSelectedMatchedInstance] = useState(null);
  const [friendship_level, setFriendshipLevel] = useState(0);
  const [pref_lucky, setPrefLucky] = useState(false);

  useEffect(() => {
    if (wantedPokemon) {
      setFriendshipLevel(wantedPokemon.friendship_level || 0);
      setPrefLucky(wantedPokemon.pref_lucky || false);
    }
  }, [wantedPokemon]);

  const { matchedInstances = [] } = clickedPokemon || {};

  useEffect(() => {
    if (matchedInstances.length > 0) {
      setSelectedMatchedInstance(matchedInstances[0]);
    }
  }, [matchedInstances]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleInstanceChange = (e) => {
    const chosenId = e.target.value;
    const found = matchedInstances.find(
      (inst) => inst.ownershipStatus.instance_id === chosenId
    );
    setSelectedMatchedInstance(found || null);
  };

  const handleProposeTrade = () => {
    if (!selectedMatchedInstance) {
      alert("Please select which instance to trade.");
      return;
    }
    console.log("Propose trade with instance:", selectedMatchedInstance);
    onClose();
  };

  const { stardustCost, isSpecialTrade } = useCalculateStardustCost(
    friendship_level,
    passedInPokemon,
    selectedMatchedInstance,
    myOwnershipData,
    ownershipData
  );

  const formattedStardustCost = stardustCost.toLocaleString();

  if (!passedInPokemon || !clickedPokemon) {
    return <p>Missing Pokémon data. Please try again.</p>;
  }

  return (
    <div className="trade-proposal-overlay">
      <div className="trade-proposal-container" ref={containerRef}>
        <button
          className="trade-proposal-close-button"
          onClick={onClose}
          ref={closeButtonRef}
        >
          X
        </button>

        <div className="friendship-manager">
          <FriendshipManager
            friendship_level={friendship_level}
            setFriendshipLevel={setFriendshipLevel}
            editMode={true}
            pref_lucky={pref_lucky}
            setPrefLucky={setPrefLucky}
          />
        </div>

        <div className="trade-proposal-row trade-proposal-row-first">
          {/* Passed-in Pokémon details */}
          <div className="trade-proposal-details">
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
          {/* Pokémon image */}
          <div className="trade-proposal-image-container">
            {pref_lucky && (
              <img
                src={process.env.PUBLIC_URL + '/images/lucky.png'}
                alt="Lucky Backdrop"
                className="lucky-backdrop"
              />
            )}
            <img
              src={passedInPokemon.currentImage || '/images/default/placeholder.png'}
              alt={passedInPokemon.name}
              className="trade-proposal-pokemon-img"
            />
            {passedInPokemon && (
              <h3 className="trade-proposal-name">
                {generateH2Content(passedInPokemon)}
              </h3>
            )}
          </div>
        </div>

        <div className="trade-proposal-row trade-proposal-row-middle">
          <button
            className="trade-proposal-propose-button"
            onClick={handleProposeTrade}
            disabled={friendship_level === 0}
            style={{
              cursor: friendship_level === 0 ? 'not-allowed' : 'pointer',
              backgroundColor: friendship_level === 0 ? '#ccc' : '',
            }}
          >
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
            <p>Stardust Cost: {formattedStardustCost}</p>
            {isSpecialTrade && <p className="special-trade-warning">Special Trade!</p>}
          </div>
        </div>

        {/* BOTTOM ROW (Our matchedInstances) */}
        <div className="trade-proposal-row trade-proposal-row-bottom">
          <div className="trade-proposal-image-container">
            {pref_lucky && (
              <img
                src={process.env.PUBLIC_URL + '/images/lucky.png'}
                alt="Lucky Backdrop"
                className="lucky-backdrop"
              />
            )}
            <img
              src={
                selectedMatchedInstance?.currentImage ||
                '/images/default/placeholder.png'
              }
              alt={selectedMatchedInstance?.name || 'Clicked Pokémon'}
              className="trade-proposal-pokemon-img"
            />
            {selectedMatchedInstance && (
              <h3 className="trade-proposal-name">
                {generateH2Content(selectedMatchedInstance)}
              </h3>
            )}
          </div>
          <div className="trade-proposal-details">
            {/* Optional: show more details about the selected instance */}
            {selectedMatchedInstance && (
              <div style={{ marginTop: '1rem' }}>
                <CPComponent pokemon={selectedMatchedInstance} />
                <MovesComponent pokemon={selectedMatchedInstance} />
                <LocationCaughtComponent pokemon={selectedMatchedInstance} />
                <DateCaughtComponent pokemon={selectedMatchedInstance} />
              </div>
            )}

            {/* INSTANCE PICKER */}
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
                {selectedMatchedInstance?.ownershipStatus?.nickname
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
