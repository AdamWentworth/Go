// handleMegaPokemon.js

import React from 'react';
import { createRoot } from 'react-dom/client';
import MegaPokemonSelection from '../components/MegaPokemonSelection';
import { getAllFromDB } from '../../../../services/indexedDB';
import { parsePokemonKey } from '../../../../utils/PokemonIDUtils';

// Global variable to store the root
let root;

export function handleMegaPokemon(baseKey) {
    return new Promise((resolve, reject) => {
        // Optionally remove the alert or keep it for debugging
        // alert(`Mega Pokémon detected: ${baseKey}`);

        const baseNumber = parseBaseKey(baseKey);

        getOwnedPokemon(baseNumber)
            .then(ownedPokemon => {
                console.log("Owned Pokémon matching requirements:", ownedPokemon);
                processMegaPokemon(baseKey, ownedPokemon, resolve);
            })
            .catch(error => {
                console.error("Error fetching owned Pokémon:", error);
                reject(error);
            });
    });
}

function parseBaseKey(baseKey) {
    // Extract the leading numbers from the baseKey
    const match = baseKey.match(/^\d+/);
    return match ? match[0] : null;
}

function getOwnedPokemon(baseNumber) {
    return getAllFromDB('pokemonOwnership')
        .then(allData => {
            if (!allData || !Array.isArray(allData)) {
                throw new Error("Invalid data retrieved from IndexedDB");
            }

            // Filter for Pokémon with matching base number and is_owned true
            const filteredPokemon = allData.filter(entry => {
                if (!entry.instance_id || typeof entry.instance_id !== 'string') {
                    console.warn("Skipping entry with invalid instance_id:", entry);
                    return false;
                }
                const entryBaseKey = entry.instance_id.split('-')[0]; // Extract base number from instance_id
                return entryBaseKey === baseNumber && entry.is_owned;
            });

            // Further filter out Pokémon that cannot mega evolve (e.g., clone, shadow)
            return filteredPokemon.filter(entry => {
                const { baseKey } = parsePokemonKey(entry.instance_id);
                return !(baseKey.includes('clone') || baseKey.includes('shadow'));
            });
        });
}

function processMegaPokemon(baseKey, ownedPokemon, resolve) { // Accept resolve as a parameter
    // Log or perform additional actions before rendering
    console.log("Processing Mega Pokémon assignment for:", { baseKey, ownedPokemon });

    renderMegaPokemonSelection(baseKey, ownedPokemon, resolve); // Pass resolve to rendering function
}

function renderMegaPokemonSelection(baseKey, ownedPokemon, resolve) { // Accept resolve here
    let container = document.getElementById('mega-pokemon-overlay');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mega-pokemon-overlay';
        document.body.appendChild(container);
    }

    // Check if root is already initialized
    if (!root) {
        root = createRoot(container);
    }

    root.render(
        <MegaPokemonSelection 
            baseKey={baseKey} 
            closeModal={() => closeModal(resolve)} // Pass resolve to closeModal
            ownedPokemon={ownedPokemon} 
            onAssignExisting={() => handleAssignExisting(resolve)} // Handle Assign to Existing
            onCreateNew={() => handleCreateNew(resolve)} // Handle Create New
        />
    );
}

function closeModal(resolve) { // Accept resolve to invoke after closing
    const container = document.getElementById('mega-pokemon-overlay');
    if (container && root) {
        root.unmount(); // Unmount using the existing root instance
        document.body.removeChild(container);
        root = null; // Reset the root to avoid reuse
    }
    resolve(); // Resolve the promise after closing the modal
}

function handleAssignExisting(resolve) {
    // Perform any logic needed when assigning existing Pokémon
    // For now, just alert and close
    alert('Assign to existing Pokémon');
    closeModal(resolve);
}

function handleCreateNew(resolve) {
    // Perform any logic needed when creating new Pokémon
    // For now, just alert and close
    alert('Create new Pokémon');
    closeModal(resolve);
}
