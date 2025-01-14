// PartnerInfoModal.jsx
import React from 'react';
import './PartnerInfoModal.css'; // optional CSS file
import CloseButton from '../../../components/CloseButton';

/**
 * A single-component modal that displays partner info (trainer code, name, etc.).
 * 
 * @param {object} props.partnerInfo - The revealed partner data (may be null).
 * @param {function} props.onClose - A callback to close the modal.
 */
function PartnerInfoModal({ partnerInfo, onClose }) {
  // If partnerInfo is null/undefined, don't render anything at all
  if (!partnerInfo) return null;

  const {
    trainerCode,
    pokemonGoName,
    location,
    coordinates
  } = partnerInfo;

  const coordsDisplay = (coordinates?.latitude && coordinates?.longitude)
    ? `(${coordinates.latitude}, ${coordinates.longitude})`
    : 'N/A';

  return (
    <div className="partner-modal-overlay">
      <div className="modal-content">
        {/* Use the existing CloseButton component */}
        <CloseButton onClick={onClose} />

        <h2>Partner Info</h2>
        <p><strong>Trainer Code:</strong> {trainerCode || 'N/A'}</p>
        <p><strong>Pokémon GO Name:</strong> {pokemonGoName || 'N/A'}</p>
        <p><strong>Location:</strong> {location || 'N/A'}</p>
        <p><strong>Coordinates:</strong> {coordsDisplay}</p>
      </div>
    </div>
  );
}

export default PartnerInfoModal;
