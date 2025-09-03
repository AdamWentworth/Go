// sections/HeaderRow.jsx
import React from 'react';
import './HeaderRow.css';
import EditSaveComponent from '@/components/EditSaveComponent';
import CP from '@/components/pokemonComponents/CP';
import FavoriteComponent from '@/components/pokemonComponents/Favorite';

const HeaderRow = ({
  editMode,
  toggleEditMode,
  isEditable,
  pokemon,
  cp,
  onCPChange,
  errors,
  onFavoriteChange,
}) => (
  <div className="top-row">
    <EditSaveComponent
      editMode={editMode}
      toggleEditMode={toggleEditMode}
      isEditable={isEditable}
    />

    <div className="cp-component-container">
      <CP
        pokemon={pokemon}
        editMode={editMode}
        onCPChange={onCPChange}
        cp={cp}
        errors={errors}
      />
    </div>

    <FavoriteComponent
      pokemon={pokemon}
      editMode={editMode}
      onFavoriteChange={onFavoriteChange}
    />
  </div>
);

export default HeaderRow;
