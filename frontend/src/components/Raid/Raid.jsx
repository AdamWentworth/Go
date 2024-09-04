// Raid.jsx
import React, { useState, useEffect } from 'react';
import './Raid.css';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import LoadingSpinner from '../LoadingSpinner';
import { getMoveCombinations } from './utils/moveCombinations';
import Pagination from './Pagination';
import Table from './Table';
import useRaidBossesData from './hooks/useRaidBossesData';
import { DEFAULT_RAID_BOSS_STATS, TYPE_MAPPING } from './utils/constants';
import { calculateRaidBossDPS } from './utils/calculateRaidBossDPS';
import RaidBossSelector from './RaidBossSelector';
import MoveSelector from './MoveSelector';

const LEVEL_40_CP_MULTIPLIER = 0.79030001;
const LEVEL_50_CP_MULTIPLIER = 0.84029999;

function Raid() {
    const { variants, loading } = usePokemonData();
    const { raidBossesData, raidLoading } = useRaidBossesData(variants, loading);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedRaidBoss, setSelectedRaidBoss] = useState(null);
    const [selectedFastMove, setSelectedFastMove] = useState(null);  // State for fast move
    const [selectedChargedMove, setSelectedChargedMove] = useState(null);  // State for charged move
    const [searchTerm, setSearchTerm] = useState('');
    const [pokemonFilter, setPokemonFilter] = useState('');
    const [showBest, setShowBest] = useState(false); // State for "Best" filter
    const itemsPerPage = 15;

    useEffect(() => {
        if (raidBossesData && raidBossesData.length > 0) {
            setSelectedRaidBoss(null);
        }
    }, [raidBossesData]);

    useEffect(() => {
        if (selectedRaidBoss) {
            // Reset selected moves when a new raid boss is selected
            setSelectedFastMove(null);
            setSelectedChargedMove(null);
        }
    }, [selectedRaidBoss]);

    if (loading || raidLoading) {
        return <LoadingSpinner />;
    }

    const handleInputChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);

        if (value === '') {
            setSelectedRaidBoss(null);
        } else {
            const boss = raidBossesData.find(boss => boss.name.toLowerCase() === value.toLowerCase());
            if (boss) {
                setSelectedRaidBoss(boss);
            } else {
                setSelectedRaidBoss(null);
            }
        }
    };

    const handlePokemonFilterChange = (event) => {
        setPokemonFilter(event.target.value.toLowerCase());
    };

    const handleBestToggle = () => {
        setShowBest(!showBest);
    };

    const filteredRaidBosses = raidBossesData.filter(boss =>
        boss.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredVariants = variants.filter(variant => {
        const variantType1 = TYPE_MAPPING[variant.type_1_id]?.name.toLowerCase() || 'unknown';
        const variantType2 = TYPE_MAPPING[variant.type_2_id]?.name.toLowerCase() || 'unknown';
        const variantName = variant.name.toLowerCase();

        return (
            !(variant.variantType.includes('shiny') || variant.variantType.startsWith('costume')) &&
            (variantName.includes(pokemonFilter) || variantType1.includes(pokemonFilter) || variantType2.includes(pokemonFilter))
        );
    });

    let raidBossStats = DEFAULT_RAID_BOSS_STATS;
    if (selectedRaidBoss) {
        const raidBossAttackStat = Math.floor((selectedRaidBoss.attack + 15));
        const raidBossDefenseStat = Math.floor((selectedRaidBoss.defense + 15));
        const raidBossStaminaStat = Math.floor((selectedRaidBoss.stamina + 15));

        const playerPokemons = filteredVariants.map(variant => ({
            name: variant.name,
            form: variant.form, // Include form or variant information
            attack: Math.floor((variant.attack + 15) * LEVEL_50_CP_MULTIPLIER),
            defense: Math.floor((variant.defense + 15) * LEVEL_50_CP_MULTIPLIER),
            stamina: Math.floor((variant.stamina + 15) * LEVEL_50_CP_MULTIPLIER),
            type1: TYPE_MAPPING[variant.type_1_id]?.name,
            type2: TYPE_MAPPING[variant.type_2_id]?.name || 'none',
        }));

        // Calculate DPS even if only one or neither move is selected
        const raidBossDPS = calculateRaidBossDPS(
            selectedRaidBoss,
            raidBossAttackStat,
            playerPokemons,
            selectedFastMove,
            selectedChargedMove
        );

        raidBossStats = {
            ...selectedRaidBoss,
            attack: raidBossAttackStat,
            defense: raidBossDefenseStat,
            stamina: raidBossStaminaStat,
            dps: raidBossDPS,
        };
    }

    // Now, get move combinations for each variant with its corresponding DPS or default stats
    let moveCombinations = filteredVariants.flatMap((variant, index) => 
        getMoveCombinations(
            variant,
            Array.isArray(raidBossStats.dps) ? raidBossStats.dps[index] : raidBossStats.dps, // Use indexed DPS if array, otherwise use the single DPS value
            raidBossStats.attack,
            raidBossStats.defense,
            raidBossStats.stamina,
            selectedRaidBoss
        )
    );

    // Ensure that moveCombinations are correctly calculated and sorted
    moveCombinations = moveCombinations.sort((a, b) => b.dps - a.dps);

    // If "Best" filter is active, keep only the best variant (highest DPS) for each Pokémon
    if (showBest) {
        const bestCombinations = {};

        moveCombinations.forEach(combo => {
            const key = combo.name; // Use only the name as the key to identify unique Pokémon

            if (!bestCombinations[key] || parseFloat(combo.dps) > parseFloat(bestCombinations[key].dps)) {
                bestCombinations[key] = combo;  // Store the best combo with the highest DPS
            }
        });

        // Convert the object back to an array
        moveCombinations = Object.values(bestCombinations);

        // Final sort to ensure highest DPS order
        moveCombinations.sort((a, b) => parseFloat(b.dps) - parseFloat(a.dps));
    }

    const totalPages = Math.ceil(moveCombinations.length / itemsPerPage);
    const currentItems = moveCombinations.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <div className="raid-container">
            <h1>Raid Page</h1>
            <RaidBossSelector
                searchTerm={searchTerm}
                handleInputChange={handleInputChange}
                filteredRaidBosses={filteredRaidBosses}
            />
            {selectedRaidBoss && (
                <>
                    <MoveSelector
                        moves={selectedRaidBoss.moves.filter(move => move.is_fast === 1)}
                        selectedMove={selectedFastMove}
                        onMoveSelect={setSelectedFastMove}
                        moveType="Fast"
                    />
                    <MoveSelector
                        moves={selectedRaidBoss.moves.filter(move => move.is_fast === 0)}
                        selectedMove={selectedChargedMove}
                        onMoveSelect={setSelectedChargedMove}
                        moveType="Charged"
                    />
                </>
            )}
            <input
                type="text"
                value={pokemonFilter}
                onChange={handlePokemonFilterChange}
                placeholder="Filter Pokémon by name or type"
                className="pokemon-filter-input"
            />
            <button onClick={handleBestToggle} className="best-button">
                {showBest ? 'Show All' : 'Show Best'}
            </button>
            <Table moves={currentItems} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
}

export default Raid;