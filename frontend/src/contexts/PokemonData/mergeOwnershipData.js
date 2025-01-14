export const mergeOwnershipData = (oldData, newData, username) => {
    // Early exit if newData is empty
    if (!newData || Object.keys(newData).length === 0) {
        console.log("No newData provided. Skipping merge and returning oldData.");
        return oldData;
    }

    const mergedData = {};
    const oldDataProcessed = {};

    const extractPrefix = (key) => {
        const keyParts = key.split('_');
        keyParts.pop(); // Remove the UUID part
        return keyParts.join('_'); // Rejoin to form the actual prefix
    };

    console.log("Starting merge process...");

    // Early username filtering for newData
    Object.keys(newData).forEach(key => {
        const entry = newData[key];
        if (entry.username) {
            console.log(`Entry ${key} has username: ${entry.username}.`);

            if (entry.username === username) {
                console.log(`Keeping entry ${key} because username matches provided username.`);
            } else {
                console.log(`Dropping entry ${key} because username does not match provided username (${username}).`);
                delete newData[key];
                delete oldData[key];
            }
        }
    });

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

    // Ensure every key from newData is in mergedData
    Object.keys(newData).forEach(key => {
        mergedData[key] = newData[key];
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

            if (significantOld) {
                mergedData[oldKey] = oldData[oldKey];
            }
        }
    });

    // Step 3: Integrate Mega Logic
    Object.keys(mergedData).forEach(key => {
        if (key.includes("mega")) {
            const leadingNumbersMatch = key.match(/^(\d+)/);
            if (leadingNumbersMatch) {
                const leadingNumbers = leadingNumbersMatch[1];
                const relatedNewKeys = Object.keys(newData).filter(newKey => 
                    newKey.startsWith(leadingNumbers)
                );

                const isShinyMega = key.includes("shiny_mega");
                const isMegaX = key.toLowerCase().includes("mega_x");
                const isMegaY = key.toLowerCase().includes("mega_y");

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
                mergedData[key].is_unowned = false;
            } else {
                unownedTracker.add(prefix);
            }
        }

        finalData[key] = mergedData[key];
    });

    console.log(`finalData:`, finalData);
    console.log("Merge process completed.");
    return finalData;
};
