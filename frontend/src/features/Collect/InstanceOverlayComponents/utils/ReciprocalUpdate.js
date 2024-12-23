//RecriprocalUpdate.jsx

export const updateNotTradeList = (ownershipData, currentPokemonKey, otherPokemonKey, add, isMirror = false) => {
    if (!ownershipData[otherPokemonKey]) {
        console.error(`No data found for ${otherPokemonKey}`);
        return null;
    }

    // console.log(`updateNotTradeList called for ${otherPokemonKey} with add=${add}`);

    // Fetch the current not_trade_list from the ownership data
    const notTradeList = ownershipData[otherPokemonKey].not_trade_list || {};    

    if (isMirror) {
        // When mirroring, ensure the original instance is excluded
        Object.keys(ownershipData).forEach(key => {
            if (key == currentPokemonKey) {
                notTradeList[key] = add;
            }
        });
    } else {
        // Update the not_trade_list based on the 'add' parameter
        if (add) {
            notTradeList[currentPokemonKey] = true;
        } else {
            delete notTradeList[currentPokemonKey];  // Remove the entry if `add` is false
        }
    }

    // Commit the updated not_trade_list back to the ownership data
    ownershipData[otherPokemonKey].not_trade_list = notTradeList;

    // console.log(`Final not_trade_list for ${otherPokemonKey}:`, notTradeList);

    // Return the updated not_trade_list for further processing
    return notTradeList;
};

export const updateNotWantedList = (ownershipData, currentPokemonKey, otherPokemonKey, add) => {

    if (!ownershipData[otherPokemonKey]) {
        console.error(`No data found for ${otherPokemonKey}`);
        return;
    }

    const notWantedList = ownershipData[otherPokemonKey].not_wanted_list || {};

    // Update the not_wanted_list to reflect the currentPokemon's status
    notWantedList[currentPokemonKey] = add;

    ownershipData[otherPokemonKey].not_wanted_list = notWantedList;
    // console.log(`Updated ${otherPokemonKey}'s not_wanted_list to include/exclude ${currentPokemonKey}`);

    return notWantedList
};
