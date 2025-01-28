import React, { useEffect, useState } from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import MoveDisplay from '../../Discover/views/ListViewComponents/MoveDisplay';
import IVDisplay from '../../Discover/views/ListViewComponents/IVDisplay';
import './ProposedTradeView.css';

// Utility function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown Date';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

// Function to check if a Pokémon has any details
const hasDetails = (pokemon) => {
  if (!pokemon) return false;
  
  return (
    pokemon.weight ||
    pokemon.height ||
    pokemon.fast_move_id ||
    pokemon.charged_move1_id ||
    pokemon.charged_move2_id ||
    pokemon.attack_iv !== null ||
    pokemon.defense_iv !== null ||
    pokemon.stamina_iv !== null ||
    pokemon.location_caught ||
    pokemon.date_caught
  );
};

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

  useEffect(() => {
    if (offeringDetails) console.log('Offering Details:', offeringDetails);
    if (receivingCombinedDetails) console.log('Receiving Details:', receivingCombinedDetails);
  }, [offeringDetails, receivingCombinedDetails]);

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
                moves={details.moves}
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

  return (
    <div className="trade-card proposed-trade-view">
      <div className="trade-pokemon">
        {/* Offering Section */}
        <div className="pokemon offering">
          <div className="headers">
            {trade.username_proposed && <p className="receiving-username">{trade.username_proposed}</p>}
            <h4>{offeringHeading}</h4>
          </div>

          <div className="pokemon-content">
            <div className="static-content">
              {offeringDetails ? (
                <>
                  <div className="pokemon-image-container">
                    <img src={offeringDetails.currentImage} alt={offeringDetails.name || 'Offering Pokémon'} />
                  </div>
                  <p className="pokemon-name">{offeringDetails.name || 'Unknown Pokémon'}</p>
                  <div className="pokemon-types">
                    {offeringDetails.type_1_icon && <img src={offeringDetails.type_1_icon} alt="Type 1" className="type-icon" />}
                    {offeringDetails.type_2_icon && <img src={offeringDetails.type_2_icon} alt="Type 2" className="type-icon" />}
                  </div>
                </>
              ) : loading ? <LoadingSpinner /> : <p>Could not load offering details.</p>}
              {offeringDetails && <button className="toggle-details-button" onClick={() => toggleDetails('offering')}>
                {visibleDetails.offering ? 'Hide Details' : 'Show Details'}
              </button>}
            </div>

            {/* Only render details content if there are details or if we need to show "No additional details" */}
            {offeringDetails && (visibleDetails.offering || hasDetails(offeringDetails)) && (
              <div className={`details-content offering-details ${visibleDetails.offering ? 'visible' : ''}`}>
                {renderPokemonDetails(offeringDetails, visibleDetails.offering)}
              </div>
            )}
          </div>
        </div>

        {/* Trade Actions */}
        <div className="center-column">
          <div className="trade-icon">
            <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
          </div>
          <div className="trade-actions">
            <button className="delete-button" onClick={handleDelete}>Delete</button>
          </div>
        </div>

        {/* Receiving Section */}
        <div className="pokemon received">
          <div className="headers">
            {trade.username_accepting && <p className="receiving-username">{trade.username_accepting}</p>}
            <h4>{receivingHeading}</h4>
          </div>

          <div className="pokemon-content">
            <div className="static-content">
              {receivingCombinedDetails ? (
                <>
                  <div className="pokemon-image-container">
                    <img src={receivingCombinedDetails.currentImage || receivingCombinedDetails.pokemon_image_url} alt={receivingCombinedDetails.name || 'Receiving Pokémon'} />
                  </div>
                  <p className="pokemon-name">{receivingCombinedDetails.name || 'Unknown Pokémon'}</p>
                  <div className="pokemon-types">
                    {receivingCombinedDetails.type_1_icon && <img src={receivingCombinedDetails.type_1_icon} alt="Type 1" className="type-icon" />}
                    {receivingCombinedDetails.type_2_icon && <img src={receivingCombinedDetails.type_2_icon} alt="Type 2" className="type-icon" />}
                  </div>
                </>
              ) : loading ? <LoadingSpinner /> : <p>Could not load receiving details.</p>}
              {receivingCombinedDetails && <button className="toggle-details-button" onClick={() => toggleDetails('receiving')}>
                {visibleDetails.receiving ? 'Hide Details' : 'Show Details'}
              </button>}
            </div>

            {/* Only render details content if there are details or if we need to show "No additional details" */}
            {receivingCombinedDetails && (visibleDetails.receiving || hasDetails(receivingCombinedDetails)) && (
              <div className={`details-content receiving-details ${visibleDetails.receiving ? 'visible' : ''}`}>
                {renderPokemonDetails(receivingCombinedDetails, visibleDetails.receiving)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposedTradeView;