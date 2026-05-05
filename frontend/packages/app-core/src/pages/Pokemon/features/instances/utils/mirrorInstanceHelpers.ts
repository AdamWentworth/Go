export type MirrorUpdateDetailsFn<TData extends object> =
  | ((id: string, data: TData) => unknown)
  | ((patchMap: Record<string, TData>) => unknown);

export type OptionalMirrorUpdateDetailsFn<TData extends object> =
  | MirrorUpdateDetailsFn<TData>
  | undefined;

export const asNumber = (value: unknown): number | undefined => {
  if (value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const normalizeMirrorVariantId = (value?: string | null): string | undefined => {
  if (!value || typeof value !== 'string') return undefined;
  const separatorIndex = value.indexOf('-');
  if (separatorIndex < 0) return value.toLowerCase();
  const prefix = value.slice(0, separatorIndex);
  const suffix = value.slice(separatorIndex + 1).replace(/-/g, '_');
  return `${prefix}-${suffix}`.toLowerCase();
};

export const getPokemonIdFromMirrorVariant = (variantId: string | undefined): number | undefined => {
  if (typeof variantId !== 'string') return undefined;
  const match = variantId.match(/^(\d{1,4})/);
  return match ? asNumber(match[1]) : undefined;
};

export const safeUpdateMirrorDetails = <TData extends object>(
  updateDetails: OptionalMirrorUpdateDetailsFn<TData>,
  id: string,
  data: TData,
  onError?: (error: unknown) => void,
): void => {
  try {
    if (typeof updateDetails !== 'function') return;

    const callable = updateDetails as (...args: unknown[]) => unknown;
    if (callable.length >= 2) {
      callable(id, data);
      return;
    }

    callable({ [id]: data });
  } catch (error) {
    onError?.(error);
  }
};
