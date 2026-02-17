// src/hooks/useCalculateStardustCost.ts

import { useEffect, useState } from 'react';
import { parseVariantId } from '@/utils/PokemonIDUtils';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { Instances } from '@/types/instances';
import type { PokemonInstance } from '@/types/pokemonInstance';

interface UseCalculateStardustCostResult {
  stardustCost: number;
  isSpecialTrade: boolean;
  isRegisteredTrade: boolean;
}

export const useCalculateStardustCost = (
  friendshipLevel: number,
  passedInPokemon: PokemonVariant | null,
  selectedMatchedInstance: PokemonInstance | null,
  myInstances: Instances,
  instances: Instances
): UseCalculateStardustCostResult => {
  const [stardustCost, setStardustCost] = useState(0);
  const [isSpecialTrade, setIsSpecialTrade] = useState(false);
  const [isRegisteredTrade, setIsRegisteredTrade] = useState(false);

  const REG_COST = 100;
  const UNREG_COST_NOT_SPECIAL: Record<number, number> = {
    1: 20000,
    2: 16000,
    3: 1600,
    4: 800,
  };
  const UNREG_COST_SPECIAL: Record<number, number> = {
    1: 1000000,
    2: 800000,
    3: 80000,
    4: 40000,
  };
  const REG_COST_SPECIAL: Record<number, number> = {
    1: 20000,
    2: 16000,
    3: 1600,
    4: 800,
  };
  const MAX_COST = 1000000;

  useEffect(() => {
    const calculateCost = () => {
      if (!passedInPokemon || !selectedMatchedInstance) return 0;

      let specialTrade = false;

      if (passedInPokemon.instanceData?.shiny || passedInPokemon.rarity === 'Legendary') {
        specialTrade = true;
      }
      if (selectedMatchedInstance.shiny || selectedMatchedInstance.rarity === 'Legendary') {
        specialTrade = true;
      }

      setIsSpecialTrade(specialTrade);

      const passedInInstanceId =
        passedInPokemon.instanceData?.instance_id ??
        passedInPokemon.variant_id ??
        '';
      const selectedInstanceId = selectedMatchedInstance.instance_id ?? '';

      const passedInIsRegistered = isPokemonRegistered(passedInInstanceId, myInstances);
      const selectedIsRegistered = isPokemonRegistered(selectedInstanceId, instances);

      setIsRegisteredTrade(passedInIsRegistered && selectedIsRegistered);

      let cost: number;

      if (specialTrade) {
        if (passedInIsRegistered && selectedIsRegistered) {
          cost = REG_COST_SPECIAL[friendshipLevel] ?? MAX_COST;
        } else {
          cost = UNREG_COST_SPECIAL[friendshipLevel] ?? MAX_COST;
        }
      } else {
        if (!passedInIsRegistered || !selectedIsRegistered) {
          cost = UNREG_COST_NOT_SPECIAL[friendshipLevel] ?? 100;
        } else {
          cost = REG_COST;
        }
      }

      return cost;
    };

    setStardustCost(calculateCost());
  }, [
    friendshipLevel,
    passedInPokemon,
    selectedMatchedInstance,
    myInstances,
    instances,
  ]);

  return { stardustCost, isSpecialTrade, isRegisteredTrade };
};

function isPokemonRegistered(
  instanceId: string,
  instances: Instances
): boolean {
  if (!instanceId || !instances) {
    return false;
  }

  const { baseKey } = parseVariantId(instanceId);

  return Object.entries(instances).some(([key, data]) => {
    const { baseKey: thisBaseKey } = parseVariantId(key);
    return thisBaseKey === baseKey && Boolean(data.registered);
  });
}

export default useCalculateStardustCost;
