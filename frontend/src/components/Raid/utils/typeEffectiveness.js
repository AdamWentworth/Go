// typeEffectiveness.js

const typeEffectivenessMultipliers = {
    superEffective: 1.6,
    doubleSuperEffective: 2.56,
    notVeryEffective: 0.625,
    doubleNotVeryEffective: 0.391,
    neutral: 1,
    veryIneffective: 0.244,
};

const typeChart = {
    normal: { rock: 0.625, ghost: 0.244, steel: 0.625 },
    fire: { fire: 0.625, water: 0.625, grass: 1.6, ice: 1.6, bug: 1.6, rock: 0.625, dragon: 0.625, steel: 1.6 },
    water: { fire: 1.6, water: 0.625, grass: 0.625, ground: 1.6, rock: 1.6, dragon: 0.625 },
    electric: { water: 1.6, electric: 0.625, grass: 0.625, ground: 0.244, flying: 1.6, dragon: 0.625 },
    grass: { fire: 0.625, water: 1.6, grass: 0.625, poison: 0.625, ground: 1.6, flying: 0.625, bug: 0.625, rock: 1.6, dragon: 0.625, steel: 0.625 },
    ice: { fire: 0.625, water: 0.625, grass: 1.6, ice: 0.625, ground: 1.6, flying: 1.6, dragon: 1.6, steel: 0.625 },
    fighting: { normal: 1.6, ice: 1.6, poison: 0.625, flying: 0.625, psychic: 0.625, bug: 0.625, rock: 1.6, ghost: 0.244, dark: 1.6, steel: 1.6, fairy: 0.625 },
    poison: { grass: 1.6, poison: 0.625, ground: 0.625, rock: 0.625, ghost: 0.625, steel: 0.244, fairy: 1.6 },
    ground: { fire: 1.6, electric: 1.6, grass: 0.625, poison: 1.6, flying: 0.244, bug: 0.625, rock: 1.6, steel: 1.6 },
    flying: { electric: 0.625, grass: 1.6, fighting: 1.6, bug: 1.6, rock: 0.625, steel: 0.625 },
    psychic: { fighting: 1.6, poison: 1.6, psychic: 0.625, dark: 0.244, steel: 0.625 },
    bug: { fire: 0.625, grass: 1.6, fighting: 0.625, poison: 0.625, flying: 0.625, psychic: 1.6, ghost: 0.625, dark: 1.6, steel: 0.625, fairy: 0.625 },
    rock: { fire: 1.6, ice: 1.6, fighting: 0.625, ground: 0.625, flying: 1.6, bug: 1.6, steel: 0.625 },
    ghost: { normal: 0.244, psychic: 1.6, ghost: 1.6, dark: 0.625 },
    dragon: { dragon: 1.6, steel: 0.625, fairy: 0.244 },
    dark: { fighting: 0.625, psychic: 1.6, ghost: 1.6, dark: 0.625, fairy: 0.625 },
    steel: { fire: 0.625, water: 0.625, electric: 0.625, ice: 1.6, rock: 1.6, steel: 0.625, fairy: 1.6 },
    fairy: { fire: 0.625, fighting: 1.6, poison: 0.625, dragon: 1.6, dark: 1.6, steel: 0.625 },
};

function getTypeEffectivenessMultiplier(attackingType, defendingTypes) {
    if (!attackingType || attackingType.trim() === '') {
        return 1.0;
    }

    let multiplier = 1;
    attackingType = attackingType.toLowerCase();

    defendingTypes.forEach(defendingType => {
        if (defendingType) {
            defendingType = defendingType.toLowerCase();
            if (typeChart[attackingType] && typeChart[attackingType][defendingType] !== undefined) {
                multiplier *= typeChart[attackingType][defendingType];
            }
        }
    });

    return multiplier;
}

export { typeEffectivenessMultipliers, getTypeEffectivenessMultiplier };