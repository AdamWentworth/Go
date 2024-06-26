//RecriprocalUpdate.jsx

// Assuming this function interacts with some backend or state management logic
export const updateNotTradeList = (ownershipData, currentPokemonKey, otherPokemonKey, add) => {
    console.log(`Request to ${add ? 'add' : 'remove'} ${currentPokemonKey} to/from ${otherPokemonKey}'s not_trade_list`);

    if (!ownershipData[otherPokemonKey]) {
        console.error(`No data found for ${otherPokemonKey}`);
        return;
    }

    // Fetch the current not_trade_list from the ownership data
    const notTradeList = ownershipData[otherPokemonKey].not_trade_list || {};

    // Update the not_trade_list based on the 'add' parameter
    notTradeList[currentPokemonKey] = add;
    console.log(`Before update:`, notTradeList);

    // Commit the updated not_trade_list back to the ownership data
    ownershipData[otherPokemonKey].not_trade_list = notTradeList;
    console.log(`Updated ${otherPokemonKey}'s not_trade_list to ${add ? 'add' : 'remove'} ${currentPokemonKey}`, ownershipData[otherPokemonKey].not_trade_list);
};

