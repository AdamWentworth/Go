// sections/IdentityRow.jsx
import React from 'react';
import './IdentityRow.css';
import LuckyComponent from '../components/Caught/LuckyComponent';
import NameComponent from '../components/Caught/NameComponent';
import PurifyComponent from '../components/Caught/PurifyComponent';

const IdentityRow = ({
  pokemon,
  isLucky,
  isShadow,
  isPurified,
  editMode,
  onToggleLucky,
  onNicknameChange,
  onTogglePurify,
}) => (
  <div className="purify-name-shadow-container">
    <div className="lucky-component">
      <LuckyComponent
        pokemon={pokemon}
        onToggleLucky={onToggleLucky}
        isLucky={isLucky}
        editMode={editMode}
        isShadow={isShadow}
      />
    </div>

    <div className="name-container">
      <NameComponent
        pokemon={pokemon}
        editMode={editMode}
        onNicknameChange={onNicknameChange}
      />
    </div>

    <div className="purify-component">
      <PurifyComponent
        isShadow={isShadow}
        isPurified={isPurified}
        editMode={editMode}
        onTogglePurify={onTogglePurify}
      />
    </div>
  </div>
);

export default IdentityRow;
