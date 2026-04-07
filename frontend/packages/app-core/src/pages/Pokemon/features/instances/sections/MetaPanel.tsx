import React, { useEffect, useMemo, useRef, useState } from 'react';
import './MetaPanel.css';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';
import BallCaught from '@/components/pokemonComponents/BallCaught';
import { getBallImageClassName, getBallImageUrl } from '@/components/pokemonComponents/ballAssets';
import type { PokemonInstance } from '@/types/pokemonInstance';
import {
  fetchPublicUserByUsername,
  fetchTrainerAutocomplete,
  type TrainerAutocompleteResult,
} from '@/services/userSearchService';
import { normalizeEditableDateValue } from '../utils/normalizeEditableDateValue';

type PokemonWithInstance = {
  instanceData?: Partial<
    Pick<
      PokemonInstance,
      | 'location_caught'
      | 'date_caught'
      | 'is_traded'
      | 'lucky'
      | 'original_trainer_name'
      | 'original_trainer_id'
      | 'traded_date'
    >
  >;
};

interface MetaPanelProps {
  pokemon: PokemonWithInstance;
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

type MetaPanelContentInput = Pick<
  MetaPanelProps,
  'pokemon' | 'editMode' | 'isTraded' | 'originalTrainerName' | 'tradedDate' | 'pokeball' | 'allowTradeMetadata'
>;

export const hasMetaPanelContent = ({
  pokemon,
  editMode,
  isTraded,
  originalTrainerName,
  tradedDate,
  pokeball,
  allowTradeMetadata = true,
}: MetaPanelContentInput): boolean => {
  if (editMode) return true;

  const hasLocation = Boolean((pokemon.instanceData?.location_caught ?? '').trim());
  const hasCaughtDate = Boolean(normalizeEditableDateValue(pokemon.instanceData?.date_caught ?? null));
  const hasTradeTrainer = Boolean(
    (originalTrainerName ?? '').trim() ||
      (pokemon.instanceData?.original_trainer_name ?? '').trim() ||
      (pokemon.instanceData?.original_trainer_id ?? '').trim(),
  );
  const hasTradeDate = Boolean(
    normalizeEditableDateValue(tradedDate ?? pokemon.instanceData?.traded_date ?? null),
  );
  const hasBall = Boolean(pokeball);
  const hasTradeContent =
    allowTradeMetadata &&
    (hasTradeTrainer || (Boolean(isTraded) && hasTradeDate));

  return hasLocation || hasCaughtDate || hasTradeContent || hasBall;
};

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
  const rawLocation = (pokemon.instanceData?.location_caught ?? '').trim();
  const rawDate = pokemon.instanceData?.date_caught ?? null;
  const obtainedInTrade = Boolean(isTraded);
  const rawOriginalTrainerName = (pokemon.instanceData?.original_trainer_name ?? '').trim();
  const rawOriginalTrainerId = (pokemon.instanceData?.original_trainer_id ?? '').trim();
  const [trainerQuery, setTrainerQuery] = useState<string>(
    (originalTrainerName ?? rawOriginalTrainerName ?? '').trim(),
  );
  const [trainerSuggestions, setTrainerSuggestions] = useState<TrainerAutocompleteResult[]>([]);
  const [trainerLookupBusy, setTrainerLookupBusy] = useState<boolean>(false);
  const [trainerLookupError, setTrainerLookupError] = useState<string | null>(null);
  const [trainerHasFocus, setTrainerHasFocus] = useState<boolean>(false);
  const trainerLookupRequestRef = useRef(0);

  const dateDisplay = normalizeEditableDateValue(rawDate);
  const tradedDateDisplay = normalizeEditableDateValue(
    tradedDate ?? pokemon.instanceData?.traded_date ?? null,
  );
  const tradedDateInputValue = normalizeEditableDateValue(
    tradedDate ?? pokemon.instanceData?.traded_date ?? null,
  );
  const originalTrainerDisplay =
    (originalTrainerName ?? '').trim() ||
    rawOriginalTrainerName ||
    rawOriginalTrainerId;
  const hasCaughtSummary = Boolean(rawLocation || dateDisplay || pokeball);
  const hasTradeSummary = Boolean(
    allowTradeMetadata && obtainedInTrade && (originalTrainerDisplay || tradedDateDisplay),
  );
  const showEditFieldsDivider = hasCaughtSummary || hasTradeSummary;
  const showMetaCard = hasMetaPanelContent({
    pokemon,
    editMode,
    isTraded,
    originalTrainerName,
    tradedDate,
    pokeball,
    allowTradeMetadata,
  });
  const showTrainerSuggestions = useMemo(
    () =>
      editMode &&
      obtainedInTrade &&
      trainerHasFocus &&
      trainerSuggestions.length > 0 &&
      trainerQuery.trim().length >= 2,
    [editMode, obtainedInTrade, trainerHasFocus, trainerSuggestions.length, trainerQuery],
  );

  useEffect(() => {
    if (trainerHasFocus) return;
    setTrainerQuery((originalTrainerName ?? rawOriginalTrainerName ?? '').trim());
  }, [originalTrainerName, rawOriginalTrainerName, trainerHasFocus]);

  useEffect(() => {
    if (!editMode || !obtainedInTrade) {
      setTrainerSuggestions([]);
      setTrainerLookupError(null);
      return;
    }

    const term = trainerQuery.trim();
    if (term.length < 2) {
      setTrainerSuggestions([]);
      setTrainerLookupError(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setTrainerLookupBusy(true);
      const outcome = await fetchTrainerAutocomplete(term);
      if (cancelled) return;

      if (outcome.type === 'success') {
        setTrainerSuggestions(outcome.results);
        setTrainerLookupError(null);
      } else {
        setTrainerSuggestions([]);
        setTrainerLookupError(outcome.message);
      }
      setTrainerLookupBusy(false);
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [editMode, obtainedInTrade, trainerQuery]);

  const resolveTrainerByUsername = async (usernameInput: string): Promise<void> => {
    const username = usernameInput.trim();
    const requestId = ++trainerLookupRequestRef.current;
    if (!username) {
      onOriginalTrainerNameChange('');
      setTrainerQuery('');
      onOriginalTrainerIdChange(null);
      setTrainerLookupError(null);
      return;
    }

    setTrainerLookupBusy(true);
    let outcome;
    try {
      outcome = await fetchPublicUserByUsername(username);
    } catch {
      if (requestId !== trainerLookupRequestRef.current) return;
      setTrainerLookupBusy(false);
      onOriginalTrainerIdChange(null);
      setTrainerLookupError('Unable to verify trainer right now.');
      return;
    }
    if (requestId !== trainerLookupRequestRef.current) return;
    setTrainerLookupBusy(false);

    if (outcome.type === 'success') {
      onOriginalTrainerIdChange(outcome.userId);
      setTrainerLookupError(null);
      return;
    }

    if (outcome.type === 'notFound') {
      // Keep manually entered trainer names even if they are not in our user database.
      onOriginalTrainerIdChange(null);
      setTrainerLookupError(null);
      return;
    }

    // On lookup errors, preserve entered name and allow save without linked user_id.
    onOriginalTrainerIdChange(null);
    setTrainerLookupError(outcome.message);
  };

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
                          onChange={(e) => {
                            const next = e.target.value;
                            setTrainerQuery(next);
                            onOriginalTrainerNameChange(next);
                            onOriginalTrainerIdChange(null);
                          }}
                          onFocus={() => setTrainerHasFocus(true)}
                          onBlur={() => {
                            const committedName = trainerQuery.trim();
                            setTrainerHasFocus(false);
                            setTrainerQuery(committedName);
                            onOriginalTrainerNameChange(committedName);
                            onOriginalTrainerIdChange(null);
                            void resolveTrainerByUsername(committedName);
                            window.setTimeout(() => setTrainerSuggestions([]), 120);
                          }}
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
                                  onOriginalTrainerNameChange(candidate.username);
                                  setTrainerQuery(candidate.username);
                                  setTrainerSuggestions([]);
                                  setTrainerHasFocus(false);
                                  void resolveTrainerByUsername(candidate.username);
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

