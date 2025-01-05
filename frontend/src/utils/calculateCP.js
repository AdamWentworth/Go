// utils/calculateCP.js

export const calculateCP = (
    baseAttack,
    baseDefense,
    baseStamina,
    ivAttack,
    ivDefense,
    ivStamina,
    cpMultiplier
  ) => {
    const attack = baseAttack + ivAttack;
    const defense = baseDefense + ivDefense;
    const stamina = baseStamina + ivStamina;
    const cp = Math.floor(
      (attack * Math.sqrt(defense) * Math.sqrt(stamina) * Math.pow(cpMultiplier, 2)) / 10
    );
    return cp;
  };
  