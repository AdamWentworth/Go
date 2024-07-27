// Raid.jsx
import React, { useState } from 'react';
import './Raid.css';
import { usePokemonData } from '../../contexts/PokemonDataContext';
import LoadingSpinner from '../LoadingSpinner';
import { getMoveCombinations } from './utils/moveCombinations';
import Pagination from './Pagination';
import Table from './Table';

function Raid() {
    const { variants, loading } = usePokemonData();
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 15;
    const enemyDPS = 20; // Example value for enemy DPS, adjust as needed

    if (loading) {
        return <LoadingSpinner />;
    }

    const filteredVariants = variants.filter(variant =>
        !(variant.variantType.includes('shiny') || variant.variantType.startsWith('costume'))
    );

    const moveCombinations = filteredVariants.flatMap(variant => getMoveCombinations(variant, enemyDPS));
    const totalPages = Math.ceil(moveCombinations.length / itemsPerPage);
    const currentItems = moveCombinations.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <div className="raid-container">
            <h1>Raid Page</h1>
            <Table moves={currentItems} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
    );
}

export default Raid;
