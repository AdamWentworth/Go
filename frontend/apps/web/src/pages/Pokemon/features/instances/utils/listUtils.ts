type WantedMap = Record<string, unknown>;

interface ListsState {
  wanted: WantedMap;
  [key: string]: unknown;
}

type SetListsState = (updater: (prevLists: ListsState) => ListsState) => void;

const looksLikeListsState = (value: unknown): value is ListsState => {
  return !!value && typeof value === 'object' && 'wanted' in (value as Record<string, unknown>);
};

export const revertWantedList = (
  prevLists: ListsState,
  localNotWantedList: Record<string, boolean> = {},
): WantedMap => {
  return Object.keys(prevLists.wanted).reduce<WantedMap>((acc, key) => {
    if (!localNotWantedList[key]) {
      acc[key] = prevLists.wanted[key];
    }
    return acc;
  }, {});
};

export const updateDisplayedList = (
  newData: WantedMap | null,
  localNotWantedListOrPrevLists: Record<string, boolean> | ListsState,
  setListsState: SetListsState,
): void => {
  // Backward compatibility:
  // legacy callers pass (newData, prevLists, setListsState)
  // new callers pass    (newData, localNotWantedList, setListsState)
  const localNotWantedList = looksLikeListsState(localNotWantedListOrPrevLists)
    ? {}
    : localNotWantedListOrPrevLists;

  setListsState((prevLists) => ({
    ...prevLists,
    wanted: newData
      ? { ...prevLists.wanted, ...newData }
      : revertWantedList(prevLists, localNotWantedList),
  }));
};
