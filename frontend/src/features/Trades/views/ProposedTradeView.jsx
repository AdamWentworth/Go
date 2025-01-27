import React from 'react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import './ProposedTradeView.css';

const ProposedTradeView = ({
  trade,
  offeringDetails,
  receivingCombinedDetails,
  loading,
  offeringHeading,
  receivingHeading,
  handleDelete
}) => (
  <div className="trade-card proposed-trade-view">
    <div className="trade-pokemon">
      <div className="pokemon offering">
        {trade.username_proposed && (
          <p className="receiving-username">{trade.username_proposed}</p>
        )}
        <h4>{offeringHeading}</h4>
        {offeringDetails ? (
          <>
            <div className="pokemon-image-container">
              <img 
                src={offeringDetails.currentImage} 
                alt={offeringDetails.name || 'Offering Pokémon'} 
              />
            </div>
            <p>{offeringDetails.name || offeringDetails.pokemon_name}</p>
          </>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <p>Could not load offering details.</p>
        )}
      </div>

      <div className="center-column">
        <div className="trade-icon">
          <img src="/images/pogo_trade_icon.png" alt="Trade Icon" />
        </div>
        <div className="trade-actions">
          <button className="delete-button" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="pokemon received">
        {trade.username_accepting && (
          <p className="receiving-username">{trade.username_accepting}</p>
        )}
        <h4>{receivingHeading}</h4>
        {receivingCombinedDetails ? (
          <>
            <div className="pokemon-image-container">
              <img 
                src={receivingCombinedDetails.currentImage || receivingCombinedDetails.pokemon_image_url} 
                alt={receivingCombinedDetails.name || 'Receiving Pokémon'} 
              />
            </div>
            <p>{receivingCombinedDetails.name || receivingCombinedDetails.pokemon_name}</p>
          </>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <p>Could not load receiving details.</p>
        )}
      </div>
    </div>
  </div>
);

export default ProposedTradeView;
