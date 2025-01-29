// OffersTradeView.jsx

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import MoveDisplay from '../../Discover/views/ListViewComponents/MoveDisplay';
import IVDisplay from '../../Discover/views/ListViewComponents/IVDisplay';
import FriendshipLevel from '../../Discover/views/ListViewComponents/FriendshipLevel';
import { TRADE_FRIENDSHIP_LEVELS } from '../../../services/indexedDB';
import './OffersTradeView.css';
import { formatDate } from '../../../utils/formattingHelpers';
import { hasDetails } from '../helpers/hasDetails';

const OffersTradeView = ({
  trade,
  currentUsername,
  forTradeDetails,
  offeredDetails,
  loading,
  handleAccept,
  handleDeny,
}) => {
  const [visibleDetails, setVisibleDetails] = useState({
    offering: false,
    receiving: false,
  });

  const reversedFriendshipLevels = Object.entries(TRADE_FRIENDSHIP_LEVELS).reduce((acc, [key, value]) => {
    acc[value] = parseInt(key, 10);
    return acc;
  }, {});
  const friendshipLevel = reversedFriendshipLevels[trade.trade_friendship_level] || 0;

  useEffect(() => {
    if (forTradeDetails) {
      console.log('For Trade Details:', forTradeDetails);
    }
    if (offeredDetails) {
      console.log('Offered (current user) Details:', offeredDetails);
    }
  }, [forTradeDetails, offeredDetails]);

  /** Toggle function for show/hide detail overlays. */
  const toggleDetails = (section) => {
    setVisibleDetails((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  /** Render the deeper Pokémon stats (weight, moves, IVs, location, etc.). */
  const renderPokemonDetails = (details, isVisible) => {
    if (!details) return null;
    if (!hasDetails(details)) {
      return isVisible ? <p>No additional details available.</p> : null;
    }

    const hasWeightOrHeight = details.weight || details.height;
    const hasMoves = details.fast_move_id || details.charged_move1_id || details.charged_move2_id;

    return (
      <>
        {(hasWeightOrHeight || hasMoves) && (
          <div className="weight-height-move-container">
            {details.weight && (
              <p className="stat">
                <strong>{details.weight}kg</strong>
                <br />
                WEIGHT
              </p>
            )}
            {hasMoves && (
              <MoveDisplay
                fastMoveId={details.fast_move_id}
                chargedMove1Id={details.charged_move1_id}
                chargedMove2Id={details.charged_move2_id}
                moves={details.moves}
              />
            )}
            {details.height && (
              <p className="stat">
                <strong>{details.height}m</strong>
                <br />
                HEIGHT
              </p>
            )}
          </div>
        )}

        <IVDisplay item={details} />
        {details.location_caught && <p><strong>Location Caught:</strong> {details.location_caught}</p>}
        {details.date_caught && <p><strong>Date Caught:</strong> {formatDate(details.date_caught)}</p>}
      </>
    );
  };

  const renderPokemonSection = (details, section, heading, username) => {
    const hasDetailsToShow = details && hasDetails(details);
    const sectionClass = `pokemon ${section} ${hasDetailsToShow ? 'has-details' : 'no-details'}`;

    return (
      <div className={sectionClass}>
        <div className="headers">
          {username && <p className="receiving-username">{username}</p>}
          <h4>{heading}</h4>
        </div>

        <div className="pokemon-content">
          <div className="static-content">
            {details ? (
              <>
                <div className="pokemon-image-container">
                  <div className="image-wrapper">
                    {trade.is_lucky_trade && (
                      <div className="lucky-backdrop-wrapper">
                        <img
                          src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                          alt="Lucky backdrop"
                          className="lucky-backdrop"
                        />
                      </div>
                    )}
                    {details && (details.currentImage || details.pokemon_image_url) ? (
                      <img
                        src={details.currentImage || details.pokemon_image_url}
                        alt={details.name || `${section} Pokémon`}
                        className="pokemon-image"
                      />
                    ) : (
                      <p>No image available.</p>
                    )}
                  </div>
                </div>
                <p className="pokemon-name">
                  {details.name || details.pokemon_name || 'Unknown Pokémon'}
                </p>
                <div className="pokemon-types">
                  {details.type_1_icon && (
                    <img src={details.type_1_icon} alt="Type 1" className="type-icon" />
                  )}
                  {details.type_2_icon && (
                    <img src={details.type_2_icon} alt="Type 2" className="type-icon" />
                  )}
                </div>
              </>
            ) : loading ? (
              <LoadingSpinner />
            ) : (
              <p>Could not load {section} details.</p>
            )}

            {/* Toggle Details Button */}
            {details && (
              <button className="toggle-details-button" onClick={() => toggleDetails(section)}>
                {visibleDetails[section] ? 'Hide Details' : 'Show Details'}
              </button>
            )}
          </div>

          {/* If the Pokémon has details, render the details section with the same show/hide logic */}
            <div className={`details-content ${section}-details ${visibleDetails[section] ? 'visible' : ''}`}>
              {renderPokemonDetails(details, visibleDetails[section])}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trade-card offers-trade-view">
      <div className="trade-pokemon">
        {/* LEFT SIDE: The other user's Pokémon, labeled "Offered" */}
        {renderPokemonSection(forTradeDetails, 'for-trade', 'For Trade:', currentUsername)}

        {/* CENTER COLUMN: Trade Icon + Accept/Deny */}
        <div className="center-column">
          <FriendshipLevel 
            level={friendshipLevel} 
            prefLucky={trade.is_lucky_trade}
          />
          <div className="trade-icon">
            <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
          </div>
          <div className="stardust-display">
            <img 
              src="/images/stardust.png" 
              alt="Stardust" 
              className="stardust-icon"
            />
            <span className="stardust-cost">
              {trade.trade_dust_cost?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="trade-actions">
            <button className="deny-button" onClick={handleDeny}>
              Deny
            </button>
            <button className="accept-button" onClick={handleAccept}>
              Accept
            </button>
          </div>
        </div>
        {renderPokemonSection(offeredDetails, 'offered', 'Offered', trade.username_proposed)}
      </div>
    </div>
  );
};

export default OffersTradeView;