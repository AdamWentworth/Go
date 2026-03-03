// LuckyComponent.tsx

import React from 'react';
import './LuckyComponent.css';
import type { PokemonVariant } from '@/types/pokemonVariants';
import type { PokemonInstance } from '@/types/pokemonInstance';

interface LuckyComponentProps {
    pokemon: {
        instanceData?: Partial<PokemonInstance>;
        rarity?: PokemonVariant['rarity'];
    };
    onToggleLucky: (newState: boolean) => void;
    isLucky: boolean;
    editMode: boolean;
    isShadow: boolean;
}

const LuckyComponent: React.FC<LuckyComponentProps> = ({
    pokemon,
    onToggleLucky,
    isLucky,
    editMode,
    isShadow
}) => {
    if (
        isShadow || 
        pokemon.instanceData?.is_for_trade || 
        pokemon.rarity === "Mythic" || 
        !editMode
    ) {
        return null;
    }

    const toggleLucky = () => {
        if (editMode) {
            onToggleLucky(!isLucky);
        }
    };

    return (
        <div className="lucky-component editable">
            <img 
                src="/images/lucky-icon.png" 
                alt="Lucky Icon" 
                className={isLucky ? 'lucky-on' : 'lucky-off'}
                onClick={toggleLucky}
            />
        </div>
    );
};

export default LuckyComponent;
