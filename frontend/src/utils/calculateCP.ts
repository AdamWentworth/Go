// utils/calculateCP.ts

export const calculateCP = (
  baseAttack: number,
  baseDefense: number,
  baseStamina: number,
  ivAttack: number,
  ivDefense: number,
  ivStamina: number,
  cpMultiplier: number
): number => {
  const attack = baseAttack + ivAttack;
  const defense = baseDefense + ivDefense;
  const stamina = baseStamina + ivStamina;

  const cp = Math.floor(
    (attack * Math.sqrt(defense) * Math.sqrt(stamina) * Math.pow(cpMultiplier, 2)) / 10
  );

  return cp;
};
