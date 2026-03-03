import { pokemonContract, type Pokemons } from '@pokemongonexus/shared-contracts/pokemon';
import { runtimeConfig } from '../config/runtimeConfig';
import { requestJson } from './httpClient';

export const fetchPokemons = async (): Promise<Pokemons> =>
  requestJson<Pokemons>(
    runtimeConfig.api.pokemonApiUrl,
    pokemonContract.endpoints.pokemons,
    'GET',
  );

