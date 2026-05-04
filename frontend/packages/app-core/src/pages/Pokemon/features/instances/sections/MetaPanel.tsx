import React from 'react';
import './MetaPanel.css';
import {
  hasMetaPanelContent,
  resolveMetaPanelState,
  type PokemonWithMetaInstance,
} from '../utils/metaPanelState';
import { useTrainerLookupField } from '../hooks/useTrainerLookupField';
import {
  CaughtMetadataFields,
  MetaCaughtSummary,
  MetaTradeSummary,
  TradeMetadataFields,
} from './MetaPanelFields';

interface MetaPanelProps {
  pokemon: PokemonWithMetaInstance;
  showDivider?: boolean;
  allowTradeMetadata?: boolean;
  editMode: boolean;
  isLucky: boolean;
  isTraded: boolean;
  isShadow: boolean;
  originalTrainerName: string | null;
  originalTrainerId: string | null;
  tradedDate: string | null;
  pokeball: string | null;
  onLocationChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onIsTradedChange: (value: boolean) => void;
  onOriginalTrainerNameChange: (value: string) => void;
  onOriginalTrainerIdChange: (value: string | null) => void;
  onTradedDateChange: (value: string) => void;
  onPokeballChange: (value: string | null) => void;
}

export { hasMetaPanelContent };

const MetaPanel: React.FC<MetaPanelProps> = ({
  pokemon,
  showDivider = true,
  allowTradeMetadata = true,
  editMode,
  isLucky,
  isTraded,
  isShadow,
  originalTrainerName,
  originalTrainerId: _originalTrainerId,
  tradedDate,
  pokeball,
  onLocationChange,
  onDateChange,
  onIsTradedChange,
  onOriginalTrainerNameChange,
  onOriginalTrainerIdChange,
  onTradedDateChange,
  onPokeballChange,
}) => {
  const {
    rawLocation,
    rawOriginalTrainerName,
    obtainedInTrade,
    dateDisplay,
    tradedDateDisplay,
    tradedDateInputValue,
    originalTrainerDisplay,
    hasCaughtSummary,
    hasTradeSummary,
    showEditFieldsDivider,
    showMetaCard,
  } = resolveMetaPanelState({
    pokemon,
    editMode,
    isTraded,
    originalTrainerName,
    tradedDate,
    pokeball,
    allowTradeMetadata,
  });
  const {
    trainerQuery,
    trainerSuggestions,
    trainerLookupBusy,
    trainerLookupError,
    showTrainerSuggestions,
    handleTrainerNameChange,
    handleTrainerNameFocus,
    handleTrainerNameBlur,
    handleTrainerSuggestionSelect,
  } = useTrainerLookupField({
    editMode,
    obtainedInTrade,
    originalTrainerName,
    rawOriginalTrainerName,
    onOriginalTrainerNameChange,
    onOriginalTrainerIdChange,
  });

  if (!showMetaCard) {
    return null;
  }

  return (
    <div className="meta-panel">
      {showDivider ? <div className="meta-divider" aria-hidden="true" /> : null}

      <div className="meta-card">
        {hasTradeSummary && (
          <MetaTradeSummary
            originalTrainerDisplay={originalTrainerDisplay}
            tradedDateDisplay={tradedDateDisplay}
          />
        )}

        {hasCaughtSummary ? (
          <MetaCaughtSummary
            rawLocation={rawLocation}
            dateDisplay={dateDisplay}
            pokeball={pokeball}
          />
        ) : null}

        {editMode && (
          <div
            className={`meta-edit-fields ${showEditFieldsDivider ? 'meta-edit-fields--with-divider' : 'meta-edit-fields--no-divider'}`}
          >
            {allowTradeMetadata && (
              <TradeMetadataFields
                obtainedInTrade={obtainedInTrade}
                isShadow={isShadow}
                isLucky={isLucky}
                trainerQuery={trainerQuery}
                trainerSuggestions={trainerSuggestions}
                trainerLookupBusy={trainerLookupBusy}
                trainerLookupError={trainerLookupError}
                showTrainerSuggestions={showTrainerSuggestions}
                tradedDateInputValue={tradedDateInputValue}
                onIsTradedChange={onIsTradedChange}
                onTradedDateChange={onTradedDateChange}
                onTrainerNameChange={handleTrainerNameChange}
                onTrainerNameFocus={handleTrainerNameFocus}
                onTrainerNameBlur={handleTrainerNameBlur}
                onTrainerSuggestionSelect={handleTrainerSuggestionSelect}
              />
            )}

            <CaughtMetadataFields
              pokemon={pokemon}
              editMode={editMode}
              pokeball={pokeball}
              onLocationChange={onLocationChange}
              onDateChange={onDateChange}
              onPokeballChange={onPokeballChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaPanel;
