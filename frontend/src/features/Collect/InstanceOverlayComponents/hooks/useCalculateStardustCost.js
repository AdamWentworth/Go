// useCalculateStardustCost.js
import { useEffect, useState } from 'react';
import { parsePokemonKey } from '../../../../utils/PokemonIDUtils';

const useCalculateStardustCost = (
  friendshipLevel,
  passedInPokemon,
  selectedMatchedInstance,
  myOwnershipData,
  ownershipData
) => {
  const [stardustCost, setStardustCost] = useState(0);
  const [isSpecialTrade, setIsSpecialTrade] = useState(false);
  const [isRegisteredTrade, setIsRegisteredTrade] = useState(false); // New state variable

  // Define Stardust cost mappings
  const REG_COST = 100; // Cost when both Pokémon are registered (non-special)
  const UNREG_COST_NOT_SPECIAL = {
    1: 20000,
    2: 16000,
    3: 1600,
    4: 800,
  };
  const UNREG_COST_SPECIAL = {
    1: 1000000,
    2: 800000,
    3: 80000,
    4: 40000,
  };
  const REG_COST_SPECIAL = {
    1: 20000,
    2: 16000,
    3: 1600,
    4: 800,
  };
  const MAX_COST = 1000000; // Maximum Stardust cost

  useEffect(() => {
    const calculateCost = () => {
      // 1) Bail if incomplete
      if (!passedInPokemon || !selectedMatchedInstance) {
        console.log('[useCalculateStardustCost] Incomplete data. Aborting cost calculation.');
        return 0;
      }

      let specialTrade = false;

      // 2) Check if either Pokémon is shiny or legendary => special trade
      if (passedInPokemon.ownershipStatus.shiny || passedInPokemon.rarity === 'Legendary') {
        specialTrade = true;
      }

      if (selectedMatchedInstance.shiny || selectedMatchedInstance.rarity === 'Legendary') {
        specialTrade = true;
      }

      setIsSpecialTrade(specialTrade);
      console.log(`is Special Trade?`, specialTrade)

      // 3) Check registration statuses
      const passedInInstanceId = passedInPokemon.pokemonKey;
      const selectedInstanceId = selectedMatchedInstance.ownershipStatus?.instance_id;

      const passedInIsRegistered = isPokemonRegistered(
        passedInInstanceId,
        myOwnershipData
      );
      const selectedIsRegistered = isPokemonRegistered(
        selectedInstanceId,
        ownershipData
      );

      console.log(`[useCalculateStardustCost] Passed-in Pokémon isRegistered: ${passedInIsRegistered}`);
      console.log(`[useCalculateStardustCost] Selected Instance isRegistered: ${selectedIsRegistered}`);

      // 4a) Update isRegisteredTrade based on both registrations
      setIsRegisteredTrade(passedInIsRegistered && selectedIsRegistered);

      // 4) Determine cost based on trade type and registration
      let cost;

      if (specialTrade) {
        if (passedInIsRegistered && selectedIsRegistered) {
          // Special trade where both are registered
          cost = REG_COST_SPECIAL[friendshipLevel] || MAX_COST;
        } else {
          // Special trade where one or both are unregistered
          cost = UNREG_COST_SPECIAL[friendshipLevel] || MAX_COST;
        }
      } else {
        // Non-special trade costs
        if (!passedInIsRegistered || !selectedIsRegistered) {
          // At least one Pokémon is unregistered
          cost = UNREG_COST_NOT_SPECIAL[friendshipLevel] || 100;
        } else {
          // Both Pokémon are registered
          cost = REG_COST;
        }
      }

      // 5) Final Stardust cost
      console.log(`[useCalculateStardustCost] Final Stardust cost calculated: ${cost}`);
      return cost;
    };

    setStardustCost(calculateCost());
  }, [
    friendshipLevel,
    passedInPokemon,
    selectedMatchedInstance,
    myOwnershipData,
    ownershipData,
  ]);

  return { stardustCost, isSpecialTrade, isRegisteredTrade }; // Include isRegisteredTrade
};

function isPokemonRegistered(instanceId, ownershipObj) {
  if (!instanceId || !ownershipObj) {
    console.log(`[isPokemonRegistered] Invalid instanceId or ownershipObj. Returning false.`);
    return false;
  }

  // 1) Parse out the baseKey
  const { baseKey } = parsePokemonKey(instanceId);

  // 2) Check if any key in `ownershipObj` shares this baseKey and is registered
  const isRegistered = Object.entries(ownershipObj).some(([key, data]) => {
    const { baseKey: thisBaseKey } = parsePokemonKey(key);
    const match = thisBaseKey === baseKey;
    const registered = data.registered;
    if (match) {
      console.log(`[isPokemonRegistered] Found matching key: ${key}. Registered status: ${registered}`);
    }
    return match && registered;
  });

  return isRegistered;
}

export default useCalculateStardustCost;
