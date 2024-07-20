//RecriprocalUpdate.jsx

export const updateNotTradeList = (ownershipData, currentPokemonKey, otherPokemonKey, add, isMirror = false) => {

    if (!ownershipData[otherPokemonKey]) {
        console.error(`No data found for ${otherPokemonKey}`);
        return;
    }

    // Fetch the current not_trade_list from the ownership data
    const notTradeList = ownershipData[otherPokemonKey].not_trade_list || {};

    if (isMirror) {
        // When mirroring, ensure the original instance is excluded
        Object.keys(ownershipData).forEach(key => {
            if (key !== currentPokemonKey && !ownershipData[key].mirror) {
                notTradeList[key] = add;
            }
        });
    } else {
        // Update the not_trade_list based on the 'add' parameter
        notTradeList[currentPokemonKey] = add;
    }

    // Commit the updated not_trade_list back to the ownership data
    ownershipData[otherPokemonKey].not_trade_list = notTradeList;
    console.log(`Updated ${otherPokemonKey}'s not_trade_list to ${add ? 'add' : 'remove'} ${currentPokemonKey}`, ownershipData[otherPokemonKey].not_trade_list);
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
    console.log(`Updated ${otherPokemonKey}'s not_wanted_list to include/exclude ${currentPokemonKey}`);
};
