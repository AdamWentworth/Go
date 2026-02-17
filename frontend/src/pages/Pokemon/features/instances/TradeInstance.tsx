import React from 'react';
import './TradeInstance.css';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';

import EditSaveComponent from '@/components/EditSaveComponent';
import CP from '@/components/pokemonComponents/CP';
import NameComponent from './components/Caught/NameComponent';
import Gender from '@/components/pokemonComponents/Gender';
import Weight from '@/components/pokemonComponents/Weight';
import Types from '@/components/pokemonComponents/Types';
import Height from '@/components/pokemonComponents/Height';
import Moves from '@/components/pokemonComponents/Moves';
import LocationCaught from '@/components/pokemonComponents/LocationCaught';
import DateCaughtComponent from '@/components/pokemonComponents/DateCaught';
import Level from '@/components/pokemonComponents/Level';
import IV from '@/components/pokemonComponents/IV';
import MaxComponent from './components/Caught/MaxComponent';
import MaxMovesComponent from './components/Caught/MaxMovesComponent';

import useValidation from './hooks/useValidation';
import { useModal } from '@/contexts/ModalContext';
import { getEntityKey } from './utils/getEntityKey';
import {
  buildTradeInstancePatch,
  toTradeValidationFields,
} from './utils/tradeInstanceForm';
import TradeImageStage from './sections/TradeImageStage';
import TradeBackgroundModal from './sections/TradeBackgroundModal';
import type { PokemonInstance } from '@/types/pokemonInstance';
import {
  useTradeInstanceController,
  type TradePokemon,
} from './hooks/useTradeInstanceController';
import { createScopedLogger } from '@/utils/logger';

const log = createScopedLogger('TradeInstance');

interface TradeInstanceProps {
  pokemon: TradePokemon;
  isEditable: boolean;
}

const TradeInstance: React.FC<TradeInstanceProps> = ({ pokemon, isEditable }) => {
  const updateDetails = useInstancesStore((s) => s.updateInstanceDetails);
  const { alert } = useModal();
  const entityKey = getEntityKey(pokemon);

  const {
    errors: validationErrors,
    validate,
    resetErrors,
  } = useValidation();

  const {
    editMode,
    setEditMode,
    nickname,
    cp,
    gender,
    weight,
    height,
    dynamax,
    gigantamax,
    showMaxOptions,
    setShowMaxOptions,
    maxAttack,
    setMaxAttack,
    maxGuard,
    setMaxGuard,
    maxSpirit,
    setMaxSpirit,
    moves,
    ivs,
    areIVsEmpty,
    level,
    locationCaught,
    dateCaught,
    showBackgrounds,
    setShowBackgrounds,
    selectedBackground,
    currentBaseStats,
    currentImage,
    applyComputedValues,
    handleGenderChange,
    handleCPChange,
    handleNicknameChange,
    handleWeightChange,
    handleHeightChange,
    handleMovesChange,
    handleIvChange,
    handleLevelChange,
    handleLocationCaughtChange,
    handleDateCaughtChange,
    handleBackgroundSelect,
    handleToggleMaxOptions,
  } = useTradeInstanceController(pokemon);

  const toggleEditMode = async () => {
    if (editMode) {
      const { validationErrors: ve, computedValues: cv } = validate(
        toTradeValidationFields({
          level,
          cp,
          ivs,
          weight,
          height,
        }),
        currentBaseStats,
      );

      const hasErrors = Object.keys(ve).length > 0;
      if (hasErrors) {
        alert(Object.values(ve).join('\n'));
        return;
      }
      resetErrors();
      applyComputedValues(cv);

      const payload = buildTradeInstancePatch({
        nickname,
        cp,
        gender,
        weight,
        height,
        moves,
        level,
        ivs,
        locationCaught,
        dateCaught,
        selectedBackgroundId: selectedBackground?.background_id ?? null,
        maxAttack,
        maxGuard,
        maxSpirit,
        computedValues: cv,
      });

      try {
        await updateDetails({ [entityKey]: payload as Partial<PokemonInstance> });
      } catch (error) {
        log.error('Error updating trade details:', error);
        alert('An error occurred while updating the Pokemon details. Please try again.');
        return;
      }
    }

    setEditMode((prev) => !prev);
  };

  return (
    <div className="trade-instance">
      <div className="trade-title"></div>
      <div className="top-row">
        <div className="edit-save-container">
          <EditSaveComponent
            editMode={editMode}
            toggleEditMode={toggleEditMode}
            isEditable={isEditable}
          />
        </div>
        <h2>Trade</h2>
      </div>

      <div className="CPComponent">
        <CP
          editMode={editMode}
          onCPChange={handleCPChange}
          cp={cp}
          errors={validationErrors}
        />
      </div>

      {pokemon.backgrounds.length > 0 && (
        <div className={`background-select-row ${editMode ? 'active' : ''}`}>
          <img
            src={'/images/location.png'}
            alt="Background Selector"
            className="background-icon"
            onClick={editMode ? () => setShowBackgrounds(!showBackgrounds) : undefined}
          />
        </div>
      )}

      <TradeImageStage
        selectedBackground={selectedBackground}
        currentImage={currentImage}
        name={pokemon.name}
        dynamax={dynamax}
        gigantamax={gigantamax}
      />

      <div className="name-container">
        <NameComponent
          pokemon={pokemon}
          editMode={editMode}
          onNicknameChange={handleNicknameChange}
        />
      </div>

      <div className="level-gender-container">
        <Level
          editMode={editMode}
          level={level}
          onLevelChange={handleLevelChange}
        />
        {(editMode || (gender !== null && gender !== '')) && (
          <div className="gender-wrapper">
            <Gender
              pokemon={pokemon}
              editMode={editMode}
              onGenderChange={handleGenderChange}
            />
          </div>
        )}
      </div>

      <div className="stats-container">
        <Weight
          pokemon={pokemon}
          editMode={editMode}
          onWeightChange={handleWeightChange}
        />
        <Types pokemon={pokemon} />
        <Height
          pokemon={pokemon}
          editMode={editMode}
          onHeightChange={handleHeightChange}
        />
      </div>

      <MaxComponent
        pokemon={pokemon}
        editMode={editMode}
        dynamax={dynamax}
        gigantamax={gigantamax}
        onToggleMax={handleToggleMaxOptions}
        showMaxOptions={showMaxOptions}
      />
      <MaxMovesComponent
        pokemon={pokemon}
        editMode={editMode}
        showMaxOptions={showMaxOptions}
        setShowMaxOptions={setShowMaxOptions}
        maxAttack={maxAttack}
        maxGuard={maxGuard}
        maxSpirit={maxSpirit}
        handleMaxAttackChange={setMaxAttack}
        handleMaxGuardChange={setMaxGuard}
        handleMaxSpiritChange={setMaxSpirit}
      />

      <div className="moves-container">
        <Moves
          pokemon={pokemon}
          editMode={editMode}
          onMovesChange={handleMovesChange}
          isShadow={!!pokemon.instanceData.shadow}
          isPurified={!!pokemon.instanceData.purified}
        />
      </div>

      {(editMode || !areIVsEmpty) && (
        <div className="iv-component">
          <IV editMode={editMode} onIvChange={handleIvChange} ivs={ivs} />
        </div>
      )}

      <div className="location-container">
        <LocationCaught
          pokemon={pokemon}
          editMode={editMode}
          onLocationChange={handleLocationCaughtChange}
        />
      </div>
      <div className="date-container">
        <DateCaughtComponent
          pokemon={pokemon}
          editMode={editMode}
          onDateChange={handleDateCaughtChange}
        />
      </div>

      <TradeBackgroundModal
        showBackgrounds={showBackgrounds}
        pokemon={pokemon}
        onClose={() => setShowBackgrounds(false)}
        onSelectBackground={handleBackgroundSelect}
      />
    </div>
  );
};

export default TradeInstance;
