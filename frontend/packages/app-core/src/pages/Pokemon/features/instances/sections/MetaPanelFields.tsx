import React from 'react';

import BallCaught from '@/components/pokemonComponents/BallCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import { getBallImageClassName, getBallImageUrl } from '@/components/pokemonComponents/ballAssets';
import type { TrainerAutocompleteResult } from '@/services/userSearchService';

import type { PokemonWithMetaInstance } from '../utils/metaPanelState';

type MetaTradeSummaryProps = {
  originalTrainerDisplay: string | null;
  tradedDateDisplay: string | null;
};

export const MetaTradeSummary: React.FC<MetaTradeSummaryProps> = ({
  originalTrainerDisplay,
  tradedDateDisplay,
}) => (
  <div className="meta-trade-banner">
    <div className="meta-trade-label">OBTAINED IN A TRADE</div>
    {originalTrainerDisplay ? <div className="meta-trade-value">{originalTrainerDisplay}</div> : null}
    {tradedDateDisplay ? (
      <div className="meta-trade-date-label">{tradedDateDisplay}</div>
    ) : null}
  </div>
);

type MetaCaughtSummaryProps = {
  rawLocation: string;
  dateDisplay: string | null;
  pokeball: string | null;
};

export const MetaCaughtSummary: React.FC<MetaCaughtSummaryProps> = ({
  rawLocation,
  dateDisplay,
  pokeball,
}) => (
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
);

type TrainerLookupInputProps = {
  trainerQuery: string;
  trainerSuggestions: TrainerAutocompleteResult[];
  trainerLookupBusy: boolean;
  trainerLookupError: string | null;
  showTrainerSuggestions: boolean;
  onTrainerNameChange: (value: string) => void;
  onTrainerNameFocus: () => void;
  onTrainerNameBlur: () => void;
  onTrainerSuggestionSelect: (candidate: TrainerAutocompleteResult) => void;
};

export const TrainerLookupInput: React.FC<TrainerLookupInputProps> = ({
  trainerQuery,
  trainerSuggestions,
  trainerLookupBusy,
  trainerLookupError,
  showTrainerSuggestions,
  onTrainerNameChange,
  onTrainerNameFocus,
  onTrainerNameBlur,
  onTrainerSuggestionSelect,
}) => (
  <div className="meta-trainer-edit-field">
    <label htmlFor="meta-original-trainer-name">Original Trainer Name:</label>
    <div className="meta-trainer-name-input-wrap">
      <input
        id="meta-original-trainer-name"
        type="text"
        value={trainerQuery}
        onChange={(e) => onTrainerNameChange(e.target.value)}
        onFocus={onTrainerNameFocus}
        onBlur={onTrainerNameBlur}
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
                onTrainerSuggestionSelect(candidate);
              }}
            >
              {candidate.username}
            </button>
          ))}
        </div>
      )}
    </div>

    {trainerLookupBusy && <div className="meta-trainer-lookup-status">Looking up trainer...</div>}
    {!trainerLookupBusy && trainerLookupError && (
      <div className="meta-trainer-lookup-error">{trainerLookupError}</div>
    )}
  </div>
);

type TradeMetadataFieldsProps = TrainerLookupInputProps & {
  obtainedInTrade: boolean;
  isShadow: boolean;
  isLucky: boolean;
  tradedDateInputValue: string | null;
  onIsTradedChange: (value: boolean) => void;
  onTradedDateChange: (value: string) => void;
};

export const TradeMetadataFields: React.FC<TradeMetadataFieldsProps> = ({
  obtainedInTrade,
  isShadow,
  isLucky,
  tradedDateInputValue,
  onIsTradedChange,
  onTradedDateChange,
  ...trainerLookupProps
}) => (
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
        <div className="meta-trainer-lookup-status">Lucky Pokemon are always traded.</div>
      )}
    </div>

    {obtainedInTrade && (
      <>
        <TrainerLookupInput {...trainerLookupProps} />

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
);

type CaughtMetadataFieldsProps = {
  pokemon: PokemonWithMetaInstance;
  editMode: boolean;
  pokeball: string | null;
  onLocationChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onPokeballChange: (value: string | null) => void;
};

export const CaughtMetadataFields: React.FC<CaughtMetadataFieldsProps> = ({
  pokemon,
  editMode,
  pokeball,
  onLocationChange,
  onDateChange,
  onPokeballChange,
}) => (
  <>
    <div className="location-caught-component">
      <LocationCaught pokemon={pokemon} editMode={editMode} onLocationChange={onLocationChange} />
    </div>

    <div className="date-caught-component">
      <DateCaughtComponent pokemon={pokemon} editMode={editMode} onDateChange={onDateChange} />
    </div>

    <div className="ball-caught-component">
      <BallCaught value={pokeball} editMode={editMode} onChange={onPokeballChange} />
    </div>
  </>
);
