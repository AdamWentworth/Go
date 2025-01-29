// ProposedTradeView.jsx

import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import MoveDisplay from '../../Discover/views/ListViewComponents/MoveDisplay';
import IVDisplay from '../../Discover/views/ListViewComponents/IVDisplay';
import FriendshipLevel from '../../Discover/views/ListViewComponents/FriendshipLevel';
import { TRADE_FRIENDSHIP_LEVELS } from '../../../services/indexedDB';
import { formatDate } from '../../../utils/formattingHelpers';
import { hasDetails } from '../helpers/hasDetails';
import './ProposedTradeView.css';

const ProposedTradeView = ({
  trade,
  offeringDetails,
  receivingCombinedDetails,
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
    if (offeringDetails) {
      console.log('Offering Details Structure:', {
      section: 'offering',
      hasDetails: hasDetails(offeringDetails, 'offering'),
      name: offeringDetails?.name
    });
  }
  if (receivingCombinedDetails) {
      console.log('Receiving Details Structure:', {
      section: 'received',
      hasDetails: hasDetails(receivingCombinedDetails, 'received'),
      name: receivingCombinedDetails?.name
    });
  }
  }, [offeringDetails, receivingCombinedDetails]);

  const toggleDetails = (section) => {
    setVisibleDetails((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderPokemonDetails = (details, isVisible, section) => {
    if (!details) return null;
    if (!hasDetails(details, section)) {
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
                moves={details.moves}
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
        <IVDisplay item={details} />
        {details.location_caught && <p><strong>Location Caught:</strong> {details.location_caught}</p>}
        {details.date_caught && <p><strong>Date Caught:</strong> {formatDate(details.date_caught)}</p>}
      </>
    );
  };

  const renderPokemonSection = (details, section, heading, username) => {
    const hasDetailsToShow = details && hasDetails(details, section);
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
            {renderPokemonDetails(details, visibleDetails[section], section)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="trade-card proposed-trade-view">
      <div className="trade-pokemon">
        {renderPokemonSection(offeringDetails, 'offering', offeringHeading, trade.username_proposed)}
        
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

        {renderPokemonSection(receivingCombinedDetails, 'received', receivingHeading, trade.username_accepting)}
      </div>
    </div>
  );
};

export default ProposedTradeView;