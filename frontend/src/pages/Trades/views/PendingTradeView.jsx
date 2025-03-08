// PendingTradeView.jsx
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import MoveDisplay from '../../../components/pokemonComponents/MoveDisplay';
import IV from '../../../components/pokemonComponents/IV';
import Gender from '../../../components/pokemonComponents/Gender';
import FriendshipLevel from '../../../components/pokemonComponents/FriendshipLevel';
import { TRADE_FRIENDSHIP_LEVELS } from '../../../services/indexedDB';
import { formatDate } from '../../../utils/formattingHelpers';
import { hasDetails } from '../helpers/hasDetails';
import { revealPartnerInfo } from '../../../services/tradeService';
import PartnerInfoModal from '../components/PartnerInfoModal';
import './PendingTradeView.css';

const PendingTradeView = ({
  trade,
  currentUserDetails,
  partnerDetails,
  loading,
  handleComplete,
  handleCancel
}) => {
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [error, setError] = useState(null);
  const [revealInProgress, setRevealInProgress] = useState(false);
  const [completionInProgress, setCompletionInProgress] = useState(false);
  const [visibleDetails, setVisibleDetails] = useState({
    left: false,
    right: false,
  });

  console.log(trade)

  const reversedFriendshipLevels = Object.entries(TRADE_FRIENDSHIP_LEVELS).reduce((acc, [key, value]) => {
      acc[value] = parseInt(key, 10);
      return acc;
    }, {});
    const friendshipLevel = reversedFriendshipLevels[trade.trade_friendship_level] || 0;

  const storedUser = localStorage.getItem('user');
  const currentUsername = storedUser ? JSON.parse(storedUser).username : '';

  // Add state for local trade copy
  const [localTrade, setLocalTrade] = useState(trade);

  // Update local trade when prop changes
  useEffect(() => {
    setLocalTrade(trade);
  }, [trade]);

  const isCurrentUserProposer = trade.username_proposed === currentUsername;
  const userConfirmationField = isCurrentUserProposer 
    ? 'user_proposed_completion_confirmed' 
    : 'user_accepting_completion_confirmed';
  const partnerConfirmationField = isCurrentUserProposer 
    ? 'user_accepting_completion_confirmed' 
    : 'user_proposed_completion_confirmed';

  const hasUserConfirmed = trade[userConfirmationField];
  const hasPartnerConfirmed = trade[partnerConfirmationField];

  // Always show current user's Pokémon on left
  const leftDetails = currentUserDetails;
  const rightDetails = partnerDetails;

  // Get partner username (the non-current user)
  const partnerUsername = isCurrentUserProposer 
    ? trade.username_accepting 
    : trade.username_proposed;

  // Fixed headings
  const leftHeading = 'Your Pokémon';
  const rightHeading = "Trade Partner's Pokémon";

  useEffect(() => {
    if (leftDetails) {
      console.log('For Trade (current user) Details:', leftDetails);
    }
    if (rightDetails) {
      console.log('Offered Details:', rightDetails);
    }
  }, [leftDetails, rightDetails]);

  const toggleDetails = (section) => {
    setVisibleDetails((prev) => ({
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

        <IV item={details} />
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
                  {trade.is_lucky_trade ? (
                        <div className="lucky-backdrop-wrapper">
                          <img
                            src={`${process.env.PUBLIC_URL}/images/lucky.png`}
                            alt="Lucky backdrop"
                            className="lucky-backdrop"
                          />
                        </div>
                      ) : null}
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
                    {details?.gender && <Gender gender={details.gender} />}
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

  const handleRevealInfo = async () => {
    setRevealInProgress(true);
    setError(null);
    try {
      const data = await revealPartnerInfo(trade);
      setPartnerInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevealInProgress(false);
    }
  };

  const handleCloseModal = () => {
    setPartnerInfo(null);
    setError(null);
  };

  const handleCompleteClick = async () => {
    setCompletionInProgress(true);
    try {
      // Optimistically update local state
      setLocalTrade(prev => ({
        ...prev,
        [userConfirmationField]: true
      }));
      
      await handleComplete(localTrade);
    } catch (err) {
      // Rollback on error
      setLocalTrade(trade);
      setError(err.message);
    } finally {
      setCompletionInProgress(false);
    }
  };

  const getCompleteButtonText = () => {
    if (hasUserConfirmed) {
      return hasPartnerConfirmed ? "Trade Complete!" : "Awaiting Partner...";
    }
    return "Confirm Complete";
  };

  const getCompleteButtonClass = () => {
    const baseClass = "complete-button";
    if (hasUserConfirmed) {
      return hasPartnerConfirmed 
        ? `${baseClass} completed` 
        : `${baseClass} awaiting-partner`;
    }
    return baseClass;
  };

  const disableCompleteButton = completionInProgress || 
    (hasPartnerConfirmed && hasUserConfirmed) ||
    hasUserConfirmed;

  return (
    <div className="trade-card pending-trade-view">
          <div className="reveal-partner-info">
            <button
              className="reveal-partner-button"
              onClick={handleRevealInfo}
              disabled={revealInProgress}
            >
              <span>Reveal Trade Partner Info</span>
            </button>
            {error && <p className="error">{error}</p>}
          </div>
      <div className="trade-pokemon">
        {renderPokemonSection(leftDetails, 'left', leftHeading, currentUsername)}
        
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

        {renderPokemonSection(rightDetails, 'right', rightHeading, partnerUsername)}
      </div>

      <div className="trade-actions">
        <button 
          className={getCompleteButtonClass()}
          onClick={handleCompleteClick}
          disabled={disableCompleteButton}
        >
          {getCompleteButtonText()}
        </button>
        <button 
          className="cancel-button" 
          onClick={handleCancel}
          disabled={completionInProgress}
        >
          Cancel
        </button>
      </div>

      <PartnerInfoModal
        partnerInfo={partnerInfo}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default PendingTradeView;