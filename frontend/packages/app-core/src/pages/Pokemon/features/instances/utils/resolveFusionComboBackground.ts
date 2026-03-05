import type { VariantBackground, FusionBackgroundComboRule } from '@/types/pokemonSubTypes';

type FusionEntry = {
  fusion_id?: number | null;
  name?: string;
  base_pokemon_id1?: number;
  base_pokemon_id2?: number;
  background_combo_rules?: FusionBackgroundComboRule[];
};

type ResolveFusionComboBackgroundParams = {
  pokemonId: number;
  fusionEntries: FusionEntry[] | null | undefined;
  resolvedFusionId: number | null;
  fusionForm: string | null | undefined;
  ownBackgroundId: number | null;
  partnerBackgroundId: number | null;
  availableBackgrounds: VariantBackground[];
};

const normalizeFusionToken = (value: unknown): string =>
  typeof value === 'string'
    ? value
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
    : '';

const findFusionEntry = ({
  fusionEntries,
  resolvedFusionId,
  fusionForm,
}: {
  fusionEntries: FusionEntry[];
  resolvedFusionId: number | null;
  fusionForm: string | null | undefined;
}): FusionEntry | null => {
  const normalizedFusionForm = normalizeFusionToken(fusionForm);
  if (normalizedFusionForm) {
    const byName = fusionEntries.find(
      (entry) => normalizeFusionToken(entry.name) === normalizedFusionForm,
    );
    if (byName) return byName;
  }

  if (resolvedFusionId != null) {
    const byId = fusionEntries.find((entry) => entry.fusion_id === resolvedFusionId);
    if (byId) return byId;
  }

  if (fusionEntries.length === 1) return fusionEntries[0];
  return null;
};

export const resolveFusionComboBackground = ({
  pokemonId,
  fusionEntries,
  resolvedFusionId,
  fusionForm,
  ownBackgroundId,
  partnerBackgroundId,
  availableBackgrounds,
}: ResolveFusionComboBackgroundParams): VariantBackground | null => {
  if (ownBackgroundId == null || partnerBackgroundId == null) return null;

  const entries = Array.isArray(fusionEntries) ? fusionEntries : [];
  if (entries.length === 0) return null;

  const fusionEntry = findFusionEntry({
    fusionEntries: entries,
    resolvedFusionId,
    fusionForm,
  });
  if (!fusionEntry) return null;

  const comboRules = Array.isArray(fusionEntry.background_combo_rules)
    ? fusionEntry.background_combo_rules
    : [];
  if (comboRules.length === 0) return null;

  const pokemonIsMember1 = fusionEntry.base_pokemon_id1 === pokemonId;
  const pokemonIsMember2 = fusionEntry.base_pokemon_id2 === pokemonId;

  const matchingRule = comboRules.find((rule) => {
    if (pokemonIsMember1) {
      return (
        rule.member1_background_id === ownBackgroundId &&
        rule.member2_background_id === partnerBackgroundId
      );
    }
    if (pokemonIsMember2) {
      return (
        rule.member2_background_id === ownBackgroundId &&
        rule.member1_background_id === partnerBackgroundId
      );
    }
    return (
      (rule.member1_background_id === ownBackgroundId &&
        rule.member2_background_id === partnerBackgroundId) ||
      (rule.member2_background_id === ownBackgroundId &&
        rule.member1_background_id === partnerBackgroundId)
    );
  });

  if (!matchingRule) return null;

  const existingBackground =
    availableBackgrounds.find(
      (background) => background.background_id === matchingRule.combo_background_id,
    ) ?? null;
  if (existingBackground) return existingBackground;

  if (
    typeof matchingRule.combo_background_image_url === 'string' &&
    matchingRule.combo_background_image_url.trim().length > 0
  ) {
    return {
      background_id: matchingRule.combo_background_id,
      image_url: matchingRule.combo_background_image_url,
      name: matchingRule.combo_background_name ?? `Background ${matchingRule.combo_background_id}`,
      costume_id: 0,
      date: matchingRule.combo_background_date ?? '',
      location: matchingRule.combo_background_location ?? '',
    };
  }

  return null;
};
