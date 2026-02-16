import React from 'react';
import './HeaderRow.css';
import EditSaveComponent from '@/components/EditSaveComponent';
import CP from '@/components/pokemonComponents/CP';
import FavoriteComponent from '@/components/pokemonComponents/Favorite';

interface HeaderRowProps {
  editMode: boolean;
  toggleEditMode: () => void | Promise<void>;
  isEditable: boolean;
  cp: string | number;
  onCPChange: (value: string) => void;
  onFavoriteChange: (value: boolean) => void;
}

const HeaderRow: React.FC<HeaderRowProps> = ({
  editMode,
  toggleEditMode,
  isEditable,
  cp,
  onCPChange,
  onFavoriteChange,
}) => (
  <div className="top-row">
    <EditSaveComponent
      editMode={editMode}
      toggleEditMode={toggleEditMode}
      isEditable={isEditable}
    />

    <div className="cp-component-container">
      <CP editMode={editMode} onCPChange={onCPChange} cp={cp} />
    </div>

    <FavoriteComponent
      pokemon={{} as never}
      editMode={editMode}
      onFavoriteChange={onFavoriteChange}
    />
  </div>
);

export default HeaderRow;
