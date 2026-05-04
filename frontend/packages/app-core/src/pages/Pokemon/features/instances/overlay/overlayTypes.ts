import type { PokemonInstance } from '@/types/pokemonInstance';
import type { PokemonVariant } from '@/types/pokemonVariants';

export type OverlayType = 'caught' | 'missing' | 'trade' | 'wanted';

export type TypeCandidate =
  | {
      name?: string;
      type?: { name?: string };
      typeName?: string;
    }
  | string
  | number
  | null
  | undefined;

export type OverlayPokemon = Omit<PokemonVariant, 'instanceData'> & {
  instanceData?: Partial<PokemonInstance> & {
    status?: string;
  };
  status?: string;
  type1_name?: string;
  primaryType?: TypeCandidate;
  primary_type?: TypeCandidate;
  type1?: TypeCandidate;
  types?: TypeCandidate[];
  type?: TypeCandidate[];
};
