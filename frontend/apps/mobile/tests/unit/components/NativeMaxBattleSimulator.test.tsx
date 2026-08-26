import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BasePokemon, Move } from '@pokemongonexus/shared-contracts/pokemon';
import { NativeMaxBattleSimulator } from '../../../src/components/tools/NativeMaxBattleSimulator';
import {
  buildNativeMaxRoleCandidates,
  buildNativeMaxVariants,
} from '../../../src/features/tools/nativeBattleModels';

const fast = {
  move_id: 1,
  name: 'Vine Whip',
  raid_power: 10,
  raid_energy: 8,
  raid_cooldown: 1,
  is_fast: 1,
  type_name: 'grass',
  type: 'grass',
} as Move;
const charged = {
  ...fast,
  move_id: 2,
  name: 'Power Whip',
  raid_power: 90,
  raid_energy: -50,
  raid_cooldown: 2.5,
  is_fast: 0,
} as Move;
const catalog = [{
  pokemon_id: 1,
  name: 'Bulbasaur',
  pokedex_number: 1,
  attack: 118,
  defense: 111,
  stamina: 128,
  available: 1,
  cp40: 1000,
  cp50: 1200,
  type1_name: 'grass',
  type2_name: 'poison',
  image_url: '/1.png',
  moves: [fast, charged],
  max: [{
    pokemon_id: 1,
    dynamax: 1,
    gigantamax: 0,
    dynamax_release_date: null,
    gigantamax_release_date: null,
  }],
}] as BasePokemon[];

describe('NativeMaxBattleSimulator', () => {
  it('models trainers, execution modes, difficulty, and advanced details', () => {
    const boss = buildNativeMaxVariants(catalog)[0];
    const candidates = buildNativeMaxRoleCandidates({
      bossVariant: boss,
      catalog,
      scope: 'catalog',
    });
    render(
      <NativeMaxBattleSimulator
        assetBaseUrl="https://pokegonexus.com"
        boss={boss}
        candidates={candidates}
        rosterScope="catalog"
      />,
    );

    expect(screen.getByText('More help needed')).toBeTruthy();
    expect(screen.getByLabelText('2 Trainers')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Add one Trainer'));
    expect(screen.getByLabelText('3 Trainers')).toBeTruthy();

    fireEvent.press(screen.getByText('Stress test'));
    expect(screen.getByText('Miss orbs and targeted dodges against the hardest legal moveset.')).toBeTruthy();

    fireEvent.press(screen.getByText('Two-star Max'));
    expect(screen.getByLabelText('1 Trainers')).toBeTruthy();

    fireEvent.press(screen.getByText('Advanced setup and model details'));
    expect(screen.getByText('LOBBY DAMAGE')).toBeTruthy();
    expect(screen.getByText(/Catalog entries use level 50/)).toBeTruthy();
  });
});
