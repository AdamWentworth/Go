// PurifyComponent.jsx

import React from 'react';
import './PurifyComponent.css';

const PurifyComponent = ({ isShadow, isPurified, editMode, onTogglePurify }) => {
  // Move the rendering logic inside the component
  if (!editMode || (!isShadow && !isPurified)) {
    return null; // Do not render if not in edit mode or if neither isShadow nor isPurified
  }

  const handlePurifyClick = () => {
    onTogglePurify(!isPurified);
  };

  const imageSrc = isPurified
    ? process.env.PUBLIC_URL + '/images/shadow_icon_middle_ground.png'
    : process.env.PUBLIC_URL + '/images/purify.png';

  const altText = isPurified ? 'Purified' : 'Purify';

  return (
    <div className="purify-component" onClick={handlePurifyClick}>
      <img src={imageSrc} alt={altText} className="purify-icon" />
    </div>
  );
};

export default PurifyComponent;
