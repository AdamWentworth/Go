export const TRAINER_SHOWCASE_SLOT_COUNT = 6;

export const normalizeTrainerShowcaseSlots = (instanceIds: string[]) => [
  ...instanceIds.filter(Boolean).slice(0, TRAINER_SHOWCASE_SLOT_COUNT),
  ...Array<string>(TRAINER_SHOWCASE_SLOT_COUNT).fill(""),
].slice(0, TRAINER_SHOWCASE_SLOT_COUNT);

export const reorderTrainerShowcaseSlots = (
  instanceIds: string[],
  fromIndex: number,
  toIndex: number,
) => {
  const selected = instanceIds
    .filter(Boolean)
    .slice(0, TRAINER_SHOWCASE_SLOT_COUNT);

  if (
    fromIndex < 0 ||
    fromIndex >= selected.length ||
    toIndex < 0 ||
    toIndex >= TRAINER_SHOWCASE_SLOT_COUNT
  ) {
    return normalizeTrainerShowcaseSlots(selected);
  }

  const destinationIndex = Math.min(toIndex, selected.length - 1);
  if (fromIndex !== destinationIndex) {
    const [movedInstanceId] = selected.splice(fromIndex, 1);
    selected.splice(destinationIndex, 0, movedInstanceId);
  }

  return normalizeTrainerShowcaseSlots(selected);
};
