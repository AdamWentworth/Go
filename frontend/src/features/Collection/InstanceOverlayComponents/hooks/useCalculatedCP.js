// src/hooks/useCalculatedCP.js
import { useEffect } from 'react';
import { cpMultipliers } from '../../../../utils/constants';
import { calculateCP } from '../../../../utils/calculateCP';

export const useCalculatedCP = ({ currentBaseStats, level, ivs, setCP }) => {
  useEffect(() => {
    const { attack, defense, stamina } = currentBaseStats;
    const { Attack: atk, Defense: def, Stamina: sta } = ivs;
  
    if (
      level != null &&
      !isNaN(level) &&
      atk !== '' &&
      def !== '' &&
      sta !== '' &&
      !isNaN(atk) &&
      !isNaN(def) &&
      !isNaN(sta)
    ) {
      const multiplier = cpMultipliers[level];
      if (multiplier) {
        const calculatedCP = calculateCP(
          attack,
          defense,
          stamina,
          atk,
          def,
          sta,
          multiplier
        );
        setCP(calculatedCP.toString());
      } else {
        console.warn(`No CP multiplier found for level ${level}`);
      }
    }
  }, [currentBaseStats, level, ivs, setCP]);
};
