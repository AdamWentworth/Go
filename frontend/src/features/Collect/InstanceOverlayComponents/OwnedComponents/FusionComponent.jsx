// OwnedComponents/FusionComponent.jsx
import React from 'react';
import './FusionComponent.css'; // Optional: create and style this as needed

const FusionComponent = ({ fusion, editMode, pokemon, onFusionToggle, fusionState }) => {
    // If there are no fusions, render nothing
    if (!fusion || fusion.length === 0) {
      return null;
    }
  
    const imageClass = fusion.length === 1 ? 'single' : 'multiple';
  
    return (
      <div className="fusion-component">
        <h3>Fusions</h3>
        <div className={`fusion-images ${imageClass}`}>
          {fusion.map((fusionItem) => (
            <img 
              key={fusionItem.fusion_id}
              src={`${process.env.PUBLIC_URL}/images/fusion_${fusionItem.fusion_id}.png`} 
              alt={fusionItem.name || `Fusion ${fusionItem.fusion_id}`}
              onClick={() => onFusionToggle(fusionItem.fusion_id)}
              className={fusionState.is_fused && fusionState.fusion_form === fusionItem.fusion_id ? 'active-fusion' : ''}
            />
          ))}
        </div>
      </div>
    );
  };
  

export default FusionComponent;

