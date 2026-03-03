import React, { useEffect, useMemo, useState } from 'react';
import './MetaPanel.css';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';
import BallCaught from '@/components/pokemonComponents/BallCaught';
import type { PokemonInstance } from '@/types/pokemonInstance';
import {
  fetchPublicUserByUsername,
  fetchTrainerAutocomplete,
  type TrainerAutocompleteResult,
} from '@/services/userSearchService';

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

const MetaPanel: React.FC<MetaPanelProps> = ({
  pokemon,
  editMode,
  isLucky,
  isTraded,
  isShadow,
  originalTrainerName,
  originalTrainerId,
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
  const locationDisplay = (pokemon.instanceData?.location_caught ?? '').trim() || 'UNKNOWN LOCATION';
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

  const formatDisplayDate = (value: unknown): string => {
    if (!value) return 'UNKNOWN DATE';
    const asString = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;
    const parsed = new Date(asString);
    if (Number.isNaN(parsed.getTime())) return 'UNKNOWN DATE';
    return parsed.toISOString().slice(0, 10);
  };

  const dateDisplay = formatDisplayDate(rawDate);
  const tradedDateDisplay = formatDisplayDate(tradedDate ?? pokemon.instanceData?.traded_date ?? null);
  const originalTrainerDisplay =
    (originalTrainerName ?? '').trim() ||
    rawOriginalTrainerName ||
    rawOriginalTrainerId ||
    'UNKNOWN TRAINER';
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
    setTrainerQuery((originalTrainerName ?? rawOriginalTrainerName ?? '').trim());
  }, [originalTrainerName, rawOriginalTrainerName]);

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
    if (!username) {
      onOriginalTrainerIdChange(null);
      return;
    }

    setTrainerLookupBusy(true);
    const outcome = await fetchPublicUserByUsername(username);
    setTrainerLookupBusy(false);

    if (outcome.type === 'success') {
      onOriginalTrainerNameChange(outcome.username);
      onOriginalTrainerIdChange(outcome.userId);
      setTrainerQuery(outcome.username);
      setTrainerLookupError(null);
      return;
    }

    if (outcome.type === 'notFound') {
      onOriginalTrainerIdChange(null);
      setTrainerLookupError(null);
      return;
    }

    onOriginalTrainerIdChange(null);
    setTrainerLookupError(outcome.message);
  };

  return (
    <div className="meta-panel">
      <div className="meta-divider" aria-hidden="true" />

      <div className="meta-card">
        {obtainedInTrade && (
          <div className="meta-trade-banner">
            <div className="meta-trade-label">OBTAINED IN A TRADE</div>
            <div className="meta-trade-value">{originalTrainerDisplay}</div>
            <div className="meta-trade-date-label">{tradedDateDisplay}</div>
          </div>
        )}

        <div className="meta-summary">
          <div className="meta-summary-text">
            <div className="meta-caught-label">CAUGHT</div>
            <div className="meta-location-value">{locationDisplay}</div>
            <div className="meta-date-label">{dateDisplay}</div>
          </div>

          <div className="meta-ball-slot" aria-hidden="true">
            <div className="meta-ball-placeholder" />
          </div>
        </div>

        {editMode && (
          <div className="meta-edit-fields">
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
                        setTrainerHasFocus(false);
                        void resolveTrainerByUsername(trainerQuery);
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
                    value={tradedDate ?? ''}
                    onChange={(e) => onTradedDateChange(e.target.value)}
                    className="meta-edit-input"
                  />
                </div>
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

