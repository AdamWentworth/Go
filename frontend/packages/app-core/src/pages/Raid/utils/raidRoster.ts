import type { InstancesMap, PokemonInstance } from "@/types/pokemonInstance";
import type { PokemonVariant } from "@/types/pokemonVariants";
import {
  getLegalRaidChargedMoves,
  getLegalRaidFastMoves,
  isEligibleRaidAttacker,
} from "./raidCatalog";

export type RaidRosterScope = "catalog" | "owned";

export type RaidRosterSummary = {
  attackers: PokemonVariant[];
  caughtCount: number;
  eligibleCount: number;
  incompleteMoveCount: number;
  incompleteLevelCount: number;
  incompleteIvCount: number;
  incompleteEntryCount: number;
  hiddenPowerEstimatedCount: number;
  unmappedCount: number;
};

const hasRecordedIvs = (instance: PokemonInstance): boolean =>
  [instance.attack_iv, instance.defense_iv, instance.stamina_iv].every(
    (value) => value != null && Number.isFinite(Number(value)),
  );

const hasRecordedLevel = (instance: PokemonInstance): boolean =>
  Number.isFinite(Number(instance.level)) && Number(instance.level) > 0;

const canInferLevel = (instance: PokemonInstance): boolean =>
  Number.isFinite(Number(instance.cp)) &&
  Number(instance.cp) > 0 &&
  hasRecordedIvs(instance);

const moveIdsContain = (
  moves: ReturnType<typeof getLegalRaidFastMoves>,
  moveId: number | null,
): boolean =>
  moveId != null && moves.some((move) => move.move_id === moveId);

const getInstanceId = (key: string, instance: PokemonInstance): string =>
  String(instance.instance_id || key);

export const buildRaidRoster = (
  variants: PokemonVariant[],
  instances: InstancesMap,
): RaidRosterSummary => {
  const variantsById = new Map(
    variants.map((variant) => [String(variant.variant_id), variant]),
  );
  const caught = Object.entries(instances).filter(
    ([, instance]) => instance.is_caught && !instance.disabled,
  );

  let incompleteMoveCount = 0;
  let incompleteLevelCount = 0;
  let incompleteIvCount = 0;
  let hiddenPowerEstimatedCount = 0;
  let unmappedCount = 0;
  const incompleteEntryIds = new Set<string>();
  const attackers: PokemonVariant[] = [];

  caught.forEach(([key, instance]) => {
    const base = variantsById.get(String(instance.variant_id));
    if (!base) {
      unmappedCount += 1;
      return;
    }

    const instanceId = getInstanceId(key, instance);
    const recordedIvs = hasRecordedIvs(instance);
    const levelSource = hasRecordedLevel(instance)
      ? "recorded"
      : canInferLevel(instance)
        ? "inferred"
        : "estimated";
    const probe: PokemonVariant = {
      ...base,
      variant_id: `${base.variant_id}::caught::${instanceId}`,
      instanceData: { ...instance, instance_id: instanceId },
      raidRoster: {
        source: "caught",
        instanceId,
        moveSource: "estimated",
        levelSource,
        ivSource: recordedIvs ? "recorded" : "estimated",
      },
    };
    const legalFastMoves = getLegalRaidFastMoves(probe);
    const legalChargedMoves = getLegalRaidChargedMoves(probe);
    const recordedFastMove = legalFastMoves.find(
      (move) => move.move_id === instance.fast_move_id,
    );
    const hiddenPowerTypeEstimated =
      recordedFastMove?.name.toLowerCase().startsWith("hidden power") ?? false;
    const recordedMoves =
      moveIdsContain(legalFastMoves, instance.fast_move_id) &&
      [instance.charged_move1_id, instance.charged_move2_id].some((moveId) =>
        moveIdsContain(legalChargedMoves, moveId),
      );

    if (!recordedMoves) {
      incompleteMoveCount += 1;
      incompleteEntryIds.add(instanceId);
    }
    if (levelSource === "estimated") {
      incompleteLevelCount += 1;
      incompleteEntryIds.add(instanceId);
    }
    if (!recordedIvs) {
      incompleteIvCount += 1;
      incompleteEntryIds.add(instanceId);
    }

    if (!recordedMoves || levelSource === "estimated" || !recordedIvs) {
      return;
    }

    const attacker: PokemonVariant = {
      ...probe,
      raidRoster: {
        ...probe.raidRoster!,
        moveSource: "recorded",
        hiddenPowerTypeEstimated,
      },
    };

    if (hiddenPowerTypeEstimated) {
      hiddenPowerEstimatedCount += 1;
    }
    if (isEligibleRaidAttacker(attacker)) attackers.push(attacker);
  });

  return {
    attackers,
    caughtCount: caught.length,
    eligibleCount: attackers.length,
    incompleteMoveCount,
    incompleteLevelCount,
    incompleteIvCount,
    incompleteEntryCount: incompleteEntryIds.size,
    hiddenPowerEstimatedCount,
    unmappedCount,
  };
};
