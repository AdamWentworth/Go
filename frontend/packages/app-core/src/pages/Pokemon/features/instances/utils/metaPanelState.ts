import type { PokemonInstance } from '@/types/pokemonInstance';

import { normalizeEditableDateValue } from './normalizeEditableDateValue';

export type PokemonWithMetaInstance = {
  instanceData?: Partial<
    Pick<
      PokemonInstance,
      | 'location_caught'
      | 'date_caught'
      | 'is_traded'
      | 'lucky'
      | 'original_trainer_name'
      | 'original_trainer_id'
      | 'traded_date'
    >
  >;
};

type MetaPanelContentInput = {
  pokemon: PokemonWithMetaInstance;
  editMode: boolean;
  isTraded: boolean;
  originalTrainerName: string | null;
  tradedDate: string | null;
  pokeball: string | null;
  allowTradeMetadata?: boolean;
};

export const hasMetaPanelContent = ({
  pokemon,
  editMode,
  isTraded,
  originalTrainerName,
  tradedDate,
  pokeball,
  allowTradeMetadata = true,
}: MetaPanelContentInput): boolean => {
  if (editMode) return true;

  const hasLocation = Boolean((pokemon.instanceData?.location_caught ?? '').trim());
  const hasCaughtDate = Boolean(
    normalizeEditableDateValue(pokemon.instanceData?.date_caught ?? null),
  );
  const hasTradeTrainer = Boolean(
    (originalTrainerName ?? '').trim() ||
      (pokemon.instanceData?.original_trainer_name ?? '').trim() ||
      (pokemon.instanceData?.original_trainer_id ?? '').trim(),
  );
  const hasTradeDate = Boolean(
    normalizeEditableDateValue(tradedDate ?? pokemon.instanceData?.traded_date ?? null),
  );
  const hasBall = Boolean(pokeball);
  const hasTradeContent =
    allowTradeMetadata && (hasTradeTrainer || (Boolean(isTraded) && hasTradeDate));

  return hasLocation || hasCaughtDate || hasTradeContent || hasBall;
};

export const resolveMetaPanelState = ({
  pokemon,
  editMode,
  isTraded,
  originalTrainerName,
  tradedDate,
  pokeball,
  allowTradeMetadata = true,
}: MetaPanelContentInput) => {
  const rawLocation = (pokemon.instanceData?.location_caught ?? '').trim();
  const rawOriginalTrainerName = (
    pokemon.instanceData?.original_trainer_name ?? ''
  ).trim();
  const rawOriginalTrainerId = (pokemon.instanceData?.original_trainer_id ?? '').trim();
  const obtainedInTrade = Boolean(isTraded);
  const dateDisplay = normalizeEditableDateValue(pokemon.instanceData?.date_caught ?? null);
  const tradedDateDisplay = normalizeEditableDateValue(
    tradedDate ?? pokemon.instanceData?.traded_date ?? null,
  );
  const tradedDateInputValue = normalizeEditableDateValue(
    tradedDate ?? pokemon.instanceData?.traded_date ?? null,
  );
  const originalTrainerDisplay =
    (originalTrainerName ?? '').trim() || rawOriginalTrainerName || rawOriginalTrainerId;
  const hasCaughtSummary = Boolean(rawLocation || dateDisplay || pokeball);
  const hasTradeSummary = Boolean(
    allowTradeMetadata && obtainedInTrade && (originalTrainerDisplay || tradedDateDisplay),
  );
  const showEditFieldsDivider = hasCaughtSummary || hasTradeSummary;
  const showMetaCard = hasMetaPanelContent({
    pokemon,
    editMode,
    isTraded,
    originalTrainerName,
    tradedDate,
    pokeball,
    allowTradeMetadata,
  });

  return {
    rawLocation,
    rawOriginalTrainerName,
    rawOriginalTrainerId,
    obtainedInTrade,
    dateDisplay,
    tradedDateDisplay,
    tradedDateInputValue,
    originalTrainerDisplay,
    hasCaughtSummary,
    hasTradeSummary,
    showEditFieldsDivider,
    showMetaCard,
  };
};
