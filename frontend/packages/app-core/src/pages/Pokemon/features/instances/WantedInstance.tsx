import React, { useEffect, useMemo, useState } from 'react';
import './WantedInstance.css';

import { useModal } from '@/contexts/ModalContext';
import { useInstancesStore } from '@/features/instances/store/useInstancesStore';
import EditSaveComponent from '@/components/EditSaveComponent';
import Gender from '@/components/pokemonComponents/Gender';
import Moves from '@/components/pokemonComponents/Moves';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { VariantBackground } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';
import { determineImageUrl } from '@/utils/imageHelpers';
import { createScopedLogger } from '@/utils/logger';

import FriendshipManager from './components/Wanted/FriendshipManager';
import MostWantedToggle from './components/Wanted/MostWantedToggle';
import BackgroundSelector from './sections/BackgroundSelector';
import IdentityRow from './sections/IdentityRow';
import ImageStage from './sections/ImageStage';
import StatsRow from './sections/StatsRow';
import TradeBackgroundModal from './sections/TradeBackgroundModal';
import { getEntityKey } from './utils/getEntityKey';

const log = createScopedLogger('WantedInstance');

type BackgroundOption = VariantBackground;

type WantedPokemon = PokemonVariant & {
  instanceData: PokemonInstance;
  backgrounds: BackgroundOption[];
};

interface WantedInstanceProps {
  pokemon: WantedPokemon;
  isEditable: boolean;
  catalogView?: boolean;
  compactListingView?: boolean;
  onPreviewInstanceDataChange?: (patch: Partial<PokemonInstance>) => void;
}

type MovesSelection = {
  fastMove: number | null;
  chargedMove1: number | null;
  chargedMove2: number | null;
};

const hasSpecificGender = (gender: string | null): boolean =>
  Boolean(gender && gender !== 'Any' && gender !== 'Both');

const hasDesiredDetails = (
  gender: string | null,
  weight: number | null,
  height: number | null,
  moves: MovesSelection,
): boolean =>
  Boolean(
    hasSpecificGender(gender) ||
      weight != null ||
      height != null ||
      moves.fastMove ||
      moves.chargedMove1 ||
      moves.chargedMove2,
  );

const WantedInstance: React.FC<WantedInstanceProps> = ({
  pokemon,
  isEditable,
  catalogView = false,
  compactListingView = false,
  onPreviewInstanceDataChange,
}) => {
  const updateDetails = useInstancesStore((state) => state.updateInstanceDetails);
  const { alert } = useModal();
  const entityKey = getEntityKey(pokemon);
  const instanceData = pokemon.instanceData;

  const [editMode, setEditMode] = useState(false);
  const [nickname, setNickname] = useState<string | null>(instanceData.nickname);
  const [gender, setGender] = useState<string | null>(instanceData.gender);
  const [weight, setWeight] = useState<number | null>(instanceData.weight);
  const [height, setHeight] = useState<number | null>(instanceData.height);
  const [moves, setMoves] = useState<MovesSelection>({
    fastMove: instanceData.fast_move_id,
    chargedMove1: instanceData.charged_move1_id,
    chargedMove2: instanceData.charged_move2_id,
  });
  const [friendship, setFriendship] = useState(
    Math.max(0, Math.min(5, Math.trunc(Number(instanceData.friendship_level ?? 0)))),
  );
  const [isLucky, setIsLucky] = useState(Boolean(instanceData.pref_lucky));
  const [mostWanted, setMostWanted] = useState(Boolean(instanceData.most_wanted));
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [selectedBackground, setSelectedBackground] =
    useState<BackgroundOption | null>(() => {
      const locationCardId = Number.parseInt(String(instanceData.location_card ?? ''), 10);
      return (
        (pokemon.backgrounds ?? []).find(
          (background) => background.background_id === locationCardId,
        ) ?? null
      );
    });

  useEffect(() => {
    onPreviewInstanceDataChange?.({
      pref_lucky: isLucky,
      most_wanted: mostWanted,
    });
  }, [isLucky, mostWanted, onPreviewInstanceDataChange]);

  useEffect(() => {
    if (!editMode) setMostWanted(Boolean(instanceData.most_wanted));
  }, [editMode, instanceData.most_wanted]);

  const backgrounds = useMemo(() => pokemon.backgrounds ?? [], [pokemon.backgrounds]);
  const selectableBackgrounds = useMemo(
    () =>
      backgrounds.filter((background) => {
        if (!background.costume_id) return true;
        const variantTypeId = pokemon.variantType?.split('_')[1];
        return background.costume_id === Number.parseInt(variantTypeId ?? '', 10);
      }),
    [backgrounds, pokemon.variantType],
  );

  useEffect(() => {
    const locationCardId = Number.parseInt(String(instanceData.location_card ?? ''), 10);
    setSelectedBackground(
      backgrounds.find((background) => background.background_id === locationCardId) ?? null,
    );
  }, [backgrounds, instanceData.location_card]);

  const isFemale = gender === 'Female';
  const dynamax = Boolean(instanceData.dynamax);
  const gigantamax = Boolean(instanceData.gigantamax);
  const isShadow = Boolean(instanceData.shadow);
  const isPurified = Boolean(instanceData.purified);
  const displayName = pokemon.name ?? pokemon.species_name ?? 'Pokemon';
  const currentImage = useMemo(
    () =>
      determineImageUrl(
        isFemale,
        pokemon,
        false,
        undefined,
        false,
        undefined,
        false,
        gigantamax,
      ),
    [gigantamax, isFemale, pokemon],
  );

  const displayPokemon = useMemo(
    () => ({
      ...pokemon,
      instanceData: {
        ...instanceData,
        nickname,
        gender,
        weight,
        height,
        fast_move_id: moves.fastMove,
        charged_move1_id: moves.chargedMove1,
        charged_move2_id: moves.chargedMove2,
      },
    }),
    [gender, height, instanceData, moves, nickname, pokemon, weight],
  );

  const showWantedDetails =
    editMode || hasDesiredDetails(gender, weight, height, moves);

  const handleBackgroundSelect = (background: BackgroundOption | null) => {
    setSelectedBackground(background);
    setShowBackgrounds(false);
  };

  const toggleEditMode = async () => {
    if (!editMode) {
      setEditMode(true);
      return;
    }

    try {
      await updateDetails(entityKey, {
        nickname,
        gender,
        weight,
        height,
        fast_move_id: moves.fastMove,
        charged_move1_id: moves.chargedMove1,
        charged_move2_id: moves.chargedMove2,
        friendship_level: friendship,
        pref_lucky: isLucky,
        most_wanted: mostWanted,
        location_card: selectedBackground
          ? String(selectedBackground.background_id)
          : null,
      });
      setEditMode(false);
    } catch (error) {
      log.error('Error updating wanted details:', error);
      await alert('An error occurred while updating the wanted Pokémon. Please try again.');
    }
  };

  const friendshipSection = (
    <section
      className={`wanted-instance__conditions${isEditable ? ' has-actions' : ''}${
        isEditable || mostWanted ? ' has-priority' : ''
      }`}
      aria-labelledby={`${entityKey}-conditions`}
    >
      {isEditable ? (
        <div className="wanted-instance__condition-actions">
          <EditSaveComponent
            editMode={editMode}
            toggleEditMode={toggleEditMode}
            isEditable
            label={editMode ? 'Save wanted listing' : 'Edit wanted listing'}
          />
        </div>
      ) : null}
      <div className="wanted-instance__conditions-label">
        <strong id={`${entityKey}-conditions`}>Wanted conditions</strong>
        <span>Friendship and eligibility</span>
      </div>
      {isEditable || mostWanted ? (
        <MostWantedToggle
          active={mostWanted}
          editMode={editMode}
          onChange={setMostWanted}
        />
      ) : null}
      <FriendshipManager
        friendship={friendship}
        setFriendship={setFriendship}
        editMode={editMode}
        isLucky={isLucky}
        setIsLucky={setIsLucky}
      />
    </section>
  );

  const wantedImageStage = (
    <div className="wanted-instance__image-stage">
      <ImageStage
        selectedBackground={selectedBackground}
        isLucky={isLucky}
        currentImage={currentImage}
        name={displayName}
        dynamax={dynamax}
        gigantamax={gigantamax}
        isPurified={isPurified}
      />
      {editMode ? (
        <div className="wanted-instance__background-action">
          <BackgroundSelector
            canPick={selectableBackgrounds.length > 0}
            editMode
            onToggle={() => setShowBackgrounds((visible) => !visible)}
            variant="header"
          />
        </div>
      ) : null}
    </div>
  );

  const wantedDetails = showWantedDetails ? (
    <div className="wanted-instance__requirements" aria-label="Wanted Pokémon details">
      <div className="wanted-instance__detail-fields">
        {(editMode || hasSpecificGender(gender)) && (
          <div className="wanted-instance__gender-field">
            <span>Gender</span>
            <Gender
              pokemon={displayPokemon}
              editMode={editMode}
              searchMode
              onGenderChange={setGender}
            />
          </div>
        )}
        <StatsRow
          pokemon={displayPokemon}
          editMode={editMode}
          onWeightChange={(value) =>
            setWeight(value === '' ? null : Number(value))
          }
          onHeightChange={(value) =>
            setHeight(value === '' ? null : Number(value))
          }
          showTypes={false}
        />
      </div>

      <div className="wanted-instance__moves">
        <Moves
          pokemon={displayPokemon}
          editMode={editMode}
          onMovesChange={setMoves}
          isShadow={isShadow}
          isPurified={isPurified}
        />
      </div>
    </div>
  ) : null;

  if (catalogView) {
    return (
      <div
        className={`caught-instance wanted-instance wanted-instance--catalog-view${
          mostWanted ? ' wanted-instance--most-wanted' : ''
        }`}
      >
        <div className="instance-details-body">
          {friendshipSection}
          {wantedImageStage}
          <IdentityRow
            pokemon={displayPokemon}
            isLucky={isLucky}
            isShadow={isShadow}
            isPurified={isPurified}
            editMode={false}
            onToggleLucky={() => undefined}
            onNicknameChange={setNickname}
            onTogglePurify={() => undefined}
            showLucky={false}
            showPurify={false}
            eyebrow={mostWanted ? 'Most Wanted' : 'Wanted'}
          />
          {wantedDetails}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`caught-instance wanted-instance wanted-instance--caught-layout${
        mostWanted ? ' wanted-instance--most-wanted' : ''
      }${
        compactListingView ? ' wanted-instance--compact-listing' : ''
      }`}
    >
      <div className="instance-details-body">
        {friendshipSection}

        {wantedImageStage}

        <IdentityRow
          pokemon={displayPokemon}
          isLucky={isLucky}
          isShadow={isShadow}
          isPurified={isPurified}
          editMode={editMode}
          onToggleLucky={() => undefined}
          onNicknameChange={setNickname}
          onTogglePurify={() => undefined}
          showLucky={false}
          showPurify={false}
          eyebrow={mostWanted ? 'Most Wanted' : 'Wanted'}
        />

        {wantedDetails}

        <TradeBackgroundModal
          showBackgrounds={showBackgrounds}
          pokemon={pokemon}
          onClose={() => setShowBackgrounds(false)}
          onSelectBackground={handleBackgroundSelect}
        />
      </div>
    </div>
  );
};

export default WantedInstance;
