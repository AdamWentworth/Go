type BooleanMap = Record<string, boolean>;

interface InstanceListsShape {
  not_trade_list?: BooleanMap;
  not_wanted_list?: BooleanMap;
}

type InstanceMap = Record<string, InstanceListsShape | undefined>;

/**
 * Return a new `not_trade_list` for `otherInstanceId` without mutating store data.
 */
export const updateNotTradeList = (
  instances: InstanceMap,
  currentInstanceId: string,
  otherInstanceId: string,
  add: boolean,
): BooleanMap | null => {
  const otherInst = instances[otherInstanceId];
  if (!otherInst) return null;

  const next: BooleanMap = { ...(otherInst.not_trade_list || {}) };
  if (add) next[currentInstanceId] = true;
  else delete next[currentInstanceId];
  return next;
};

/**
 * Symmetric helper for the Wanted side.
 */
export const updateNotWantedList = (
  instances: InstanceMap,
  currentInstanceId: string,
  otherInstanceId: string,
  add: boolean,
): BooleanMap | null => {
  const otherInst = instances[otherInstanceId];
  if (!otherInst) return null;

  const next: BooleanMap = { ...(otherInst.not_wanted_list || {}) };
  if (add) next[currentInstanceId] = true;
  else delete next[currentInstanceId];
  return next;
};
