// Raid.jsx
import React, { useState, useEffect } from 'react';
import './Raid.css';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import LoadingSpinner from '../LoadingSpinner';
import { getMoveCombinations } from './utils/moveCombinations';
import Pagination from './Pagination';
import Table from './Table';
import useRaidBossesData from './hooks/useRaidBossesData';
import { DEFAULT_RAID_BOSS_STATS } from './utils/constants';
import { calculateRaidBossDPS } from './utils/calculateRaidBossDPS';
import RaidBossSelector from './RaidBossSelector';

const LEVEL_40_CP_MULTIPLIER = 0.79030001;

function Raid() {
    const { variants, loading } = usePokemonData();
    const { raidBossesData, raidLoading } = useRaidBossesData(variants, loading);
    const [currentPage, setCurrentPage] = useState(0);
    const [selectedRaidBoss, setSelectedRaidBoss] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 15;

    useEffect(() => {
        if (raidBossesData && raidBossesData.length > 0) {
            setSelectedRaidBoss(null); // No initial raid boss selected
        }
    }, [raidBossesData]);

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

    const filteredRaidBosses = raidBossesData.filter(boss =>
        boss.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredVariants = variants.filter(variant =>
        !(variant.variantType.includes('shiny') || variant.variantType.startsWith('costume'))
    );

    let raidBossStats = DEFAULT_RAID_BOSS_STATS;
    if (selectedRaidBoss) {
        const raidBossAttackStat = Math.floor((selectedRaidBoss.attack + 15));
        const raidBossDefenseStat = Math.floor((selectedRaidBoss.defense + 15));
        const raidBossStaminaStat = Math.floor((selectedRaidBoss.stamina + 15));

        const playerPokemons = filteredVariants.map(variant => ({
            name: variant.name,
            attack: Math.floor((variant.attack + 15) * LEVEL_40_CP_MULTIPLIER),
            defense: Math.floor((variant.defense + 15) * LEVEL_40_CP_MULTIPLIER),
            stamina: Math.floor((variant.stamina + 15) * LEVEL_40_CP_MULTIPLIER),
            type1: variant.type1,
            type2: variant.type2
        }));

        const raidBossDPS = calculateRaidBossDPS(selectedRaidBoss, raidBossAttackStat, raidBossDefenseStat, raidBossStaminaStat, playerPokemons);

        if (selectedRaidBoss.pokemon_id === 260) {
            console.log(`Detailed Calculation Logs for Raid Boss ${selectedRaidBoss.name} (Pokemon ID 260):`);
            console.log(`Attack stat: ${raidBossAttackStat}`);
            console.log(`Defense stat: ${raidBossDefenseStat}`);
            console.log(`Stamina stat: ${raidBossStaminaStat}`);
            console.log(`DPS: ${raidBossDPS}`);
        }

        raidBossStats = {
            ...selectedRaidBoss,
            attack: raidBossAttackStat,
            defense: raidBossDefenseStat,
            stamina: raidBossStaminaStat,
            dps: raidBossDPS,
        };
    }

    const moveCombinations = filteredVariants.flatMap(variant => 
        getMoveCombinations(
            variant,
            raidBossStats.dps,
            raidBossStats.attack,
            raidBossStats.defense,
            raidBossStats.stamina,
            selectedRaidBoss
        )
    );

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
            <Table moves={currentItems} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
}

export default Raid;


