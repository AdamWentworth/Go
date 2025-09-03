// src/hooks/useCalculatedCP.ts

import { useEffect } from 'react';
import { calculateCP } from '@/utils/calculateCP';
import type { UseCalculatedCPProps } from '@/types/cp';
import { cpMultipliers } from '@/utils/constants';

// Local robust CPM lookup (avoids needing a new util file).
const getCPM = (lvl: number | null | undefined): number | undefined => {
  if (lvl == null || Number.isNaN(lvl)) return undefined;
  const k1 = String(lvl);
  const k2 = lvl.toFixed(1);
  const k3 = k2.replace(/\.0$/, '');
  const dict = cpMultipliers as unknown as Record<string, number>;
  return dict[k1] ?? dict[k2] ?? dict[k3];
};

export const useCalculatedCP = ({
  currentBaseStats,
  level,
  ivs,
  setCP,
}: UseCalculatedCPProps): void => {
  useEffect(() => {
    const { attack, defense, stamina } = currentBaseStats;
    const { Attack: atk, Defense: def, Stamina: sta } = ivs;

    const numbersPresent =
      level != null && !Number.isNaN(level) &&
      atk !== '' && def !== '' && sta !== '' &&
      !Number.isNaN(atk as number) &&
      !Number.isNaN(def as number) &&
      !Number.isNaN(sta as number);

    if (!numbersPresent) return;

    const multiplier = getCPM(level);
    if (multiplier !== undefined) {
      const calculatedCP = calculateCP(
        attack, defense, stamina,
        atk as number, def as number, sta as number,
        multiplier
      );
      setCP(calculatedCP.toString());
    } else {
      console.warn(`No CP multiplier found for level ${level}`);
    }
  }, [currentBaseStats, level, ivs, setCP]);
};