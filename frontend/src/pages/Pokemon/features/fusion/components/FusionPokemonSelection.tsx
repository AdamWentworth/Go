// FusionPokemonSelection.tsx

import React, { useState } from 'react';
import CloseButton from '@/components/CloseButton';
import OwnedInstance from '../../instances/OwnedInstance';
import './FusionPokemonSelection.css';

import { Fusion } from '@/types/pokemonSubTypes';
import { PokemonVariant } from '@/types/pokemonVariants';

type FusionPokemonSelectionProps = {
  leftCandidatesList: PokemonVariant[];
  rightCandidatesList: PokemonVariant[];
  fusionData: Fusion;
  onConfirm: (
    action: 'confirmFuse',
    leftInstanceId: string,
    rightInstanceId: string
  ) => void;
  onCancel: () => void;
  onCreateNewLeft: () => void;
  onCreateNewRight: () => void;
  error?: string;
};

const FusionPokemonSelection: React.FC<FusionPokemonSelectionProps> = ({
  leftCandidatesList,
  rightCandidatesList,
  fusionData,
  onConfirm,
  onCancel,
  onCreateNewLeft,
  onCreateNewRight,
  error,
}) => {
  const [selectedLeftInstance, setSelectedLeftInstance] = useState<string | null>(null);
  const [selectedRightInstance, setSelectedRightInstance] = useState<string | null>(null);

  const handleFuse = () => {
    if (!selectedLeftInstance || !selectedRightInstance) {
      alert('Please select one Pokémon from each side before fusing.');
      return;
    }

    onConfirm('confirmFuse', selectedLeftInstance, selectedRightInstance);
  };

  return (
    <div className="fusion-pokemon-selection-overlay">
      <div className="fusion-modal-content">
        <h2>{fusionData.name}</h2>

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
                const instanceId = c.instanceData?.instance_id ?? '';
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
                    <OwnedInstance pokemon={c} isEditable={false} />
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
                const instanceId = c.instanceData?.instance_id ?? '';
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
                    <OwnedInstance pokemon={c} isEditable={false} />
                  </div>
                );
              })
            )}
            <button className="create-new-button" onClick={onCreateNewRight}>
              Create New
            </button>
          </div>
        </div>

        {error && <p className="error">{error}</p>}
      </div>
      <CloseButton onClick={onCancel} />
    </div>
  );
};

export default FusionPokemonSelection;
