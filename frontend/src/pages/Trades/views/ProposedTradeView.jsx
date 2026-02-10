// ProposedTradeView.jsx

import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import MoveDisplay from '../../../components/pokemonComponents/MoveDisplay.jsx';
import IV from '../../../components/pokemonComponents/IV.jsx';
import FriendshipLevel from '../../../components/pokemonComponents/FriendshipLevel.jsx';
import Gender from '../../../components/pokemonComponents/Gender';
import { TRADE_FRIENDSHIP_LEVELS } from '../../../db/indexedDB';
import { formatDate } from '../../../utils/formattingHelpers';
import { hasDetails } from '../helpers/hasDetails';
import './ProposedTradeView.css';

const ProposedTradeView = ({
  trade,
  currentUserDetails,
  partnerDetails,
  loading,
  offeringHeading,
  receivingHeading,
  handleDelete,
}) => {
  const [visibleDetails, setVisibleDetails] = useState({
    offering: false,
    receiving: false,
  });

  // Convert friendship level string to integer
  const reversedFriendshipLevels = Object.entries(TRADE_FRIENDSHIP_LEVELS).reduce((acc, [key, value]) => {
    acc[value] = parseInt(key, 10);
    return acc;
  }, {});

  const friendshipLevel = reversedFriendshipLevels[trade.trade_friendship_level] || 0;

  useEffect(() => {
    if (currentUserDetails) {
      console.log('Offering Details Structure:', {
      section: 'offering',
      hasDetails: hasDetails(currentUserDetails, 'offering'),
      name: currentUserDetails?.name
    });
  }
  if (partnerDetails) {
      console.log('Receiving Details Structure:', {
      section: 'received',
      hasDetails: hasDetails(partnerDetails, 'received'),
      name: partnerDetails?.name
    });
  }
  }, [currentUserDetails, partnerDetails]);

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
                <br />WEIGHT
              </p>
            )}
            {hasMoves && (
              <MoveDisplay
                fastMoveId={details.fast_move_id}
                chargedMove1Id={details.charged_move1_id}
                chargedMove2Id={details.charged_move2_id}
                moves={details?.moves ?? []}
                pokemonId={details.pokemon_id} // Add this if needed
              />
            )}
            {details.height && (
              <p className="stat">
                <strong>{details.height}m</strong>
                <br />HEIGHT
              </p>
            )}
          </div>
        )}
        <IV ivs={{ 
          Attack: details.attack_iv, 
          Defense: details.defense_iv, 
          Stamina: details.stamina_iv 
        }} />
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
                  {trade.is_lucky_trade ? (
                        <div className="lucky-backdrop-wrapper">
                          <img
                            src={`/images/lucky.png`}
                            alt="Lucky backdrop"
                            className="lucky-backdrop"
                          />
                        </div>
                      ) : null}
                    {/* Dynamax Icon */}
                    {details.variantType?.includes('dynamax') && (
                      <img
                          src={`/images/dynamax.png`}
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
                          src={`/images/gigantamax.png`}
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
                    {details && (details.currentImage || details.pokemon_image_url) ? (
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
                <p className="pokemon-name">{details.name || 'Unknown Pokémon'}</p>
                <div className="pokemon-types">
                  {details.type_1_icon && <img src={details.type_1_icon} alt="Type 1" className="type-icon" />}
                  {details.type_2_icon && <img src={details.type_2_icon} alt="Type 2" className="type-icon" />}
                </div>
              </>
            ) : loading ? <LoadingSpinner /> : <p>Could not load {section} details.</p>}
            {details && <button className="toggle-details-button" onClick={() => toggleDetails(section)}>
              {visibleDetails[section] ? 'Hide Details' : 'Show Details'}
            </button>}
          </div>

            <div className={`details-content ${section}-details ${visibleDetails[section] ? 'visible' : ''}`}>
            {renderPokemonDetails(details, visibleDetails[section])}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trade-card proposed-trade-view">
      <div className="trade-pokemon">
        {renderPokemonSection(currentUserDetails, 'offering', offeringHeading, trade.username_proposed)}
        
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
              src={`/images/stardust.png`} 
              alt="Stardust" 
              className="stardust-icon"
            />
            <span className="stardust-cost">
              {trade.trade_dust_cost?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="trade-actions">
            <button className="delete-button" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        {renderPokemonSection(partnerDetails, 'received', receivingHeading, trade.username_accepting)}
      </div>
    </div>
  );
};

export default ProposedTradeView;
