// mergeOwnershipData.js

export const mergeOwnershipData = (oldData, newData, username) => {
    const mergedData = {};
    const oldDataProcessed = {};

    const extractPrefix = (key) => {
        const keyParts = key.split('_');
        keyParts.pop(); // Remove the UUID part
        return keyParts.join('_'); // Rejoin to form the actual prefix
    };

    console.log("Starting merge process...");

    // Step 1: Merge new data
    Object.keys(newData).forEach(key => {
        const prefix = extractPrefix(key);
        // Check for exact key match in old and new data
        if (oldData.hasOwnProperty(key)) {
            // If matching keys, compare their last_update values
            const newDate = new Date(newData[key].last_update);
            const oldDate = new Date(oldData[key].last_update);
            if (newDate > oldDate) {
                mergedData[key] = newData[key];
            } else {
                mergedData[key] = oldData[key];
            }
        } else {
            mergedData[key] = newData[key];
        }
        oldDataProcessed[prefix] = oldDataProcessed[prefix] || [];
        oldDataProcessed[prefix].push(key);
    });

    // Step 2: Merge old data
    Object.keys(oldData).forEach(oldKey => {
        const prefix = extractPrefix(oldKey);
        if (!oldDataProcessed[prefix]) {
            // No new data with this prefix, add old data as is
            mergedData[oldKey] = oldData[oldKey];
        } else {
            const significantOld = oldData[oldKey].is_owned ||
                                   oldData[oldKey].is_for_trade ||
                                   oldData[oldKey].is_wanted;

            const anySignificantNew = oldDataProcessed[prefix].some(newKey =>
                newData[newKey].is_owned ||
                newData[newKey].is_for_trade ||
                newData[newKey].is_wanted
            );

            if (significantOld && !anySignificantNew) {
                // Old data is significant and no new significant data, retain old
                mergedData[oldKey] = oldData[oldKey];
            }
        }
    });

    // Step 3: Integrate Mega Logic
    // Drop all 'mega', 'shiny_mega', 'mega_x', or 'mega_y' entries that are 'is_unowned' 
    // if newData has matching instances with the required flags
    Object.keys(mergedData).forEach(key => {
        if (key.includes("mega")) {
            // Extract the leading numbers by removing "mega" from the key
            const leadingNumbersMatch = key.match(/^(\d+)/);
            if (leadingNumbersMatch) {
                const leadingNumbers = leadingNumbersMatch[1];
                // Find all related keys in newData that start with the same leading numbers
                const relatedNewKeys = Object.keys(newData).filter(newKey => 
                    newKey.startsWith(leadingNumbers)
                );

                // Determine if it's shiny or X/Y
                const isShinyMega = key.includes("shiny_mega");
                const isMegaX = key.toLowerCase().includes("mega_x");
                const isMegaY = key.toLowerCase().includes("mega_y");

                // If new data has an entry with mega === true (and optionally shiny),
                // then we drop the old unowned mega entry.
                const hasRelevantMegaInNew = relatedNewKeys.some(newKey => {
                    const entry = newData[newKey];
                    if (!entry) return false;

                    if (isShinyMega) {
                        return entry.mega === true && entry.shiny === true;
                    } else if (isMegaX || isMegaY) {
                        return entry.mega === true;
                    } else {
                        return entry.mega === true;
                    }
                });

                // Drop if we found a relevant new entry + old entry is_unowned
                if (hasRelevantMegaInNew && mergedData[key].is_unowned === true) {
                    delete mergedData[key];
                }
            }
        }
    });

    // Step 4: Ensure at most one instance per prefix has is_unowned: true
    const finalData = {};
    const unownedTracker = new Set();

    Object.keys(mergedData).forEach(key => {
        const prefix = extractPrefix(key);

        if (mergedData[key].is_unowned === true) {
            if (unownedTracker.has(prefix)) {
                // Set the extra unowned instances to owned: false
                mergedData[key].is_unowned = false;
            } else {
                unownedTracker.add(prefix);
            }
        }

        finalData[key] = mergedData[key];
    });

    // Step 5 (NEW): If a Pokémon has `.username` defined,
    // keep it only if `.username` === `username`. Otherwise, drop it.
    Object.keys(finalData).forEach(key => {
        if (finalData[key].username && finalData[key].username !== username) {
            delete finalData[key];
        }
    });

    console.log("Merge process completed.");
    return finalData;
};
