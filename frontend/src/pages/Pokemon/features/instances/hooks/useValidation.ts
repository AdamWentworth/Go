// hooks/useValidation.ts

import { useState } from 'react';
import { cpMultipliers } from '@/utils/constants';
import { calculateCP } from '@/utils/calculateCP';
import type { BaseStats, IVs } from '@/types/cp';

interface ValidationFields {
  level?: number | string;
  cp?: number | string;
  ivs?: {
    Attack?: number;
    Defense?: number;
    Stamina?: number;
  };
}

interface ComputedValues {
  level?: number;
  cp?: number;
  ivs?: IVs;
}

interface ValidationErrors {
  level?: string;
  cp?: string;
  ivs?: string;
  general?: string;
}

const MIN_LEVEL = 1;
const MAX_LEVEL = 51;

// Robust CPM lookup that works whether cpMultipliers keys are "19.5", "19", or "19.0".
const getCPM = (lvl: number | null | undefined): number | undefined => {
  if (lvl == null || Number.isNaN(lvl)) return undefined;
  const k1 = String(lvl);               // "19.5" or "19"
  const k2 = lvl.toFixed(1);            // "19.5" or "19.0"
  const k3 = k2.replace(/\.0$/, '');    // "19"
  const dict = cpMultipliers as unknown as Record<string, number>;
  return dict[k1] ?? dict[k2] ?? dict[k3];
};

const isHalfStep = (n: number) => Number.isInteger(n * 2);

const useValidation = () => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [computedValues, setComputedValues] = useState<ComputedValues>({});

  const validate = (fields: ValidationFields, baseStats: BaseStats) => {
    const validationErrors: ValidationErrors = {};
    const tempComputedValues: ComputedValues = {};

    const { attack: baseAttack, defense: baseDefense, stamina: baseStamina } = baseStats;
    const ivAttack = fields.ivs?.Attack;
    const ivDefense = fields.ivs?.Defense;
    const ivStamina = fields.ivs?.Stamina;

    const cp = Number(fields.cp);
    const level = Number(fields.level);

    const hasLevel = !isNaN(level) && level > 0;
    const hasCP = !isNaN(cp) && cp > 0;
    const hasIVs =
      typeof ivAttack === 'number' && ivAttack >= 0 && ivAttack <= 15 &&
      typeof ivDefense === 'number' && ivDefense >= 0 && ivDefense <= 15 &&
      typeof ivStamina === 'number' && ivStamina >= 0 && ivStamina <= 15;

    if (!hasLevel && !hasCP && !hasIVs) {
      return { validationErrors: {}, computedValues: {} };
    }

    if (hasLevel) {
      if (level < MIN_LEVEL || level > MAX_LEVEL) {
        validationErrors.level = `Level must be between ${MIN_LEVEL} and ${MAX_LEVEL}.`;
      } else if (!isHalfStep(level)) {
        validationErrors.level = 'Level must be in 0.5 increments.';
      }
    }

    if (hasCP) {
      if (cp < 0) {
        validationErrors.cp = 'CP must be a positive number.';
      }
    }

    if (hasLevel && hasCP && hasIVs) {
      const multiplier = getCPM(level);
      if (multiplier == null) {
        validationErrors.level = 'Invalid level provided.';
      } else {
        const calculatedCP = calculateCP(
          baseAttack, baseDefense, baseStamina,
          ivAttack!, ivDefense!, ivStamina!,
          multiplier
        );
        const epsilon = 1e-2;
        if (Math.abs(calculatedCP - cp) > epsilon) {
          validationErrors.cp = `Provided CP (${cp}) does not match the calculated CP (${calculatedCP}) based on Level and IVs.`;
        }
      }
    } else if (hasLevel && hasCP && !hasIVs) {
      const possibleIVs: IVs[] = [];
      const multiplier = getCPM(level);
      if (multiplier == null) {
        validationErrors.level = 'Invalid level provided.';
      } else {
        for (let atk = 0; atk <= 15; atk++) {
          for (let def = 0; def <= 15; def++) {
            for (let sta = 0; sta <= 15; sta++) {
              const calculatedCP = calculateCP(
                baseAttack, baseDefense, baseStamina,
                atk, def, sta,
                multiplier
              );
              if (calculatedCP === cp) {
                possibleIVs.push({ Attack: atk, Defense: def, Stamina: sta });
              }
            }
          }
        }

        if (possibleIVs.length === 1) {
          tempComputedValues.ivs = possibleIVs[0];
        } else if (possibleIVs.length > 1) {
          validationErrors.ivs =
            'Multiple IV combinations found for the given Level and CP. Please specify IVs.';
        } else {
          validationErrors.cp = 'No IV combination matches the provided Level and CP.';
        }
      }
    } else if (hasCP && hasIVs && !hasLevel) {
      const possibleLevels: number[] = [];
      // Iterate all entries (string keys) to allow half levels.
      for (const [lvl, multiplier] of Object.entries(cpMultipliers as Record<string, number>)) {
        const calculatedCP = calculateCP(
          baseAttack, baseDefense, baseStamina,
          ivAttack!, ivDefense!, ivStamina!,
          multiplier
        );
        if (calculatedCP === cp) {
          possibleLevels.push(parseFloat(lvl));
        }
      }

      if (possibleLevels.length === 1) {
        tempComputedValues.level = possibleLevels[0];
      } else if (possibleLevels.length > 1) {
        validationErrors.level =
          'Multiple levels found for the given CP and IVs. Please specify Level.';
      } else {
        validationErrors.cp = 'No Level matches the provided CP and IVs.';
      }
    } else if (hasLevel && hasIVs && !hasCP) {
      const multiplier = getCPM(level);
      if (multiplier == null) {
        validationErrors.level = 'Invalid level provided.';
      } else {
        const computedCPValue = calculateCP(
          baseAttack, baseDefense, baseStamina,
          ivAttack!, ivDefense!, ivStamina!,
          multiplier
        );
        tempComputedValues.cp = computedCPValue;
      }
    } else {
      validationErrors.general =
        'Please provide at least two of the following: Level, CP, IVs.';
    }

    setComputedValues(tempComputedValues);
    setErrors(validationErrors);

    return { validationErrors, computedValues: tempComputedValues };
  };

  const resetErrors = () => {
    setErrors({});
    setComputedValues({});
  };

  return { errors, validate, resetErrors, computedValues };
};

export default useValidation;
