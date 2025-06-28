// hooks/useValidation.ts

import { useState } from 'react';
import { cpMultipliers } from '@/utils/constants';
import { calculateCP } from '@/utils/calculateCP';
import type { BaseStats, IVs } from '@/types/cp'; // ✅ Import from your existing types

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
      typeof ivAttack === 'number' &&
      ivAttack >= 0 &&
      ivAttack <= 15 &&
      typeof ivDefense === 'number' &&
      ivDefense >= 0 &&
      ivDefense <= 15 &&
      typeof ivStamina === 'number' &&
      ivStamina >= 0 &&
      ivStamina <= 15;

    if (!hasLevel && !hasCP && !hasIVs) {
      return { validationErrors: {}, computedValues: {} };
    }

    if (hasLevel) {
      if (level < 1 || level > 50) {
        validationErrors.level = 'Level must be between 1 and 50.';
      }
    }

    if (hasCP) {
      if (cp < 0) {
        validationErrors.cp = 'CP must be a positive number.';
      }
    }

    if (hasLevel && hasCP && hasIVs) {
      const multiplier = cpMultipliers[level as keyof typeof cpMultipliers];
      if (!multiplier) {
        validationErrors.level = 'Invalid level provided.';
      } else {
        const calculatedCP = calculateCP(
          baseAttack,
          baseDefense,
          baseStamina,
          ivAttack!,
          ivDefense!,
          ivStamina!,
          multiplier
        );
        const epsilon = 1e-2;
        if (Math.abs(calculatedCP - cp) > epsilon) {
          validationErrors.cp = `Provided CP (${cp}) does not match the calculated CP (${calculatedCP}) based on Level and IVs.`;
        }
      }
    } else if (hasLevel && hasCP && !hasIVs) {
      const possibleIVs: IVs[] = [];
      const multiplier = cpMultipliers[level as keyof typeof cpMultipliers];
      if (!multiplier) {
        validationErrors.level = 'Invalid level provided.';
      } else {
        for (let atk = 0; atk <= 15; atk++) {
          for (let def = 0; def <= 15; def++) {
            for (let sta = 0; sta <= 15; sta++) {
              const calculatedCP = calculateCP(
                baseAttack,
                baseDefense,
                baseStamina,
                atk,
                def,
                sta,
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
      for (const [lvl, multiplier] of Object.entries(cpMultipliers)) {
        const calculatedCP = calculateCP(
          baseAttack,
          baseDefense,
          baseStamina,
          ivAttack!,
          ivDefense!,
          ivStamina!,
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
      const multiplier = cpMultipliers[level as keyof typeof cpMultipliers];
      if (!multiplier) {
        validationErrors.level = 'Invalid level provided.';
      } else {
        const computedCPValue = calculateCP(
          baseAttack,
          baseDefense,
          baseStamina,
          ivAttack!,
          ivDefense!,
          ivStamina!,
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
