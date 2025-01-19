// OwnedComponents/FusionComponent.jsx
import React from 'react';
import './FusionComponent.css'; // Optional: create and style this as needed

const FusionComponent = ({ fusion, editMode, pokemon }) => {
  // If not in edit mode or if there are no fusions, render nothing
  if (!editMode || !fusion || fusion.length === 0) {
    return null;
  }

  // Determine CSS class based on how many fusion items exist
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
          />
        ))}
      </div>
    </div>
  );
};

export default FusionComponent;
