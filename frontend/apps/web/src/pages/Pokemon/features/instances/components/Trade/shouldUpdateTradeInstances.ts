export const shouldUpdateTradeInstances = (selectedInstanceIds: unknown): selectedInstanceIds is unknown[] =>
  Array.isArray(selectedInstanceIds) && selectedInstanceIds.length > 0;

