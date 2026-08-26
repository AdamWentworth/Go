import { fireEvent, render, screen } from '@testing-library/react-native';
import { RAID_TIER_PRESETS } from '@pokemongonexus/shared-domain/raid-rules';
import type { NativeCombatEntry } from '../../../src/features/tools/nativeBattleModels';
import { NativeRaidPartyBuilder } from '../../../src/components/tools/NativeRaidPartyBuilder';

const score = (index: number): NativeCombatEntry => ({
  chargedMove: { move_id: 200 + index, name: `Charged ${index}` } as NativeCombatEntry['chargedMove'],
  cp: 4000,
  dps: 40 - index,
  er: 40 - index,
  fastMove: { move_id: 100 + index, name: `Fast ${index}` } as NativeCombatEntry['fastMove'],
  id: `score-${index}`,
  imageUri: `/pokemon-${index}.png`,
  maxKind: null,
  name: `Attacker ${index}`,
  pokemonId: index + 1,
  rosterDetail: null,
  score: 40 - index,
  sourceInstanceId: null,
  tdo: 400 - index,
  types: ['grass'],
});

const scores = Array.from({ length: 8 }, (_, index) => score(index));
const tier = RAID_TIER_PRESETS.tier1;

describe('NativeRaidPartyBuilder', () => {
  it('edits independent trainers, team slots, and reports contribution', () => {
    const onResultChange = jest.fn();
    render(<NativeRaidPartyBuilder assetBaseUrl="https://pokegonexus.com" onResultChange={onResultChange} scores={scores} tier={tier} />);
    fireEvent.press(screen.getByLabelText('Custom raid party'));
    expect(screen.getByLabelText('Trainer 1 battle team')).toBeTruthy();
    expect(screen.getByLabelText('Trainer 2 settings')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Add Trainer'));
    expect(screen.getByLabelText('Trainer 3 settings')).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText('Trainer 3 name'), 'Remote friend');
    expect(screen.getByText('Remote friend')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Remote friend team slot 1'));
    expect(screen.getByText('Choose an attacker')).toBeTruthy();
    fireEvent.press(screen.getByText('Attacker 6'));
    fireEvent.press(screen.getByText('⚡ Simulate'));
    expect(screen.getByLabelText('Raid party result')).toBeTruthy();
    expect(onResultChange).toHaveBeenLastCalledWith(expect.objectContaining({ trainers: expect.any(Array) }));
    fireEvent.press(screen.getByText('✦ Optimize'));
    expect(onResultChange).toHaveBeenLastCalledWith(expect.objectContaining({ dps: expect.any(Number) }));
  });
});
