// TradeProposal.jsx
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './TradeProposal.css';

const TradeProposal = ({ passedInPokemon, clickedPokemon, onClose }) => {
    const closeButtonRef = useRef(null);

    useEffect(() => {
        if (closeButtonRef.current) {
            closeButtonRef.current.focus();
        }
    }, []);

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

                {/* First Row: Passed-in Pokémon */}
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
                        {/* Placeholder for Pokémon Image */}
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
                        onClick={onClose}
                    >
                        Propose Trade
                    </button>
                    <div className="trade-proposal-arrow">
                        {/* Diagonal Arrow */}
                        <svg
                            width="100"
                            height="100"
                            className="trade-proposal-diagonal-arrow"
                        >
                            <defs>
                                <marker
                                    id="arrowhead"
                                    markerWidth="10"
                                    markerHeight="7"
                                    refX="0"
                                    refY="3.5"
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3.5, 0 7" />
                                </marker>
                            </defs>
                            <line
                                x1="0"
                                y1="100"
                                x2="100"
                                y2="0"
                                stroke="black"
                                strokeWidth="2"
                                markerEnd="url(#arrowhead)"
                            />
                        </svg>
                    </div>
                    <div className="trade-proposal-stardust">
                        {/* Placeholder for Stardust Count */}
                        <p>Stardust: 0</p>
                    </div>
                </div>

                {/* Bottom Row: Clicked Pokémon */}
                <div className="trade-proposal-row trade-proposal-row-bottom">
                    <div className="trade-proposal-image">
                        {/* Placeholder for Pokémon Image */}
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
                        {/* Add more details as needed */}
                    </div>
                </div>
            </div>
        </div>
    )
    };

    TradeProposal.propTypes = {
        passedInPokemon: PropTypes.shape({
            name: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            level: PropTypes.number.isRequired,
            currentImage: PropTypes.string.isRequired,
            stardust: PropTypes.number,
            // Add other relevant properties
        }).isRequired,
        clickedPokemon: PropTypes.shape({
            name: PropTypes.string.isRequired,
            type: PropTypes.string.isRequired,
            level: PropTypes.number.isRequired,
            currentImage: PropTypes.string.isRequired,
            // Add other relevant properties
        }).isRequired,
        onClose: PropTypes.func.isRequired,
    };

    export default TradeProposal;
