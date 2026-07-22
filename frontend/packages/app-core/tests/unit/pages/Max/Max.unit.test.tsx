import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Max from '@/pages/Max/Max';
import type { PokemonInstance } from '@/types/pokemonInstance';
import type { Move } from '@/types/pokemonSubTypes';
import type { PokemonVariant } from '@/types/pokemonVariants';

const variantsState = vi.hoisted(() => ({
  variants: [] as PokemonVariant[],
  variantsLoading: false,
  isMovesLoading: false,
  ensureMoves: vi.fn(async () => undefined),
}));

const instancesState = vi.hoisted(() => ({
  instances: {} as Record<string, PokemonInstance>,
  instancesLoading: false,
}));

const authState = vi.hoisted(() => ({
  isLoggedIn: false,
}));

vi.mock('@/features/variants/store/useVariantsStore', () => ({
  useVariantsStore: (selector: (state: typeof variantsState) => unknown) =>
    selector(variantsState),
}));

vi.mock('@/features/instances/store/useInstancesStore', () => ({
  useInstancesStore: (selector: (state: typeof instancesState) => unknown) =>
    selector(instancesState),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: (state: typeof authState) => unknown) =>
    selector(authState),
}));

const fastMove = (moveId: number, name: string, type: string): Move =>
  ({
    move_id: moveId,
    name,
    type_id: 1,
    raid_power: 10,
    raid_energy: 10,
    raid_cooldown: 0.5,
    is_fast: 1,
    type_name: type,
    type,
  }) as Move;

const chargedMove = (moveId: number, name: string, type: string): Move =>
  ({
    move_id: moveId,
    name,
    type_id: 1,
    raid_power: 200,
    raid_energy: -100,
    raid_cooldown: 2,
    is_fast: 0,
    type_name: type,
    type,
  }) as Move;

function makeMaxVariant(
  variantType: 'default' | 'dynamax' | 'gigantamax' | 'shiny_dynamax',
  pokemonId: number,
  name: string,
  type: string,
): PokemonVariant {
  return {
    variant_id: `${pokemonId}-${variantType}`,
    variantType,
    pokemon_id: pokemonId,
    pokedex_number: pokemonId,
    name,
    species_name: name,
    currentImage: `/images/${variantType}/${pokemonId}.png`,
    image_url: `/images/default/${pokemonId}.png`,
    attack: 200 + pokemonId,
    defense: 180,
    stamina: 190,
    type1_name: type,
    type2_name: '',
    moves: [
      fastMove(pokemonId, `${type} fast move`, type),
      chargedMove(pokemonId + 10_000, `${type} charged move`, type),
    ],
    costumes: [],
    fusion: [],
    backgrounds: [],
    megaEvolutions: [],
    max:
      variantType === 'gigantamax'
        ? [
            {
              pokemon_id: pokemonId,
              dynamax: 1,
              gigantamax: 1,
              dynamax_release_date: null,
              gigantamax_release_date: null,
              gigantamax_move_name: 'G-Max Wildfire',
              gigantamax_move_type: type,
            },
          ]
        : [],
    evolves_from: [],
    evolutionData: pokemonId === 1 ? { evolves_to: [2] } : undefined,
    evolves_to: pokemonId === 1 ? undefined : [],
  } as unknown as PokemonVariant;
}

const MaxLocationProbe = () => {
  const location = useLocation();
  return (
    <output data-testid="max-test-location" hidden>
      {location.pathname}
      {location.search}
    </output>
  );
};

const renderMax = (initialEntry = '/max') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Max />
      <MaxLocationProbe />
    </MemoryRouter>,
  );

describe('Max page', () => {
  beforeEach(() => {
    variantsState.variantsLoading = false;
    variantsState.isMovesLoading = false;
    variantsState.ensureMoves.mockClear();
    authState.isLoggedIn = false;
    instancesState.instances = {};
    instancesState.instancesLoading = false;
    variantsState.variants = [
      makeMaxVariant('dynamax', 1, 'Dynamax Bulbasaur', 'grass'),
      makeMaxVariant('gigantamax', 6, 'Gigantamax Charizard', 'fire'),
      makeMaxVariant('dynamax', 9, 'Dynamax Blastoise', 'water'),
      makeMaxVariant('shiny_dynamax', 9, 'Shiny Dynamax Blastoise', 'water'),
      {
        ...makeMaxVariant('dynamax', 25, 'Pikachu', 'electric'),
        variant_id: '25-default',
        variantType: 'default',
      },
      {
        ...makeMaxVariant('default', 888, 'Zacian', 'steel'),
        form: 'Crowned_sword',
        moves: [
          fastMove(29, 'Metal Claw', 'steel'),
          chargedMove(468, 'Behemoth Blade', 'steel'),
        ],
      },
      {
        ...makeMaxVariant('default', 889, 'Zamazenta', 'steel'),
        form: 'Crowned_shield',
        moves: [
          fastMove(29, 'Metal Claw', 'steel'),
          chargedMove(469, 'Behemoth Bash', 'steel'),
        ],
      },
      {
        ...makeMaxVariant('default', 890, 'Eternatus', 'dragon'),
        moves: [
          fastMove(47, 'Dragon Tail', 'dragon'),
          chargedMove(479, 'Dynamax Cannon', 'dragon'),
        ],
      },
    ];
  });

  it('opens on damage rankings and removes cosmetic and non-Max duplicates', () => {
    const { container } = renderMax();

    expect(screen.getByRole('heading', { name: 'Max Battles' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Max rankings' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Top damage dealers' })).toBeVisible();
    expect(screen.getByLabelText('Ranking assumptions')).toHaveTextContent(
      'Level 50 · 15/15/15 IVs · Max Moves Level 3',
    );
    expect(screen.getByText('6 Max-ready Pokémon')).toBeVisible();
    expect(screen.queryByText('Shiny Dynamax Blastoise')).not.toBeInTheDocument();
    expect(screen.queryByText('Pikachu')).not.toBeInTheDocument();
    expect(screen.getByText('Crowned Sword Zacian')).toBeVisible();
    expect(screen.getByText('Crowned Shield Zamazenta')).toBeVisible();
    expect(screen.getByText('Eternatus')).toBeVisible();
    expect(screen.getAllByText('Behemoth Blade')[0]).toBeVisible();
    expect(screen.getAllByText('Behemoth Bash')[0]).toBeVisible();
    expect(screen.getAllByText('Dynamax Cannon')[0]).toBeVisible();
    expect(screen.getByText('G-Max Wildfire')).toBeVisible();
    expect(screen.getByText('Max Move · Grass')).toBeVisible();
    expect(screen.getAllByText('Fast').length).toBeGreaterThan(0);
    expect(screen.queryByText('Charged')).not.toBeInTheDocument();
    const formIcons = [...container.querySelectorAll<HTMLImageElement>('.max-ranking-form-icon')];
    expect(formIcons).toHaveLength(3);
    expect(formIcons.map((image) => image.getAttribute('src'))).toEqual(
      expect.arrayContaining(['/images/dynamax.png', '/images/gigantamax.png']),
    );
    expect(formIcons.some((image) => image.src.includes('-icon.png'))).toBe(false);
    expect(screen.getAllByText('Attack index').length).toBeGreaterThan(0);
    expect(screen.queryByText('Damage rating')).not.toBeInTheDocument();
    expect(variantsState.ensureMoves).toHaveBeenCalled();
  });

  it('switches roles and applies the role-aware type filter', () => {
    renderMax();

    fireEvent.click(screen.getByRole('button', { name: 'Tank' }));
    expect(screen.getByRole('heading', { name: 'Top tanks' })).toBeVisible();
    expect(screen.getByText('Incoming attack type')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Water' }));
    expect(screen.getByRole('heading', { name: 'Top tanks vs Water' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Water' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders move icons when the catalog only supplies the fallback type field', () => {
    const variant = makeMaxVariant('dynamax', 1, 'Dynamax Bulbasaur', 'grass');
    variant.moves?.forEach((move) => {
      (move as Partial<Move>).type_name = undefined;
    });
    variantsState.variants = [variant];

    const { container } = renderMax();

    const moveIcons = [...container.querySelectorAll<HTMLImageElement>(
      '.max-ranking-fast-move img',
    )];
    expect(moveIcons).toHaveLength(1);
    expect(moveIcons.every((icon) => icon.getAttribute('src') === '/images/types/grass.png')).toBe(
      true,
    );
  });

  it('shows three boss picks at a time through the shared role selector', () => {
    const { container } = renderMax();

    fireEvent.click(screen.getByRole('button', { name: 'Boss teams' }));
    expect(
      screen.getByRole('heading', {
        name: 'Can this group beat Dynamax Bulbasaur?',
      }),
    ).toBeVisible();
    expect(screen.getByLabelText('Trainer count')).toHaveValue(1);
    expect(screen.getByLabelText('Boss HP estimate')).toHaveValue(1_700);
    fireEvent.click(screen.getByText('Advanced setup', { exact: true }));
    expect(screen.getByLabelText('Max Battle execution')).toHaveValue('standard');
    expect(screen.getByLabelText('Modeled outcome range')).toHaveTextContent(
      /Standard: Likely clear/i,
    );
    expect(screen.getByLabelText('Modeled outcome range')).toHaveTextContent(
      /Stress:/i,
    );
    expect(screen.getByText('Likely clear')).toBeVisible();
    expect(screen.getByLabelText('Recommended three-Pokémon party')).toBeVisible();
    expect(
      screen
        .getByLabelText('Recommended three-Pokémon party')
        .querySelectorAll('article'),
    ).toHaveLength(3);
    expect(container.querySelector('.max-simulator-verdict')).toHaveTextContent(
      /modeled damage/i,
    );
    expect(screen.getByLabelText('Damage team member')).toBeVisible();
    expect(screen.getByLabelText('Tank team member')).toBeVisible();
    expect(screen.getByLabelText('Healing team member')).toBeVisible();

    const damagePicker = screen.getByLabelText('Damage team member') as HTMLSelectElement;
    expect(damagePicker.options.length).toBeGreaterThan(1);
    const replacement = damagePicker.options[1].value;
    fireEvent.change(damagePicker, { target: { value: replacement } });
    expect(damagePicker).toHaveValue(replacement);

    fireEvent.click(screen.getByRole('button', { name: 'Add one Trainer' }));
    expect(screen.getByLabelText('Trainer count')).toHaveValue(2);
    expect(screen.getByTestId('max-test-location')).toHaveTextContent('trainers=2');

    fireEvent.change(screen.getByLabelText('Max Battle execution'), {
      target: { value: 'stress-test' },
    });
    expect(screen.getByLabelText('Max Battle execution')).toHaveValue('stress-test');
    expect(screen.getByText(/Miss orbs and targeted dodges/i)).toBeVisible();

    fireEvent.change(screen.getByLabelText('Max Battle difficulty'), {
      target: { value: 'three-star' },
    });
    expect(screen.getByLabelText('Trainer count')).toHaveValue(2);
    expect(screen.getByLabelText('Boss HP estimate')).toHaveValue(10_000);
    expect(screen.getByTestId('max-test-location')).toHaveTextContent(
      'difficulty=three-star',
    );
    expect(screen.getByLabelText('Boss team role')).toBeVisible();
    expect(
      screen.getByRole('heading', {
        name: 'Top damage picks vs Dynamax Bulbasaur',
      }),
    ).toBeVisible();
    expect(screen.getByText('Role alternatives')).toBeVisible();
    expect(screen.getByText('6 ranked')).toBeVisible();
    expect(container.querySelectorAll('.max-ranking-row')).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: 'Show 3 more' }));
    expect(container.querySelectorAll('.max-ranking-row')).toHaveLength(6);
    expect(screen.getByLabelText('Boss ranking method')).toHaveTextContent(
      'Standardized matchup',
    );
    expect(screen.getByLabelText('Boss ranking method')).toHaveTextContent(
      'expected pressure across legal boss movesets',
    );
    expect(screen.getAllByText('Max hit').length).toBeGreaterThan(0);
    expect(screen.queryByText('Tank rating')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tank' }));
    expect(
      screen.getByRole('heading', { name: 'Top tanks vs Dynamax Bulbasaur' }),
    ).toBeVisible();
    expect(screen.getAllByText('Max cycles').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Next Max').length).toBeGreaterThan(0);
    expect(screen.getAllByText('With Guard').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.max-ranking-row')).toHaveLength(3);

    fireEvent.click(screen.getByRole('button', { name: 'Healing' }));
    expect(
      screen.getByRole('heading', { name: 'Top healers vs Dynamax Bulbasaur' }),
    ).toBeVisible();
    expect(screen.getAllByText('Spirit L3 / ally').length).toBeGreaterThan(0);
    expect(screen.getAllByText('All 4 active').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.max-ranking-row')).toHaveLength(3);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search Max Battle bosses' }), {
      target: { value: 'Charizard' },
    });
    const results = screen.getByRole('listbox', { name: 'Boss results' });
    fireEvent.click(within(results).getByRole('option', { name: /Gigantamax Charizard/ }));

    expect(screen.getByRole('heading', { name: 'Gigantamax Charizard' })).toBeVisible();
  });

  it('restores and updates a shareable Max Battle context in the URL', () => {
    renderMax('/max?view=bosses&role=tank&boss=6-gigantamax&trainers=9');

    expect(screen.getByRole('button', { name: 'Boss teams' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Tank' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Gigantamax Charizard' })).toBeVisible();
    expect(screen.getByLabelText('Trainer count')).toHaveValue(9);

    fireEvent.click(screen.getByRole('button', { name: 'Healing' }));
    let currentUrl = screen.getByTestId('max-test-location').textContent ?? '';
    expect(new URL(currentUrl, 'https://pokegonexus.test').searchParams.get('role')).toBe(
      'healing',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Max rankings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Water' }));
    currentUrl = screen.getByTestId('max-test-location').textContent ?? '';
    const searchParams = new URL(
      currentUrl,
      'https://pokegonexus.test',
    ).searchParams;
    expect(searchParams.has('view')).toBe(false);
    expect(searchParams.get('type')).toBe('water');
    expect(searchParams.get('boss')).toBe('6-gigantamax');
  });

  it('reveals complete rankings progressively instead of silently truncating them', () => {
    variantsState.variants = Array.from({ length: 25 }, (_, index) =>
      makeMaxVariant(
        'dynamax',
        index + 1,
        `Dynamax Test ${index + 1}`,
        'grass',
      ),
    );

    const { container } = renderMax();

    expect(container.querySelectorAll('.max-ranking-row')).toHaveLength(18);
    expect(screen.getByText('25 ranked')).toBeVisible();
    expect(screen.getByText('Showing 18 of 25')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Show 7 more' }));

    expect(container.querySelectorAll('.max-ranking-row')).toHaveLength(25);
    expect(screen.queryByRole('button', { name: /Show .* more/ })).not.toBeInTheDocument();
  });

  it('slides between catalog and caught rankings without losing the selected role', () => {
    authState.isLoggedIn = true;
    instancesState.instances = {
      bulbasaur: {
        instance_id: 'caught-bulbasaur',
        variant_id: '1-dynamax',
        pokemon_id: 1,
        nickname: 'Buddy Bulb',
        cp: 900,
        level: 30,
        attack_iv: 15,
        defense_iv: 15,
        stamina_iv: 15,
        shiny: false,
        fast_move_id: 1,
        dynamax: true,
        gigantamax: false,
        crown: false,
        max_attack: 2,
        max_guard: 1,
        max_spirit: 3,
        is_caught: true,
        disabled: false,
      } as PokemonInstance,
    };

    const { container } = renderMax();

    expect(screen.getByRole('button', { name: 'My Pokémon' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Ranking assumptions')).toHaveTextContent(
      'Recorded level · recorded IVs · recorded Fast Move · unlocked Max Move levels',
    );
    expect(screen.getByText('Buddy Bulb')).toBeVisible();
    expect(screen.getByText('CP 900 · Level 30 · 100% IV')).toBeVisible();
    expect(container.querySelector('[data-roster-scope="owned"]')).toHaveClass(
      'max-scope-stage--forward',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tank' }));
    fireEvent.click(screen.getByRole('button', { name: 'All Pokémon' }));

    expect(screen.getByRole('heading', { name: 'Top tanks' })).toBeVisible();
    expect(screen.getByLabelText('Ranking assumptions')).toHaveTextContent(
      'Level 50 · 15/15/15 IVs · Max Moves Level 3',
    );
    expect(container.querySelector('[data-roster-scope="catalog"]')).toHaveClass(
      'max-scope-stage--backward',
    );
    expect(screen.getByTestId('max-test-location')).toHaveTextContent(
      '/max?role=tank&scope=catalog',
    );
  });
});
