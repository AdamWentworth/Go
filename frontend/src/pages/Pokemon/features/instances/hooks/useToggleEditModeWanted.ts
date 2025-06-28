// useToggleEditModeWanted.ts

import { updateNotWantedList } from '../utils/ReciprocalUpdate';

interface OwnershipStatus {
  not_trade_list: Record<string, boolean>;
  not_wanted_list?: Record<string, boolean>;
  // other fields...
}

interface Pokemon {
  pokemonKey: string;
  ownershipStatus: OwnershipStatus;
  // other fields...
}

// ownershipData maps pokemonKey to OwnershipStatus
type OwnershipData = Record<string, OwnershipStatus>;

interface UpdatePayload {
  not_wanted_list?: Record<string, boolean>;
  not_trade_list?: Record<string, boolean>;
  trade_filters?: Record<string, boolean>;
}

// updatesToApply maps pokemonKey to the fields to update
type UpdatesToApply = Record<string, UpdatePayload>;

export interface ToggleEditModeParams {
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
  localNotTradeList: Record<string, boolean>;
  setLocalNotTradeList: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  pokemon: Pokemon;
  ownershipData: OwnershipData;
  filteredOutPokemon: string[];
  localTradeFilters: Record<string, boolean>;
  updateDetails: (keys: string[], updates: UpdatesToApply) => void;
}

export const toggleEditMode = ({
  editMode,
  setEditMode,
  localNotTradeList,
  setLocalNotTradeList,
  pokemon,
  ownershipData,
  filteredOutPokemon,
  localTradeFilters,
  updateDetails,
}: ToggleEditModeParams): void => {
  if (editMode) {
    const updatedNotTradeList = { ...localNotTradeList };

    filteredOutPokemon.forEach((key) => {
      updatedNotTradeList[key] = true;
    });

    const removedKeys = Object.keys(pokemon.ownershipStatus.not_trade_list).filter(
      (key) => !updatedNotTradeList[key]
    );
    const addedKeys = Object.keys(updatedNotTradeList).filter(
      (key) => !pokemon.ownershipStatus.not_trade_list[key]
    );

    const updatesToApply: UpdatesToApply = {};

    removedKeys.forEach((key) => {
      const updatedNotWantedList = updateNotWantedList(
        ownershipData,
        pokemon.pokemonKey,
        key,
        false
      );
      if (updatedNotWantedList) {
        updatesToApply[key] = { not_wanted_list: updatedNotWantedList };
      }
    });

    addedKeys.forEach((key) => {
      const updatedNotWantedList = updateNotWantedList(
        ownershipData,
        pokemon.pokemonKey,
        key,
        true
      );
      if (updatedNotWantedList) {
        updatesToApply[key] = { not_wanted_list: updatedNotWantedList };
      }
    });

    updatesToApply[pokemon.pokemonKey] = {
      not_trade_list: updatedNotTradeList,
      trade_filters: localTradeFilters,
    };

    updateDetails([...removedKeys, ...addedKeys, pokemon.pokemonKey], updatesToApply);
    setLocalNotTradeList(updatedNotTradeList);
  }

  console.log('Local not_trade_list after toggleEditMode:', localNotTradeList);
  setEditMode(!editMode);
  pokemon.ownershipStatus.not_trade_list = localNotTradeList;
};
