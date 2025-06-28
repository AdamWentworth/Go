// /features/fusion/services/resolveFusionDetails.ts

import { getFromDB } from '@/db/indexedDB';
import { parseBaseNumber, parseFusionId, parseShinyStatus } from '../utils/fusionParsing';
import { getValidCandidates as getCandidatesForIdWithVariants } from '../core/getValidCandidates';

export async function resolveFusionDetails(baseKey: string) {
  const baseNumber = parseBaseNumber(baseKey);
  const fusionIdStr = parseFusionId(baseKey);
  const isShiny = parseShinyStatus(baseKey);

  if (!baseNumber || !fusionIdStr) {
    throw new Error(`[Fusion Handler] Could not parse baseNumber/fusionId from key: ${baseKey}`);
  }

  const variantKey = isShiny ? `${baseNumber}-shiny` : `${baseNumber}-default`;
  const parentVariant = await getFromDB('pokemonVariants', variantKey);
  if (!parentVariant) {
    throw new Error(`[Fusion Handler] No variant data found for key ${variantKey}`);
  }

  const fusionList = Array.isArray(parentVariant.fusion)
    ? parentVariant.fusion
    : Object.values(parentVariant.fusion || {});
  const fusionId = parseInt(fusionIdStr, 10);
  const fusionData = fusionList.find((f) => f.fusion_id === fusionId);
  if (!fusionData) {
    throw new Error(`[Fusion Handler] No matching fusion object for fusion_id=${fusionId}`);
  }

  const { base_pokemon_id1, base_pokemon_id2 } = fusionData;

  const leftCandidates = await getCandidatesForIdWithVariants(String(base_pokemon_id1), isShiny, false);
  const rightCandidates = await getCandidatesForIdWithVariants(String(base_pokemon_id2), isShiny, true);

  return {
    fusionId: fusionIdStr,
    baseNumber,
    isShiny,
    leftBaseId: base_pokemon_id1,
    rightBaseId: base_pokemon_id2,
    leftCandidatesList: leftCandidates,
    rightCandidatesList: rightCandidates,
    parentVariant,
    fusionData,
    error: null,
  };
}
