type FusionOption = {
  base_pokemon_id1?: number | null;
  fusion_id?: number | null;
};

type CaughtPowerVisibilityInput = {
  megaEvolutionCount: number;
  crownFormCount: number;
  pokemonName: string;
  variantType?: string | null;
  maxCount: number;
  editMode: boolean;
  isShadow: boolean;
  isPurified: boolean;
  fusionOptionCount: number;
  isFused: boolean;
};

type CaughtSectionVisibilityInput = {
  showPowerSectionDivider: boolean;
  movesAndIVVisible: boolean;
  metaPanelVisible: boolean;
};

export const countCaughtFusionOptions = (
  fusionEntries: FusionOption[] | null | undefined,
  pokemonId?: number | null,
): number =>
  (fusionEntries ?? []).filter(
    (item) =>
      item.base_pokemon_id1 === pokemonId &&
      typeof item.fusion_id === 'number',
  ).length;

export const resolveCaughtPowerVisibility = ({
  megaEvolutionCount,
  crownFormCount,
  pokemonName,
  variantType,
  maxCount,
  editMode,
  isShadow,
  isPurified,
  fusionOptionCount,
  isFused,
}: CaughtPowerVisibilityInput) => {
  const normalizedName = pokemonName.toLowerCase();
  const hasMaxVariant =
    typeof variantType === 'string' &&
    (variantType.includes('dynamax') || variantType.includes('gigantamax'));

  const canRenderMegaPower = Boolean(
    megaEvolutionCount > 0 && !isShadow && !normalizedName.includes('clone'),
  );
  const canRenderCrownPower = Boolean(crownFormCount > 0 && !isShadow);
  const canRenderMaxPower = Boolean(
    editMode &&
      hasMaxVariant &&
      maxCount > 0 &&
      !isShadow &&
      !isPurified &&
      !variantType?.includes('costume'),
  );
  const canRenderFusionPower = Boolean(isFused || fusionOptionCount > 0);
  const showPowerSectionDivider = Boolean(
    canRenderMegaPower ||
      canRenderCrownPower ||
      canRenderMaxPower ||
      canRenderFusionPower,
  );

  return {
    canRenderMegaPower,
    canRenderCrownPower,
    canRenderMaxPower,
    canRenderFusionPower,
    hasMaxVariant,
    showPowerSectionDivider,
  };
};

export const resolveCaughtSectionVisibility = ({
  showPowerSectionDivider,
  movesAndIVVisible,
  metaPanelVisible,
}: CaughtSectionVisibilityInput) => {
  const showStatsDivider = Boolean(showPowerSectionDivider || movesAndIVVisible);
  const showMetaDivider = Boolean(
    metaPanelVisible && (movesAndIVVisible || !showPowerSectionDivider),
  );
  const addStatsBottomGap = Boolean(!showStatsDivider && !metaPanelVisible);

  return {
    showStatsDivider,
    showMetaDivider,
    addStatsBottomGap,
  };
};
