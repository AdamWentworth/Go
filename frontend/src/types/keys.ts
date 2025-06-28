// keys.ts

export interface ParsedKeyParts {
    pokemonId: number;
    costumeName: string | null;
    isShiny: boolean;
    isDefault: boolean;
    isShadow: boolean;
  }

export interface ParsedPokemonKey {
    baseKey: string;
    hasUUID: boolean;
  }