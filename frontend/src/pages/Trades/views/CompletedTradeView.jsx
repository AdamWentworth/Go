// CompletedTradeView.jsx
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import MoveDisplay from '../../Discover/views/ListViewComponents/MoveDisplay';
import IVDisplay from '../../Discover/views/ListViewComponents/IVDisplay';
import GenderIcon from '../../Discover/views/ListViewComponents/GenderIcon';
import FriendshipLevel from '../../Discover/views/ListViewComponents/FriendshipLevel';
import { TRADE_FRIENDSHIP_LEVELS } from '../../../services/indexedDB';
import { formatDate } from '../../../utils/formattingHelpers';
import { hasDetails } from '../helpers/hasDetails';
import './CompletedTradeView.css';

const CompletedTradeView = ({
  trade,
  currentUserDetails,
  partnerDetails,
  loading,
  handleThumbsUp
}) => {
  const [visibleDetails, setVisibleDetails] = useState({
    left: false,
    right: false,
  });

  useEffect(() => {
    if (currentUserDetails) {
      console.log('For Trade Details:', currentUserDetails);
    }
    if (partnerDetails) {
      console.log('Partner\'s Pokemon Details:', partnerDetails);
    }
  }, [currentUserDetails, partnerDetails]);

  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  // Determine user role and satisfaction status
  const isCurrentUserProposer = trade.username_proposed === currentUsername;
  const satisfactionStatus = isCurrentUserProposer
    ? trade.user_1_trade_satisfaction
    : trade.user_2_trade_satisfaction;

  // Always show received Pokémon on left
  const leftDetails = partnerDetails;
  const rightDetails = currentUserDetails;

  // Get usernames
  const leftUsername = currentUsername;
  const rightUsername = isCurrentUserProposer ? trade.username_accepting : trade.username_proposed;

  // Fixed headings
  const leftHeading = 'Received Pokémon';
  const rightHeading = 'Traded Pokémon';

  // Friendship level calculation
  const reversedFriendshipLevels = Object.entries(TRADE_FRIENDSHIP_LEVELS).reduce((acc, [key, value]) => {
    acc[value] = parseInt(key, 10);
    return acc;
  }, {});
  const friendshipLevel = reversedFriendshipLevels[trade.trade_friendship_level] || 0;

  const toggleDetails = (section) => {
    setVisibleDetails(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

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
    const sectionClass = `pokemon ${section}-side ${hasDetailsToShow ? 'has-details' : 'no-details'}`;

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
                    {/* Dynamax Icon */}
                    {details.variantType?.includes('dynamax') && (
                      <img
                          src={`${process.env.PUBLIC_URL}/images/dynamax.png`}
                          alt="Dynamax"
                          style={{
                              position: 'absolute',
                              top: '0',
                              right: '3%',
                              width: '30%',
                              height: 'auto',
                              zIndex: 0,
                          }}
                      />
                    )}
                    {/* Gigantamax Icon */}
                    {details.variantType?.includes('gigantamax') && (
                        <img
                            src={`${process.env.PUBLIC_URL}/images/gigantamax.png`}
                            alt="Gigantamax"
                            style={{
                                position: 'absolute',
                                top: '0',
                                right: '3%',
                                width: '30%',
                                height: 'auto',
                                zIndex: 0,
                            }}
                        />
                    )}
                    {(details.currentImage || details.pokemon_image_url) ? (
                      <img
                        src={details.currentImage || details.pokemon_image_url}
                        alt={details.name || `${section} Pokémon`}
                        className="pokemon-image"
                      />
                    ) : (
                      <p>No image available.</p>
                    )}
                    {details?.gender && <GenderIcon gender={details.gender} />}
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

            {details && (
              <button className="toggle-details-button" onClick={() => toggleDetails(section)}>
                {visibleDetails[section] ? 'Hide Details' : 'Show Details'}
              </button>
            )}
          </div>

          <div className={`details-content ${section}-details ${visibleDetails[section] ? 'visible' : ''}`}>
            {renderPokemonDetails(details, visibleDetails[section])}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trade-card completed-trade-view">
      <h2>Trade Completed</h2>
      {trade.trade_completed_date && (
        <p className="completion-details">
          Completed on: {new Date(trade.trade_completed_date).toLocaleString()}
        </p>
      )}

      <div className="trade-pokemon">
        {renderPokemonSection(leftDetails, 'left', leftHeading, leftUsername)}
        
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
        </div>

        {renderPokemonSection(rightDetails, 'right', rightHeading, rightUsername)}
      </div>

      <div className="trade-actions">
        <p className="trade-feedback-text">
          {satisfactionStatus ? "Thanks for the feedback!" : "Satisfied with your trade?"}
        </p>
        <button
          className={`thumbs-up-button ${satisfactionStatus ? 'active' : ''}`}
          onClick={handleThumbsUp}
        >
          👍
        </button>
      </div>
    </div>
  );
};

export default CompletedTradeView;