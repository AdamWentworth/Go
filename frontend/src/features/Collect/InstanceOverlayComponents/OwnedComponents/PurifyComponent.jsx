// PurifyComponent.jsx

import React from 'react';
import './PurifyComponent.css';

const PurifyComponent = ({ isShadow, isPurified, editMode, onTogglePurify }) => {
  // If not in edit mode, don't render anything
  if (!editMode) return null;

  const handlePurifyClick = () => {
    onTogglePurify(!isPurified);
  };

  const imageSrc = isPurified
    ? process.env.PUBLIC_URL + '/images/shadow_icon_middle_ground.png'
    : process.env.PUBLIC_URL + '/images/purify.png';

  const altText = isPurified ? 'Purified' : 'Purify';

  return (
    <div className="purify-component" onClick={handlePurifyClick}>
      {(isShadow || isPurified) && (
        <img src={imageSrc} alt={altText} className="purify-icon" />
      )}
    </div>
  );
};

export default PurifyComponent;
