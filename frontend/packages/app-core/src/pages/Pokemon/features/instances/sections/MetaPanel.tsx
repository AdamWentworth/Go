import React from 'react';
import './MetaPanel.css';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';
import BallCaught from '@/components/pokemonComponents/BallCaught';
import { getBallImageClassName, getBallImageUrl } from '@/components/pokemonComponents/ballAssets';
import {
  hasMetaPanelContent,
  resolveMetaPanelState,
  type PokemonWithMetaInstance,
} from '../utils/metaPanelState';
import { useTrainerLookupField } from '../hooks/useTrainerLookupField';

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
          <div className="meta-trade-banner">
            <div className="meta-trade-label">OBTAINED IN A TRADE</div>
            {originalTrainerDisplay ? (
              <div className="meta-trade-value">{originalTrainerDisplay}</div>
            ) : null}
            {tradedDateDisplay ? (
              <div className="meta-trade-date-label">{tradedDateDisplay}</div>
            ) : null}
          </div>
        )}

        {hasCaughtSummary ? (
          <div className="meta-summary">
            <div className="meta-summary-text">
              <div className="meta-caught-label">CAUGHT</div>
              {rawLocation ? <div className="meta-location-value">{rawLocation}</div> : null}
              {dateDisplay ? <div className="meta-date-label">{dateDisplay}</div> : null}
            </div>

            {pokeball ? (
              <div className="meta-ball-slot" aria-hidden="true">
                <img
                  className={`meta-ball-image ${getBallImageClassName(pokeball)}`}
                  src={getBallImageUrl(pokeball)}
                  alt=""
                />
              </div>
            ) : null}
          </div>
        ) : null}

        {editMode && (
          <div
            className={`meta-edit-fields ${showEditFieldsDivider ? 'meta-edit-fields--with-divider' : 'meta-edit-fields--no-divider'}`}
          >
            {allowTradeMetadata && (
              <>
                <div className="meta-trainer-edit-field">
                  <label>Traded:</label>
                  <div className="meta-toggle-group" role="group" aria-label="Traded status">
                    <button
                      type="button"
                      className={`meta-toggle-button ${obtainedInTrade ? 'active' : ''}`}
                      aria-pressed={obtainedInTrade}
                      onClick={() => onIsTradedChange(true)}
                      disabled={isShadow}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`meta-toggle-button ${!obtainedInTrade ? 'active' : ''}`}
                      aria-pressed={!obtainedInTrade}
                      onClick={() => onIsTradedChange(false)}
                      disabled={isLucky}
                    >
                      No
                    </button>
                  </div>
                  {isShadow && (
                    <div className="meta-trainer-lookup-status">
                      Shadow Pokemon cannot be traded until purified.
                    </div>
                  )}
                  {isLucky && (
                    <div className="meta-trainer-lookup-status">
                      Lucky Pokemon are always traded.
                    </div>
                  )}
                </div>

                {obtainedInTrade && (
                  <>
                    <div className="meta-trainer-edit-field">
                      <label htmlFor="meta-original-trainer-name">Original Trainer Name:</label>
                      <div className="meta-trainer-name-input-wrap">
                        <input
                          id="meta-original-trainer-name"
                          type="text"
                          value={trainerQuery}
                          onChange={(e) => handleTrainerNameChange(e.target.value)}
                          onFocus={handleTrainerNameFocus}
                          onBlur={handleTrainerNameBlur}
                          placeholder="Optional"
                          className="meta-edit-input"
                          autoComplete="off"
                        />

                        {showTrainerSuggestions && (
                          <div className="meta-trainer-suggestions">
                            {trainerSuggestions.map((candidate, index) => (
                              <button
                                key={`${candidate.username}-${index}`}
                                type="button"
                                className="meta-trainer-suggestion-item"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  handleTrainerSuggestionSelect(candidate);
                                }}
                              >
                                {candidate.username}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {trainerLookupBusy && (
                        <div className="meta-trainer-lookup-status">Looking up trainer...</div>
                      )}
                      {!trainerLookupBusy && trainerLookupError && (
                        <div className="meta-trainer-lookup-error">{trainerLookupError}</div>
                      )}
                    </div>

                    <div className="meta-trainer-edit-field">
                      <label htmlFor="meta-traded-date">Traded Date:</label>
                      <input
                        id="meta-traded-date"
                        type="date"
                        value={tradedDateInputValue ?? ''}
                        onChange={(e) => onTradedDateChange(e.target.value)}
                        className="meta-edit-input"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="location-caught-component">
              <LocationCaught
                pokemon={pokemon}
                editMode={editMode}
                onLocationChange={onLocationChange}
              />
            </div>

            <div className="date-caught-component">
              <DateCaughtComponent
                pokemon={pokemon}
                editMode={editMode}
                onDateChange={onDateChange}
              />
            </div>

            <div className="ball-caught-component">
              <BallCaught value={pokeball} editMode={editMode} onChange={onPokeballChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaPanel;
