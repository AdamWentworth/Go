// PurifyComponent.tsx

import React from 'react';
import './PurifyComponent.css';

interface PurifyComponentProps {
  isShadow: boolean;
  isPurified: boolean;
  editMode: boolean;
  onTogglePurify: (newState: boolean) => void;
}

const PurifyComponent: React.FC<PurifyComponentProps> = ({
  isShadow,
  isPurified,
  editMode,
  onTogglePurify,
}) => {
  if (!editMode || (!isShadow && !isPurified)) {
    return null;
  }

  const handlePurifyClick = () => {
    onTogglePurify(!isPurified);
  };

  const imageSrc = isPurified
    ? '/images/shadow_icon_middle_ground.png'
    : '/images/purify.png';

  const altText = isPurified ? 'Purified' : 'Purify';

  return (
    <div className="purify-component" onClick={handlePurifyClick}>
      <img src={imageSrc} alt={altText} className="purify-icon" />
    </div>
  );
};

export default PurifyComponent;
