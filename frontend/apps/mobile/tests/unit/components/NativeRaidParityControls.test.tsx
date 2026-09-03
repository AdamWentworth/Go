import { fireEvent, render, screen } from '@testing-library/react-native';
import { NativeRaidRankingCard } from '../../../src/components/tools/NativeRaidRankingCard';
import { NativeRaidSettingsPanel } from '../../../src/components/tools/NativeRaidSettingsPanel';
import { NativeRaidTypeFilter } from '../../../src/components/tools/NativeRaidTypeFilter';
import {
  buildNativeRaidAttackers,
  DEFAULT_NATIVE_RAID_SETTINGS,
  NATIVE_BATTLE_TYPES,
} from '../../../src/features/tools/nativeBattleModels';
import { createNativeRaidFixture, nativeRaidCatalog } from '../../nativeRaidFixtures';

describe('native Raid parity controls', () => {
  it('exposes all canonical ranking modifier choices and shadow semantics', () => {
    const onChange = jest.fn();
    const onShadowRaidChange = jest.fn();
    const onShadowBossModeChange = jest.fn();
    const { rerender } = render(
      <NativeRaidSettingsPanel
        includeBossControls
        includeMonteCarloOption
        includeShadowControls
        onChange={onChange}
        onShadowBossModeChange={onShadowBossModeChange}
        onShadowRaidChange={onShadowRaidChange}
        settings={DEFAULT_NATIVE_RAID_SETTINGS}
      />,
    );
    for (const label of ['Lv 40', 'Lv 50', 'Lv 51', 'Good', 'Great', 'Ultra', 'Best', 'Any Mega', 'Same type', '2', '3', '4', 'No dodging', 'Charged attacks', 'Expected', 'Monte Carlo', 'Favorable', 'Hostile']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    fireEvent.press(screen.getByText('Best'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ friendship: 'best' }));
    fireEvent.press(screen.getByText('Shadow raid'));
    expect(onShadowRaidChange).toHaveBeenCalledWith(true);

    rerender(
      <NativeRaidSettingsPanel
        includeBossControls
        includeMonteCarloOption
        includeShadowControls
        onChange={onChange}
        onShadowBossModeChange={onShadowBossModeChange}
        onShadowRaidChange={onShadowRaidChange}
        settings={{ ...DEFAULT_NATIVE_RAID_SETTINGS, partyPower: 'party2', shadowBossMode: 'subdued' }}
        shadowBossMode="subdued"
        shadowMechanicsEnabled
        shadowRaid
      />,
    );
    for (const label of ['When ready', 'Next Charged', 'Strongest Charged', 'Manual', 'Subdued', 'Enraged']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    fireEvent.press(screen.getByText('Enraged'));
    expect(onShadowBossModeChange).toHaveBeenCalledWith('enraged');
  });

  it('offers all 18 type filters plus the overall ranking', () => {
    const onChange = jest.fn();
    render(<NativeRaidTypeFilter assetBaseUrl="https://pokegonexus.com" onChange={onChange} selectedType="" />);
    expect(screen.getByLabelText('All types')).toBeTruthy();
    expect(NATIVE_BATTLE_TYPES).toHaveLength(18);
    for (const type of NATIVE_BATTLE_TYPES) {
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
    fireEvent.press(screen.getByLabelText('Electric'));
    expect(onChange).toHaveBeenCalledWith('electric');
  });

  it('pins Vite mobile row expansion for rankings and always-visible boss stats', () => {
    const ranking = buildNativeRaidAttackers({
      catalog: nativeRaidCatalog,
      scope: 'catalog',
      settings: DEFAULT_NATIVE_RAID_SETTINGS,
    })[0];
    const counter = createNativeRaidFixture().scores[0];
    if (!ranking || !counter) throw new Error('Raid parity fixture produced no rows.');
    const onToggle = jest.fn();
    const { rerender } = render(
      <NativeRaidRankingCard assetBaseUrl="https://pokegonexus.com" entry={ranking} expanded={false} onToggle={onToggle} rank={1} />,
    );
    fireEvent.press(screen.getByLabelText(`Show all raid stats for ${ranking.name}`));
    expect(onToggle).toHaveBeenCalledTimes(1);
    rerender(<NativeRaidRankingCard assetBaseUrl="https://pokegonexus.com" entry={ranking} expanded onToggle={onToggle} rank={1} />);
    expect(screen.getByLabelText(`Hide all raid stats for ${ranking.name}`)).toBeTruthy();
    expect(screen.getAllByText('TDO').length).toBeGreaterThan(0);

    rerender(<NativeRaidRankingCard assetBaseUrl="https://pokegonexus.com" entry={counter} expanded={false} onToggle={onToggle} rank={1} />);
    expect(screen.getByLabelText(`Rank 1, ${counter.name} raid counter`)).toBeTruthy();
    expect(screen.getByText('TRAINERS')).toBeTruthy();
    expect(screen.getByText('CLEAR')).toBeTruthy();
    expect(screen.queryByText('Tap for all stats')).toBeNull();
  });
});
