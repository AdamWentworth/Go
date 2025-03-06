// FusionPokemonSelection.jsx

import React from 'react';
import CloseButton from '../../../../components/CloseButton';
import OwnedInstance from '../../InstanceOverlayComponents/OwnedInstance';
import './FusionPokemonSelection.css';

/**
 * Component for selecting and creating Fusion Pokémon.
 */
function FusionPokemonSelection({
  leftCandidatesList,
  rightCandidatesList,
  fusionData,
  onConfirm,
  onCancel,
  onCreateNewLeft,
  onCreateNewRight, 
  error,          
}) {

  const [selectedLeftInstance, setSelectedLeftInstance] = React.useState(null);
  const [selectedRightInstance, setSelectedRightInstance] = React.useState(null);

  /**
   * Handler for the "Fuse" button click.
   */
  const handleFuse = () => {
    if (!selectedLeftInstance || !selectedRightInstance) {
    alert('Please select one Pokémon from each side before fusing.');
    return;
    }

    // Instead of just "onConfirm('confirmFuse')", pass both instance IDs
    onConfirm('confirmFuse', selectedLeftInstance, selectedRightInstance);
    };
  
  return (
    <div className="fusion-pokemon-selection-overlay">
      <div className="fusion-modal-content">
        <h2>{fusionData.name}</h2>
        {/* Fuse Button */}
        <button
          className="fuse-button"
          onClick={handleFuse}
          disabled={!selectedLeftInstance || !selectedRightInstance}
        >
          Fuse Selected Pokémon
        </button>

        <div style={{ display: 'flex', gap: '2rem' }}>
          {/* LEFT COLUMN */}
          <div className="left-column">
            {leftCandidatesList.length === 0 ? (
              <p>No candidates found.</p>
            ) : (
              leftCandidatesList.map((c) => {
                const instanceId = c.ownershipStatus.instance_id;
                const isSelected = selectedLeftInstance === instanceId;
                return (
                  <div
                    key={instanceId}
                    className={`candidate-item ${isSelected ? 'selected' : ''}`}
                    onClick={() =>
                      setSelectedLeftInstance(isSelected ? null : instanceId)
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <OwnedInstance pokemon={c} />
                  </div>
                );
              })
            )}
            <button className="create-new-button" onClick={onCreateNewLeft}>
              Create New
            </button>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-column">
            {rightCandidatesList.length === 0 ? (
              <p>No candidates found.</p>
            ) : (
              rightCandidatesList.map((c) => {
                const instanceId = c.ownershipStatus.instance_id;
                const isSelected = selectedRightInstance === instanceId;
                return (
                  <div
                    key={instanceId}
                    className={`candidate-item ${isSelected ? 'selected' : ''}`}
                    onClick={() =>
                      setSelectedRightInstance(isSelected ? null : instanceId)
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    <OwnedInstance pokemon={c} />
                  </div>
                );
              })
            )}
            <button className="create-new-button" onClick={onCreateNewRight}>
              Create New
            </button>
          </div>
        </div>


        {/* Display Error if any */}
        {error && <p className="error">{error}</p>}
      </div>
      <CloseButton onClick={onCancel} />
    </div>
  );
}

export default FusionPokemonSelection;
