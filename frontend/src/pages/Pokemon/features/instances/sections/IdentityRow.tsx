import React from 'react';
import './IdentityRow.css';
import LuckyComponent from '../components/Caught/LuckyComponent';
import NameComponent from '../components/Caught/NameComponent';
import PurifyComponent from '../components/Caught/PurifyComponent';

interface IdentityRowProps {
  pokemon: Record<string, unknown>;
  isLucky: boolean;
  isShadow: boolean;
  isPurified: boolean;
  editMode: boolean;
  onToggleLucky: (value: boolean) => void;
  onNicknameChange: (value: string | null) => void;
  onTogglePurify: (value: boolean) => void;
}

const IdentityRow: React.FC<IdentityRowProps> = ({
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
        pokemon={pokemon as never}
        onToggleLucky={onToggleLucky}
        isLucky={isLucky}
        editMode={editMode}
        isShadow={isShadow}
      />
    </div>

    <div className="name-container">
      <NameComponent
        pokemon={pokemon as never}
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
