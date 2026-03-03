import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import BackgroundSelector from '@/pages/Pokemon/features/instances/sections/BackgroundSelector';
import HeaderRow from '@/pages/Pokemon/features/instances/sections/HeaderRow';
import IdentityRow from '@/pages/Pokemon/features/instances/sections/IdentityRow';
import ImageStage from '@/pages/Pokemon/features/instances/sections/ImageStage';
import LevelGenderRow from '@/pages/Pokemon/features/instances/sections/LevelGenderRow';
import MetaPanel from '@/pages/Pokemon/features/instances/sections/MetaPanel';
import Modals from '@/pages/Pokemon/features/instances/sections/Modals';
import MovesAndIV from '@/pages/Pokemon/features/instances/sections/MovesAndIV';
import PowerPanel from '@/pages/Pokemon/features/instances/sections/PowerPanel';
import StatsRow from '@/pages/Pokemon/features/instances/sections/StatsRow';

vi.mock('@/components/EditSaveComponent', () => ({
  default: ({ toggleEditMode }: { toggleEditMode: () => void }) => (
    <button onClick={toggleEditMode}>toggle-edit</button>
  ),
}));

vi.mock('@/components/pokemonComponents/CP', () => ({
  default: ({ cp, onCPChange }: { cp: string | number; onCPChange?: (value: string) => void }) => (
    <button onClick={() => onCPChange?.('2500')}>cp-{cp}</button>
  ),
}));

vi.mock('@/components/pokemonComponents/Favorite', () => ({
  default: ({ onFavoriteChange }: { onFavoriteChange?: (value: boolean) => void }) => (
    <button onClick={() => onFavoriteChange?.(true)}>favorite</button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/LuckyComponent', () => ({
  default: ({ onToggleLucky }: { onToggleLucky?: (value: boolean) => void }) => (
    <button onClick={() => onToggleLucky?.(true)}>lucky</button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/NameComponent', () => ({
  default: ({ onNicknameChange }: { onNicknameChange?: (value: string) => void }) => (
    <button onClick={() => onNicknameChange?.('Mew')}>name</button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/PurifyComponent', () => ({
  default: ({ onTogglePurify }: { onTogglePurify?: (value: boolean) => void }) => (
    <button onClick={() => onTogglePurify?.(true)}>purify</button>
  ),
}));

vi.mock('@/components/pokemonComponents/Level', () => ({
  default: ({ level }: { level?: number | null }) => <div>level-{String(level ?? '')}</div>,
}));

vi.mock('@/components/pokemonComponents/Gender', () => ({
  default: () => <div>gender</div>,
}));

vi.mock('@/components/pokemonComponents/LocationCaught', () => ({
  default: () => <div>location-caught</div>,
}));

vi.mock('@/components/pokemonComponents/DateCaught', () => ({
  default: () => <div>date-caught</div>,
}));

vi.mock('@/components/pokemonComponents/BackgroundLocationCard', () => ({
  default: ({ onSelectBackground }: { onSelectBackground?: (value: unknown) => void }) => (
    <button onClick={() => onSelectBackground?.({ background_id: 1 })}>pick-background</button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/FuseOverlay', () => ({
  default: ({ onClose, onFuse }: { onClose?: () => void; onFuse?: () => void }) => (
    <div>
      <button onClick={onClose}>close-fuse</button>
      <button onClick={onFuse}>do-fuse</button>
    </div>
  ),
}));

vi.mock('@/components/pokemonComponents/Moves', () => ({
  default: ({ onMovesChange }: { onMovesChange?: (value: unknown) => void }) => (
    <button onClick={() => onMovesChange?.({ fastMove: 1 })}>moves</button>
  ),
}));

vi.mock('@/components/pokemonComponents/IV', () => ({
  default: ({ onIvChange }: { onIvChange?: (value: unknown) => void }) => (
    <button onClick={() => onIvChange?.({ Attack: 15, Defense: 15, Stamina: 15 })}>iv</button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/MaxComponent', () => ({
  default: ({ onToggleMax }: { onToggleMax?: () => void }) => (
    <button onClick={onToggleMax}>toggle-max</button>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/MaxMovesComponent', () => ({
  default: ({ maxAttack, maxGuard, maxSpirit }: { maxAttack: string | number; maxGuard: string | number; maxSpirit: string | number }) => (
    <div>{`max-${maxAttack}-${maxGuard}-${maxSpirit}`}</div>
  ),
}));

vi.mock('@/pages/Pokemon/features/instances/components/Caught/MegaComponent', () => ({
  default: () => <div>mega-component</div>,
}));

vi.mock('@/components/pokemonComponents/Weight', () => ({
  default: ({ onWeightChange }: { onWeightChange?: (value: string | number) => void }) => (
    <button onClick={() => onWeightChange?.(70)}>weight</button>
  ),
}));

vi.mock('@/components/pokemonComponents/Types', () => ({
  default: () => <div>types</div>,
}));

vi.mock('@/components/pokemonComponents/Height', () => ({
  default: ({ onHeightChange }: { onHeightChange?: (value: string | number) => void }) => (
    <button onClick={() => onHeightChange?.(2)}>height</button>
  ),
}));

describe('instances section components', () => {
  it('BackgroundSelector renders only when selectable and supports toggle in edit mode', () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <BackgroundSelector canPick={false} editMode={false} onToggle={onToggle} />,
    );

    expect(screen.queryByAltText('Background Selector')).not.toBeInTheDocument();

    rerender(<BackgroundSelector canPick={true} editMode={true} onToggle={onToggle} />);
    fireEvent.click(screen.getByAltText('Background Selector'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('HeaderRow forwards callbacks to child controls', () => {
    const toggleEditMode = vi.fn();
    const onCPChange = vi.fn();
    const onFavoriteChange = vi.fn();

    render(
      <HeaderRow
        editMode={true}
        toggleEditMode={toggleEditMode}
        isEditable={true}
        cp="100"
        onCPChange={onCPChange}
        onFavoriteChange={onFavoriteChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle-edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'cp-100' }));
    fireEvent.click(screen.getByRole('button', { name: 'favorite' }));

    expect(toggleEditMode).toHaveBeenCalledTimes(1);
    expect(onCPChange).toHaveBeenCalledWith('2500');
    expect(onFavoriteChange).toHaveBeenCalledWith(true);
  });

  it('IdentityRow forwards lucky/name/purify callbacks', () => {
    const onToggleLucky = vi.fn();
    const onNicknameChange = vi.fn();
    const onTogglePurify = vi.fn();

    render(
      <IdentityRow
        pokemon={{}}
        isLucky={false}
        isShadow={true}
        isPurified={false}
        editMode={true}
        onToggleLucky={onToggleLucky}
        onNicknameChange={onNicknameChange}
        onTogglePurify={onTogglePurify}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'lucky' }));
    fireEvent.click(screen.getByRole('button', { name: 'name' }));
    fireEvent.click(screen.getByRole('button', { name: 'purify' }));

    expect(onToggleLucky).toHaveBeenCalledWith(true);
    expect(onNicknameChange).toHaveBeenCalledWith('Mew');
    expect(onTogglePurify).toHaveBeenCalledWith(true);
  });

  it('ImageStage renders optional overlays and badges', () => {
    render(
      <ImageStage
        selectedBackground={{ image_url: '/images/bg.png' }}
        isLucky={true}
        currentImage="/images/mewtwo.png"
        name="Mewtwo"
        dynamax={true}
        gigantamax={true}
        isPurified={true}
      />,
    );

    expect(screen.getByAltText('Lucky Backdrop')).toBeInTheDocument();
    expect(screen.getByAltText('Dynamax Badge')).toBeInTheDocument();
    expect(screen.getByAltText('Gigantamax Badge')).toBeInTheDocument();
    expect(screen.getByAltText('Purified Badge')).toBeInTheDocument();
    expect(screen.getByAltText('Mewtwo')).toBeInTheDocument();
  });

  it('LevelGenderRow shows gender only when edit mode or gender exists', () => {
    const { rerender } = render(
      <LevelGenderRow
        pokemon={{}}
        editMode={false}
        level={20}
        onLevelChange={vi.fn()}
        gender=""
        onGenderChange={vi.fn()}
      />,
    );

    expect(screen.queryByText('gender')).not.toBeInTheDocument();

    rerender(
      <LevelGenderRow
        pokemon={{}}
        editMode={false}
        level={20}
        onLevelChange={vi.fn()}
        gender="Male"
        onGenderChange={vi.fn()}
      />,
    );

    expect(screen.getByText('gender')).toBeInTheDocument();
  });

  it('MetaPanel renders location/date controls', () => {
    render(
      <MetaPanel
        pokemon={{}}
        editMode={true}
        onLocationChange={vi.fn()}
        onDateChange={vi.fn()}
      />,
    );

    expect(screen.getByText('location-caught')).toBeInTheDocument();
    expect(screen.getByText('date-caught')).toBeInTheDocument();
  });

  it('Modals closes backgrounds and supports fuse overlay actions', () => {
    const setShowBackgrounds = vi.fn();
    const onCloseOverlay = vi.fn();
    const onFuse = vi.fn();

    render(
      <Modals
        showBackgrounds={true}
        setShowBackgrounds={setShowBackgrounds}
        pokemon={{}}
        onSelectBackground={vi.fn()}
        overlayPokemon={{ id: 1 }}
        onCloseOverlay={onCloseOverlay}
        onFuse={onFuse}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent.click(screen.getByRole('button', { name: 'close-fuse' }));
    fireEvent.click(screen.getByRole('button', { name: 'do-fuse' }));

    expect(setShowBackgrounds).toHaveBeenCalledWith(false);
    expect(onCloseOverlay).toHaveBeenCalledTimes(1);
    expect(onFuse).toHaveBeenCalledTimes(1);
  });

  it('MovesAndIV renders IV conditionally and forwards move/iv callbacks', () => {
    const onMovesChange = vi.fn();
    const onIvChange = vi.fn();
    const { rerender } = render(
      <MovesAndIV
        pokemon={{}}
        editMode={false}
        onMovesChange={onMovesChange}
        isShadow={false}
        isPurified={false}
        ivs={{ Attack: null, Defense: null, Stamina: null }}
        onIvChange={onIvChange}
        areIVsEmpty={true}
      />,
    );

    expect(screen.queryByRole('button', { name: 'iv' })).not.toBeInTheDocument();

    rerender(
      <MovesAndIV
        pokemon={{}}
        editMode={false}
        onMovesChange={onMovesChange}
        isShadow={false}
        isPurified={false}
        ivs={{ Attack: 1, Defense: 2, Stamina: 3 }}
        onIvChange={onIvChange}
        areIVsEmpty={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'moves' }));
    fireEvent.click(screen.getByRole('button', { name: 'iv' }));

    expect(onMovesChange).toHaveBeenCalledWith({ fastMove: 1 });
    expect(onIvChange).toHaveBeenCalled();
  });

  it('PowerPanel renders max/mega controls and forwards max toggle', () => {
    const onToggleMax = vi.fn();

    render(
      <PowerPanel
        pokemon={{}}
        editMode={true}
        megaData={{}}
        setMegaData={vi.fn()}
        megaEvolutions={[]}
        isShadow={false}
        name="Mewtwo"
        dynamax={false}
        gigantamax={false}
        showMaxOptions={false}
        onToggleMax={onToggleMax}
        maxAttack="1"
        maxGuard="2"
        maxSpirit="3"
        onMaxAttackChange={vi.fn()}
        onMaxGuardChange={vi.fn()}
        onMaxSpiritChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'toggle-max' }));

    expect(onToggleMax).toHaveBeenCalledTimes(1);
    expect(screen.getByText('mega-component')).toBeInTheDocument();
    expect(screen.getByText('max-1-2-3')).toBeInTheDocument();
  });

  it('StatsRow renders and forwards weight/height changes', () => {
    const onWeightChange = vi.fn();
    const onHeightChange = vi.fn();

    render(
      <StatsRow
        pokemon={{}}
        editMode={true}
        onWeightChange={onWeightChange}
        onHeightChange={onHeightChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'weight' }));
    fireEvent.click(screen.getByRole('button', { name: 'height' }));

    expect(screen.getByText('types')).toBeInTheDocument();
    expect(onWeightChange).toHaveBeenCalledWith(70);
    expect(onHeightChange).toHaveBeenCalledWith(2);
  });
});
