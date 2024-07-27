// moveCombinations.js

import { calculateDPS } from './calculateDPS';

export function getMoveCombinations(variant, enemyDPS) {
    const fastMoves = variant.moves.filter(move => move.is_fast === 1);
    const chargedMoves = variant.moves.filter(move => move.is_fast === 0);
    
    return fastMoves.flatMap(fastMove => 
        chargedMoves.map(chargedMove => {
            const dps = calculateDPS(fastMove, chargedMove, variant.hp, enemyDPS);
            
            return {
                name: variant.name,
                fastMove: fastMove.name,
                chargedMove: chargedMove.name,
                dps: dps,
                tdo: '---',
                er: '---',
                cp: variant.cp || '---'
            };
        })
    );
}


