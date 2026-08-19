import React, { useEffect, useMemo } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';

import { formatCostumeName } from '../utils/formatCostumeName';
import { formatForm } from '@/utils/formattingHelpers';
import type { SelectedMoves } from '../utils/buildPokemonSearchQuery';
import type { UseVariantSearchControllerResult } from './useVariantSearchController';
import VariantSearchBackgroundOverlay from './VariantSearchBackgroundOverlay';

import './AppearanceFilters.css';

type GenderFilter = 'Any' | 'Male' | 'Female' | 'Genderless';

type AppearanceFiltersProps = {
  controller: UseVariantSearchControllerResult;
  costume: string | null;
  dynamax: boolean;
  gigantamax: boolean;
  isShadow: boolean;
  isShiny: boolean;
  pokemon: string;
  selectedForm: string;
  selectedGender: string | null;
  selectedMoves: SelectedMoves;
};

const getGenderOptions = (genderRate?: string): GenderFilter[] => {
  if (!genderRate) return [];
  const [maleRate, femaleRate, genderlessRate] = genderRate
    .split('_')
    .map((value) => Number.parseInt(value, 10) || 0);

  if (genderlessRate === 100) return ['Genderless'];
  if (maleRate > 0 && femaleRate > 0) return ['Any', 'Male', 'Female'];
  if (maleRate > 0) return ['Male'];
  if (femaleRate > 0) return ['Female'];
  return [];
};

const toMoveId = (value: string): number | null =>
  value ? Number.parseInt(value, 10) : null;

const AppearanceFilters: React.FC<AppearanceFiltersProps> = ({
  controller,
  costume,
  dynamax,
  gigantamax,
  isShadow,
  isShiny,
  pokemon,
  selectedForm,
  selectedGender,
  selectedMoves,
}) => {
  const genderOptions = useMemo(
    () => getGenderOptions(controller.currentPokemonData?.gender_rate),
    [controller.currentPokemonData?.gender_rate],
  );
  const moves = controller.currentPokemonData?.moves ?? [];
  const fastMoves = moves.filter((move) => Boolean(move.is_fast));
  const chargedMoves = moves.filter((move) => !move.is_fast);

  useEffect(() => {
    if (genderOptions.length === 0) return;
    if (selectedGender && genderOptions.includes(selectedGender as GenderFilter)) {
      return;
    }
    controller.handleGenderChange(
      genderOptions.includes('Any') ? 'Any' : genderOptions[0],
    );
  }, [controller, genderOptions, selectedGender]);

  const updateMove = (key: keyof SelectedMoves, value: string) => {
    controller.handleMovesChange({
      ...selectedMoves,
      [key]: toMoveId(value),
    });
  };

  const maxMode = gigantamax ? 'gigantamax' : dynamax ? 'dynamax' : 'standard';

  return (
    <div className="search-filter-panel appearance-filters">
      <header className="search-filter-panel__intro appearance-filters__intro">
        <div>
          <span>Pokémon details</span>
          <h3>Choose the exact variant</h3>
          <p>Every field is optional. Add only the details that matter.</p>
        </div>
        <div
          className={`appearance-preview ${controller.selectedBackground ? 'has-background' : ''}`}
          style={
            controller.selectedBackground
              ? {
                  backgroundImage: `url(${controller.selectedBackground.image_url})`,
                }
              : undefined
          }
        >
          {controller.imageUrl && !controller.imageError ? (
            <img
              alt={pokemon || 'Selected Pokémon'}
              onError={controller.handleImageError}
              src={controller.imageUrl}
            />
          ) : (
            <span>{pokemon ? 'No image' : 'Select a Pokémon'}</span>
          )}
          {dynamax ? (
            <img
              alt="Dynamax"
              className="appearance-preview__badge"
              src="/images/dynamax.png"
            />
          ) : null}
          {gigantamax ? (
            <img
              alt="Gigantamax"
              className="appearance-preview__badge"
              src="/images/gigantamax.png"
            />
          ) : null}
        </div>
      </header>

      <section className="search-filter-card">
        <div className="search-filter-card__heading">
          <div>
            <h4>Variant</h4>
            <p>Shiny, Shadow, costume, form, and Max form.</p>
          </div>
        </div>

        <div className="appearance-choice-grid">
          <button
            aria-pressed={isShiny}
            className="appearance-choice"
            onClick={controller.handleShinyChange}
            type="button"
          >
            <img alt="" src="/images/shiny_icon.png" />
            <span><strong>Shiny</strong><small>{isShiny ? 'Required' : 'Any'}</small></span>
          </button>
          <button
            aria-pressed={isShadow}
            className="appearance-choice"
            onClick={controller.handleShadowChange}
            type="button"
          >
            <img alt="" src="/images/shadow_icon.png" />
            <span><strong>Shadow</strong><small>{isShadow ? 'Required' : 'Any'}</small></span>
          </button>
          <button
            aria-pressed={controller.showCostumeDropdown}
            className="appearance-choice"
            disabled={controller.availableCostumes.length === 0}
            onClick={controller.handleCostumeToggle}
            type="button"
          >
            <img alt="" src="/images/costume_icon.png" />
            <span>
              <strong>Costume</strong>
              <small>
                {controller.availableCostumes.length === 0
                  ? 'Unavailable'
                  : costume
                    ? formatCostumeName(costume)
                    : 'Any'}
              </small>
            </span>
          </button>
        </div>

        <div className="appearance-select-grid">
          <label>
            <span>Form</span>
            <select
              disabled={controller.availableForms.length === 0}
              onChange={controller.handleFormChange}
              value={selectedForm}
            >
              <option value="">Any form</option>
              {controller.availableForms.map((form) => (
                <option key={form} value={form}>
                  {formatForm(form)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Costume</span>
            <select
              disabled={!controller.showCostumeDropdown}
              onChange={controller.handleCostumeChange}
              value={costume ?? ''}
            >
              <option value="">Any costume</option>
              {controller.availableCostumes.map((entry) => (
                <option key={entry.costume_id} value={entry.name}>
                  {formatCostumeName(entry.name)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {controller.canDynamax ? (
          <fieldset className="search-segmented-control appearance-max-control">
            <legend>Max form</legend>
            <button
              aria-pressed={maxMode === 'standard'}
              onClick={() => controller.setMaxMode('standard')}
              type="button"
            >
              Standard
            </button>
            {controller.hasDynamax ? (
              <button
                aria-pressed={maxMode === 'dynamax'}
                onClick={() => controller.setMaxMode('dynamax')}
                type="button"
              >
                <img alt="" src="/images/dynamax-icon.png" /> Dynamax
              </button>
            ) : null}
            {controller.hasGigantamax ? (
              <button
                aria-pressed={maxMode === 'gigantamax'}
                onClick={() => controller.setMaxMode('gigantamax')}
                type="button"
              >
                <img alt="" src="/images/gigantamax-icon.png" /> Gigantamax
              </button>
            ) : null}
          </fieldset>
        ) : null}
      </section>

      <section className="search-filter-card">
        <div className="search-filter-card__heading">
          <div>
            <h4>Gender and moves</h4>
            <p>Match a gender or exact Pokémon GO moveset.</p>
          </div>
        </div>

        {genderOptions.length > 0 ? (
          <fieldset className="search-segmented-control appearance-gender-control">
            <legend>Gender</legend>
            {genderOptions.map((gender) => (
              <button
                aria-pressed={selectedGender === gender}
                key={gender}
                onClick={() => controller.handleGenderChange(gender)}
                type="button"
              >
                {gender}
              </button>
            ))}
          </fieldset>
        ) : null}

        <div className="appearance-move-grid">
          <label>
            <span>Fast move</span>
            <select
              disabled={fastMoves.length === 0}
              onChange={(event) => updateMove('fastMove', event.target.value)}
              value={selectedMoves.fastMove ?? ''}
            >
              <option value="">Any fast move</option>
              {fastMoves.map((move) => (
                <option key={move.move_id} value={move.move_id}>
                  {move.name}{move.legacy ? '*' : ''}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Charged move</span>
            <select
              disabled={chargedMoves.length === 0}
              onChange={(event) => updateMove('chargedMove1', event.target.value)}
              value={selectedMoves.chargedMove1 ?? ''}
            >
              <option value="">Any charged move</option>
              {chargedMoves
                .filter((move) => move.move_id !== selectedMoves.chargedMove2)
                .map((move) => (
                  <option key={move.move_id} value={move.move_id}>
                    {move.name}{move.legacy ? '*' : ''}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span>Second charged move</span>
            <select
              disabled={chargedMoves.length === 0}
              onChange={(event) => updateMove('chargedMove2', event.target.value)}
              value={selectedMoves.chargedMove2 ?? ''}
            >
              <option value="">Any second move</option>
              {chargedMoves
                .filter((move) => move.move_id !== selectedMoves.chargedMove1)
                .map((move) => (
                  <option key={move.move_id} value={move.move_id}>
                    {move.name}{move.legacy ? '*' : ''}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </section>

      <section className="search-filter-card appearance-background-card">
        <div className="search-filter-card__heading">
          <div>
            <h4>Location background</h4>
            <p>Optionally match one of this Pokémon’s special backgrounds.</p>
          </div>
          <button
            disabled={!controller.backgroundAllowed}
            onClick={() => controller.setShowBackgroundOverlay(true)}
            type="button"
          >
            <FaMapMarkedAlt aria-hidden="true" />
            {controller.selectedBackground ? 'Change' : 'Choose'}
          </button>
        </div>
        <div className="appearance-background-summary">
          {controller.selectedBackground ? (
            <>
              <strong>{controller.selectedBackground.name}</strong>
              <span>{controller.selectedBackground.location}</span>
              <button
                onClick={() => controller.handleBackgroundChange(null)}
                type="button"
              >
                Clear
              </button>
            </>
          ) : (
            <span>
              {controller.backgroundAllowed
                ? 'Any eligible background'
                : 'Select an eligible Pokémon or costume first'}
            </span>
          )}
        </div>
      </section>

      <VariantSearchBackgroundOverlay
        currentPokemonData={controller.currentPokemonData}
        isOpen={controller.showBackgroundOverlay}
        onClose={() => controller.setShowBackgroundOverlay(false)}
        onSelectBackground={controller.handleBackgroundChange}
        selectedCostumeId={controller.selectedCostumeId}
      />
    </div>
  );
};

export default AppearanceFilters;
