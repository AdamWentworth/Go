import type { PokemonCatalogManifest } from '@shared-contracts/pokemon';

import {
  getCatalogDataVersion,
  getChunkVersion,
} from '@/services/pokemonDataService';
import type { PokemonVariant } from '@/types/pokemonVariants';

type HydratableChunkName = 'moves' | 'raidData';

type PrepareVariantChunkHydrationOptions<TChunk> = {
  manifest: PokemonCatalogManifest;
  chunkName: HydratableChunkName;
  storedVersion: string | null;
  getVariants(): PokemonVariant[];
  hasHydratedData(variants: PokemonVariant[]): boolean;
  fetchChunk(manifest: PokemonCatalogManifest): Promise<TChunk | null>;
};

export type PreparedVariantChunkHydration<TChunk> = {
  chunk: TChunk;
  chunkVersion: string;
  catalogVersion?: string;
};

export const hasHydratedMoves = (variants: PokemonVariant[]): boolean =>
  variants.some(
    (variant) =>
      (variant.moves?.length ?? 0) > 0 ||
      variant.fusion?.some((fusion) => (fusion.moves?.length ?? 0) > 0) ||
      variant.crownForms?.some((crown) => (crown.moves?.length ?? 0) > 0),
  );

export const hasHydratedRaidData = (variants: PokemonVariant[]): boolean =>
  variants.some((variant) => (variant.raid_boss?.length ?? 0) > 0);

export async function prepareVariantChunkHydration<TChunk>({
  manifest,
  chunkName,
  storedVersion,
  getVariants,
  hasHydratedData,
  fetchChunk,
}: PrepareVariantChunkHydrationOptions<TChunk>): Promise<PreparedVariantChunkHydration<TChunk> | null> {
  const chunkVersion = getChunkVersion(manifest, chunkName);
  if (!chunkVersion) return null;

  const currentVariants = getVariants();
  if (storedVersion === chunkVersion && hasHydratedData(currentVariants)) {
    return null;
  }

  const chunk = await fetchChunk(manifest);
  if (!chunk) return null;

  const catalogVersion = getCatalogDataVersion(manifest) ?? undefined;

  return { chunk, chunkVersion, catalogVersion };
}
