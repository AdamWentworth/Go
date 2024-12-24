// TradeProposal.jsx
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './TradeProposal.css';

const TradeProposal = ({ passedInPokemon, clickedPokemon, onClose }) => {
    const closeButtonRef = useRef(null);

    // New local state to hold the selected matched instance
    const [selectedMatchedInstance, setSelectedMatchedInstance] = useState(null);

    useEffect(() => {
        if (closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, []);

    // If data is missing, show error
    if (!passedInPokemon || !clickedPokemon) {
        return (
            <div className="trade-proposal-overlay">
                <div className="trade-proposal-container">
                    <button
                        className="trade-proposal-close-button"
                        onClick={onClose}
                        aria-label="Close Trade Proposal"
                        ref={closeButtonRef}
                    >
                        X
                    </button>
                    <div className="trade-proposal-row">
                        <p className="trade-proposal-error">Missing Pokémon data. Please try again.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Pull out the matchedInstances (if any) from clickedPokemon
    const { matchedInstances = [] } = clickedPokemon;

    // If we haven’t picked an instance yet, pick the first one by default
    useEffect(() => {
        if (matchedInstances.length > 0) {
            setSelectedMatchedInstance(matchedInstances[0]);
        }
    }, [matchedInstances]);

    // Handler for changing the selected matched instance
    const handleInstanceChange = (e) => {
        const instanceId = e.target.value;
        const foundInstance = matchedInstances.find(inst => inst.instance_id === instanceId);
        setSelectedMatchedInstance(foundInstance);
    };

    // This is the button the user clicks to confirm the trade
    const handleProposeTrade = () => {
        if (!selectedMatchedInstance) {
            alert("Please select which instance to trade.");
            return;
        }
        //  If you eventually handle the final trade logic, you can pass
        //  `selectedMatchedInstance` to your API or store for further processing.
        console.log("Propose trade with instance: ", selectedMatchedInstance);
        
        // For now, just close. You’ll want to expand this to do actual trade logic.
        onClose();
    };

    return (
        <div className="trade-proposal-overlay">
            <div className="trade-proposal-container">
                {/* Close Button */}
                <button
                    className="trade-proposal-close-button"
                    onClick={onClose}
                    aria-label="Close Trade Proposal"
                    ref={closeButtonRef}
                >
                    X
                </button>

                {/* First Row: Passed-in Pokémon (the one the other person might give you) */}
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
                        {/* Add more details as needed */}
                    </div>
                    <div className="trade-proposal-image">
                        <img
                            src={passedInPokemon.currentImage || '/images/default/placeholder.png'}
                            alt={passedInPokemon.name}
                            className="trade-proposal-pokemon-img"
                        />
                    </div>
                </div>

                {/* Middle Row: Propose Trade and Stardust */}
                <div className="trade-proposal-row trade-proposal-row-middle">
                    <button
                        className="trade-proposal-propose-button"
                        onClick={handleProposeTrade}
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
                        <p>Stardust: 0</p>
                    </div>
                </div>

                {/* Bottom Row: The Pokémon we are offering (clickedPokemon) */}
                <div className="trade-proposal-row trade-proposal-row-bottom">
                    <div className="trade-proposal-image">
                        <img
                            src={clickedPokemon.currentImage || '/images/default/placeholder.png'}
                            alt={clickedPokemon.name}
                            className="trade-proposal-pokemon-img"
                        />
                    </div>
                    <div className="trade-proposal-details">
                        <h3 className="trade-proposal-name">
                            {clickedPokemon.name || 'Clicked Pokémon'}
                        </h3>
                        <p className="trade-proposal-type">
                            Type: {clickedPokemon.type || 'Type Details'}
                        </p>
                        <p className="trade-proposal-level">
                            Level: {clickedPokemon.level || 'Level Details'}
                        </p>
                        
                        {/* ---- Trade Instance Picker ---- */}
                        {matchedInstances.length > 1 ? (
                            <div className="trade-instance-picker">
                                <label htmlFor="instance-selector" style={{ marginRight: '8px' }}>
                                    Choose the instance to trade:
                                </label>
                                <select
                                    id="instance-selector"
                                    value={selectedMatchedInstance?.instance_id || ''}
                                    onChange={handleInstanceChange}
                                >
                                    {matchedInstances.map(inst => (
                                        <option key={inst.instance_id} value={inst.instance_id}>
                                            {inst.nickname
                                                ? `${inst.nickname} (Lv. ${inst.level || '?'})`
                                                : `${clickedPokemon.name} (Lv. ${inst.level || '?'})`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <p style={{ marginTop: '10px', color: 'white' }}>
                                {matchedInstances.length === 1
                                    ? `Instance: ${matchedInstances[0].instance_id}`
                                    : 'No tradeable instances found.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TradeProposal;
