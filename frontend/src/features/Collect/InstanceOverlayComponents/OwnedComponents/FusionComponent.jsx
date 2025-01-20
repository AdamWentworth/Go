// OwnedComponents/FusionComponent.jsx
import React from 'react';
import './FusionComponent.css'; // Optional: create and style this as needed

const FusionComponent = ({ fusion, editMode, pokemon, onFusionToggle, onUndoFusion, fusionState }) => {
  // If not in edit mode or no fusions, render nothing
  if (!editMode || !fusion || fusion.length === 0) {
    return null;
  }

  // Filter fusions where base_pokemon_id1 matches the current pokemon's ID
  const validFusions = fusion.filter(item => item.base_pokemon_id1 === pokemon.pokemon_id);

  // If no valid fusions found, do not render the component
  if (validFusions.length === 0) {
    return null;
  }

  const imageClass = validFusions.length === 1 ? 'single' : 'multiple';

  return (
    <div className="fusion-component">

      {fusionState.is_fused ? (
        // Display "Undo Fusion" button exclusively when a fusion is active
        <button onClick={onUndoFusion} className="undo-fusion-button">
          Separate
        </button>
      ) : (
        // Otherwise, display fusion images
        <div className={`fusion-images ${imageClass}`}>
          {validFusions.map((fusionItem) => (
            <img 
              key={fusionItem.fusion_id}
              src={`${process.env.PUBLIC_URL}/images/fusion_${fusionItem.fusion_id}.png`} 
              alt={fusionItem.name || `Fusion ${fusionItem.fusion_id}`}
              onClick={() => onFusionToggle(fusionItem.fusion_id)}
              className={
                fusionState.is_fused && fusionState.fusion_form === fusionItem.fusion_id 
                ? 'active-fusion' 
                : ''
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FusionComponent;