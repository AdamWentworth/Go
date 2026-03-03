import React from 'react';
import EditSaveComponent from '@/components/EditSaveComponent';
import type { PokemonInstance } from '@/types/pokemonInstance';

import MirrorManager from './MirrorManager';

interface TradeTopRowProps {
  isMirror: boolean;
  isEditable: boolean;
  editMode: boolean;
  shouldShowFewLayout: boolean;
  toggleEditMode: () => void;
  onResetFilters: () => void;
  pokemon: React.ComponentProps<typeof MirrorManager>['pokemon'];
  instancesMap: Record<string, PokemonInstance>;
  lists: React.ComponentProps<typeof MirrorManager>['lists'];
  setIsMirror: React.ComponentProps<typeof MirrorManager>['setIsMirror'];
  setMirrorKey: React.ComponentProps<typeof MirrorManager>['setMirrorKey'];
  updateMirrorDisplayedList: React.ComponentProps<typeof MirrorManager>['updateDisplayedList'];
  updateDetails: React.ComponentProps<typeof MirrorManager>['updateDetails'];
}

const TradeTopRow: React.FC<TradeTopRowProps> = ({
  isMirror,
  isEditable,
  editMode,
  shouldShowFewLayout,
  toggleEditMode,
  onResetFilters,
  pokemon,
  instancesMap,
  lists,
  setIsMirror,
  setMirrorKey,
  updateMirrorDisplayedList,
  updateDetails,
}) => (
  <div className={`top-row ${isMirror ? 'few-wanted' : ''}`}>
    {isEditable && (
      <div className="edit-save-container">
        <EditSaveComponent
          editMode={editMode}
          toggleEditMode={toggleEditMode}
          isEditable={isEditable}
        />
        {!isMirror && (
          <div className={`reset-container ${editMode ? 'editable' : ''}`}>
            <img
              src={'/images/reset.png'}
              alt="Reset Filters"
              style={{
                cursor: editMode ? 'pointer' : 'default',
                width: '25px',
                height: 'auto',
              }}
              onClick={editMode ? onResetFilters : undefined}
            />
          </div>
        )}
      </div>
    )}
    {!isMirror ? (
      !shouldShowFewLayout ? (
        <>
          <div className="header-group">
            <h3>Exclude</h3>
          </div>
          <div className="header-group">
            <h3>Include</h3>
          </div>
        </>
      ) : (
        <div className="header-group include-few">
          <h3>Exclude</h3>
        </div>
      )
    ) : (
      <div className="spacer"></div>
    )}
    <div className="mirror">
      <MirrorManager
        pokemon={pokemon}
        instances={instancesMap}
        lists={lists}
        isMirror={isMirror}
        setIsMirror={setIsMirror}
        setMirrorKey={setMirrorKey}
        editMode={isEditable}
        updateDisplayedList={updateMirrorDisplayedList}
        updateDetails={updateDetails}
      />
    </div>
  </div>
);

export default TradeTopRow;
