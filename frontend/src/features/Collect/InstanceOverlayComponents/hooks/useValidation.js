// hooks/useValidation.js

import { useState } from 'react';
import { cpMultipliers } from '../../../../utils/constants'; // Adjust the path as necessary

const useValidation = () => {
  const [errors, setErrors] = useState({});
  const [computedValues, setComputedValues] = useState({}); // To store computed values

  /**
   * Calculates CP based on the given parameters.
   */
  const calculateCP = (
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

  /**
   * Validates the provided fields and computes the missing parameter.
   */
  const validate = (fields, pokemon) => {
    const validationErrors = {};
    const tempComputedValues = {}; // Temporary object to hold computed values

    // Destructure base stats and IVs
    const baseAttack = Number(pokemon.attack);
    const baseDefense = Number(pokemon.defense);
    const baseStamina = Number(pokemon.stamina);
    const ivAttack = fields.ivs?.Attack;
    const ivDefense = fields.ivs?.Defense;
    const ivStamina = fields.ivs?.Stamina;
    const cp = Number(fields.cp);
    const level = Number(fields.level);

    // Determine which parameters are provided
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

    // Validation for Level
    if (hasLevel) {
      if (level < 1 || level > 50) {
        validationErrors.level = 'Level must be between 1 and 50.';
      }
    }

    // Validation for CP
    if (hasCP) {
      if (cp < 0) {
        validationErrors.cp = 'CP must be a positive number.';
      }
    }

    // Compute based on provided parameters
    if (hasLevel && hasCP && hasIVs) {
      // All three provided: Validate CP
      const multiplier = cpMultipliers[level];
      if (!multiplier) {
        validationErrors.level = 'Invalid level provided.';
      } else {
        const calculatedCP = calculateCP(
          baseAttack,
          baseDefense,
          baseStamina,
          ivAttack,
          ivDefense,
          ivStamina,
          multiplier
        );

        // Allow a small epsilon for floating point discrepancies
        const epsilon = 1e-2;
        if (Math.abs(calculatedCP - cp) > epsilon) {
          validationErrors.cp = `Provided CP (${cp}) does not match the calculated CP (${calculatedCP}) based on Level and IVs.`;
        }
      }
    } else if (hasLevel && hasCP && !hasIVs) {
      // CP and Level provided: Compute IVs
      const possibleIVs = [];
      const multiplier = cpMultipliers[level];
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
      // CP and IVs provided: Compute Level
      const possibleLevels = [];
      for (const [lvl, multiplier] of Object.entries(cpMultipliers)) {
        const calculatedCP = calculateCP(
          baseAttack,
          baseDefense,
          baseStamina,
          ivAttack,
          ivDefense,
          ivStamina,
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
      // Level and IVs provided: Compute CP
      const multiplier = cpMultipliers[level];
      if (!multiplier) {
        validationErrors.level = 'Invalid level provided.';
      } else {
        const computedCPValue = calculateCP(
          baseAttack,
          baseDefense,
          baseStamina,
          ivAttack,
          ivDefense,
          ivStamina,
          multiplier
        );
        tempComputedValues.cp = computedCPValue;
      }
    } else {
      // Not enough parameters to compute the missing one
      validationErrors.general =
        'Please provide at least two of the following: Level, CP, IVs.';
    }

    // Update computedValues state
    setComputedValues(tempComputedValues);

    // Update errors state
    setErrors(validationErrors);

    console.log('Validation Errors:', validationErrors);
    console.log('Computed Values:', tempComputedValues);

    return { validationErrors, computedValues: tempComputedValues };
  };

  /**
   * Resets all validation errors and computed values.
   */
  const resetErrors = () => {
    setErrors({});
    setComputedValues({});
  };

  return { errors, validate, resetErrors, computedValues };
};

export default useValidation;
