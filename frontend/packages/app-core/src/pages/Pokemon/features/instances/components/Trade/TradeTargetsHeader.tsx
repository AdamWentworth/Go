import React from 'react';
import EditSaveComponent from '@/components/EditSaveComponent';
import type { PokemonInstance } from '@/types/pokemonInstance';

import MirrorManager from './MirrorManager';

interface TradeTargetsHeaderProps {
  isMirror: boolean;
  isEditable: boolean;
  editMode: boolean;
  shouldShowFewLayout: boolean;
  filtersSlot?: React.ReactNode;
  toggleEditMode: () => void;
  pokemon: React.ComponentProps<typeof MirrorManager>['pokemon'];
  instancesMap: Record<string, PokemonInstance>;
  lists: React.ComponentProps<typeof MirrorManager>['lists'];
  setIsMirror: React.ComponentProps<typeof MirrorManager>['setIsMirror'];
  setMirrorKey: React.ComponentProps<typeof MirrorManager>['setMirrorKey'];
  updateMirrorDisplayedList: React.ComponentProps<typeof MirrorManager>['updateDisplayedList'];
  updateDetails: React.ComponentProps<typeof MirrorManager>['updateDetails'];
}

const TradeTargetsHeader: React.FC<TradeTargetsHeaderProps> = ({
  isMirror,
  isEditable,
  editMode,
  filtersSlot,
  toggleEditMode,
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
      <div className="trade-target-actions">
        <div className="edit-save-container">
          <EditSaveComponent
            editMode={editMode}
            toggleEditMode={toggleEditMode}
            isEditable={isEditable}
          />
        </div>
      </div>
    )}
    <div className="trade-target-filters-inline">{filtersSlot}</div>
    <div className="mirror">
      <MirrorManager
        pokemon={pokemon}
        instances={instancesMap}
        lists={lists}
        isMirror={isMirror}
        setIsMirror={setIsMirror}
        setMirrorKey={setMirrorKey}
        editMode={editMode}
        updateDisplayedList={updateMirrorDisplayedList}
        updateDetails={updateDetails}
      />
    </div>
  </div>
);

export default TradeTargetsHeader;
