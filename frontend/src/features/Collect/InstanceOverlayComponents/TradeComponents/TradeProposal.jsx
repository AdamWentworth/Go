/* TradeProposal.jsx */

import React, { useEffect, useRef, useState } from 'react';
import './TradeProposal.css';
import MovesComponent from '../OwnedComponents/MovesComponent';
import CPComponent from '../OwnedComponents/CPComponent';
import LocationCaughtComponent from '../OwnedComponents/LocationCaughtComponent';
import DateCaughtComponent from '../OwnedComponents/DateCaughtComponent';
import { generateH2Content } from '../../../../utils/formattingHelpers';

import FriendshipManager from '../WantedComponents/FriendshipManager';
import useCalculateStardustCost from '../hooks/useCalculateStardustCost';

import { useTradeData } from '../../../../contexts/TradeDataContext';
import { useModal } from '../../../../contexts/ModalContext';

const TradeProposal = ({ passedInPokemon, clickedPokemon, wantedPokemon, onClose, myOwnershipData, ownershipData, username }) => {
  const { proposeTrade } = useTradeData();
  const { alert } = useModal();
  const containerRef = useRef(null);

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

  const handleProposeTrade = async () => {
    if (!selectedMatchedInstance) {
      await alert("Please select which instance to trade.");
      return;
    }

    // Validate friendship level
    if (friendship_level < 1 || friendship_level > 4) {
      await alert("Please select a valid friendship level (1-4).");
      return;
    }

    // Retrieve the 'user' object from localStorage
    const userString = localStorage.getItem('user');

    // Initialize username_proposed as null
    let username_proposed = null;

    // Attempt to parse the 'user' object
    if (userString) {
        try {
            const user = JSON.parse(userString);
            username_proposed = user.username || null;
        } catch (error) {
            console.error("Error parsing 'user' from localStorage:", error);
            // Optionally, handle the error (e.g., redirect to login)
        }
    }

    // Prepare trade data
    const tradeData = {
      username_proposed: username_proposed, // Using username instead of user_id_proposed
      username_accepting: username, // Using username instead of user_id_accepting
      pokemon_instance_id_user_proposed: selectedMatchedInstance.ownershipStatus.instance_id, // Your Pokémon
      pokemon_instance_id_user_accepting: passedInPokemon.pokemonKey, // Their Pokémon
      is_special_trade: isSpecialTrade, // From your stardust calculation hook or other sources
      is_registered_trade: isRegisteredTrade, // From your sources
      is_lucky_trade: pref_lucky, // From your component state
      trade_dust_cost: stardustCost, // Calculated Stardust cost
      trade_friendship_level: friendship_level, // Numeric value (1-4)
      user_1_trade_satisfaction: null, // To be filled after trade
      user_2_trade_satisfaction: null, // To be filled after trade
      pokemon: passedInPokemon,
      trade_acceptance_date: null,
      trade_cancelled_by: null,
      trade_cancelled_date: null,
      trade_completed_date: null,
      trade_proposal_date: new Date().toISOString(),
      trade_status: 'proposed',
      last_update: Date.now(),             
    };

    try {
      // Use proposeTrade from context and get structured response
      const result = await proposeTrade(tradeData);
  
      if (!result.success) {
        // Differentiate error responses based on message content
        if (result.error.includes('already exists')) {
          await alert("This trade proposal already exists.");
        } else {
          await alert("Failed to create trade proposal. Please try again.");
        }
        return;
      }
  
      console.log(`Trade created with ID: ${result.tradeId}`);
      await alert("Trade proposal successfully created!");
      onClose();
    } catch (unexpectedError) {
      console.error("Unexpected error:", unexpectedError);
      await alert("An unexpected error occurred. Please try again.");
    }
  };

  const { stardustCost, isSpecialTrade, isRegisteredTrade } = useCalculateStardustCost(
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
              <div className="pokemon-details">
                <p>
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
            <div className="image-wrapper">
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
            </div>
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
          >
            Propose Trade
          </button>
          <div className="trade-proposal-arrow">
            <img
              src="/images/pogo_trade_icon.png"
              alt="Trade arrow"
              className="trade-proposal-arrow-image"
            />
          </div>
          <div className="trade-proposal-stardust">
            <p>Stardust Cost: {formattedStardustCost}</p>
            <img src="/images/stardust.png" alt="Stardust Icon" className="stardust-icon" />
            {isSpecialTrade && <p className="special-trade-warning">Special Trade!</p>}
          </div>
        </div>

        {/* BOTTOM ROW (Our matchedInstances) */}
        <div className="trade-proposal-row trade-proposal-row-bottom">
          <div className="trade-proposal-image-container">
            <div className="image-wrapper">
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
            </div>
            {selectedMatchedInstance && (
              <h3 className="trade-proposal-name">
                {generateH2Content(selectedMatchedInstance)}
              </h3>
            )}
          </div>
          <div className="trade-proposal-details">
            {/* Optional: show more details about the selected instance */}
            {selectedMatchedInstance && (
              <div className="pokemon-details">
                <CPComponent pokemon={selectedMatchedInstance} />
                <MovesComponent pokemon={selectedMatchedInstance} />
                <LocationCaughtComponent pokemon={selectedMatchedInstance} />
                <DateCaughtComponent pokemon={selectedMatchedInstance} />
              </div>
            )}

            {/* INSTANCE PICKER */}
            {matchedInstances.length > 1 ? (
              <div className="trade-instance-picker">
                <label htmlFor="instance-selector">Choose the instance to trade:</label>
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
              <p>
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
